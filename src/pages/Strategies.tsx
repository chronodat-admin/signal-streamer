import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Layers, Settings, Eye, EyeOff, Trash2, Loader2, ExternalLink, Copy, Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePreferences } from '@/hooks/usePreferences';
import { formatDate } from '@/lib/formatUtils';
import { canCreateStrategy, getUserPlan, getPlanLimits } from '@/lib/planUtils';
import { StrategiesPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { EmptyStrategies } from '@/components/dashboard/EmptyState';

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  exchange: string | null;
  timeframe: string | null;
  is_public: boolean;
  slug: string | null;
  created_at: string;
  signals_count?: number;
}

const Strategies = () => {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<'FREE' | 'PRO' | 'ELITE'>('FREE');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState<Strategy | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exchange, setExchange] = useState('');
  const [timeframe, setTimeframe] = useState('');

  useEffect(() => {
    if (user) {
      fetchStrategies();
      fetchUserPlan();
    }
  }, [user]);

  const fetchUserPlan = async () => {
    if (!user) return;
    const plan = await getUserPlan(user.id);
    setUserPlan(plan);
  };

  const fetchStrategies = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get signal counts for each strategy
      const strategiesWithCounts = await Promise.all(
        (data || []).map(async (strategy) => {
          const { count } = await supabase
            .from('signals')
            .select('*', { count: 'exact', head: true })
            .eq('strategy_id', strategy.id);
          return { ...strategy, signals_count: count || 0 };
        })
      );

      setStrategies(strategiesWithCounts);
    } catch (error) {
      console.error('Error fetching strategies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load strategies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    // Check plan limits using server-side function
    const { allowed, reason } = await canCreateStrategy(user.id, strategies.length);
    if (!allowed) {
      toast({
        title: 'Upgrade Required',
        description: reason || 'You have reached your strategy limit.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      // Generate unique slug using database function, or fallback to client-side generation
      let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      // Check if slug already exists for active strategies
      const { data: existingStrategy } = await supabase
        .from('strategies')
        .select('id')
        .eq('slug', slug)
        .eq('is_deleted', false)
        .eq('user_id', user.id)
        .maybeSingle();
      
      // If slug exists, append a number
      if (existingStrategy) {
        let counter = 1;
        let newSlug = `${slug}-${counter}`;
        let exists = true;
        
        while (exists) {
          const { data: check } = await supabase
            .from('strategies')
            .select('id')
            .eq('slug', newSlug)
            .eq('is_deleted', false)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (!check) {
            exists = false;
            slug = newSlug;
          } else {
            counter++;
            newSlug = `${slug}-${counter}`;
          }
        }
      }
      
      const { data, error } = await supabase
        .from('strategies')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          exchange: exchange.trim() || null,
          timeframe: timeframe.trim() || null,
          slug,
        })
        .select()
        .single();

      if (error) throw error;

      setStrategies([{ ...data, signals_count: 0 }, ...strategies]);
      setDialogOpen(false);
      setName('');
      setDescription('');
      setExchange('');
      setTimeframe('');

      toast({
        title: 'Strategy Created',
        description: 'Your strategy is ready. Set up webhooks to start receiving signals.',
      });
    } catch (error: any) {
      console.error('Error creating strategy:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create strategy',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const copyPublicLink = async (strategy: Strategy) => {
    if (!strategy.is_public || !strategy.slug) {
      toast({
        title: 'Strategy is not public',
        description: 'Please make the strategy public first.',
        variant: 'destructive',
      });
      return;
    }

    const publicUrl = `${window.location.origin}/s/${strategy.slug}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(strategy.id);
      toast({
        title: 'Link copied!',
        description: 'Public link copied to clipboard.',
      });
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const togglePublic = async (strategy: Strategy) => {
    try {
      const { error } = await supabase
        .from('strategies')
        .update({ is_public: !strategy.is_public })
        .eq('id', strategy.id);

      if (error) throw error;

      setStrategies(
        strategies.map((s) =>
          s.id === strategy.id ? { ...s, is_public: !s.is_public } : s
        )
      );

      toast({
        title: strategy.is_public ? 'Strategy is now private' : 'Strategy is now public',
        description: strategy.is_public
          ? 'Only you can see this strategy'
          : 'Anyone with the link can view signals',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update strategy visibility',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (strategy: Strategy) => {
    setStrategyToDelete(strategy);
    setDeleteDialogOpen(true);
  };

  const deleteStrategy = async () => {
    if (!strategyToDelete) return;

    setDeleting(true);

    try {
      // Use the combined function that handles both signal deletion and strategy soft-delete
      // This function uses SECURITY DEFINER to bypass RLS issues
      const { data: success, error: functionError } = await supabase.rpc('soft_delete_strategy', {
        p_strategy_id: strategyToDelete.id
      });

      if (functionError) {
        console.error('Error calling soft_delete_strategy:', functionError);
        
        // Fallback: try the old method if the new function doesn't exist
        console.warn('Trying fallback method...');
        
        // Delete alert logs first
        const { error: alertLogsError } = await supabase
          .from('alert_logs')
          .delete()
          .eq('strategy_id', strategyToDelete.id);

        if (alertLogsError && alertLogsError.code !== 'PGRST116') {
          console.warn('Alert logs deletion warning (may not exist):', alertLogsError);
        }

        // Delete trades (open and closed)
        const { error: tradesError } = await supabase
          .from('trades')
          .delete()
          .eq('strategy_id', strategyToDelete.id);

        if (tradesError && tradesError.code !== 'PGRST116') {
          console.warn('Trades deletion warning (may not exist):', tradesError);
        }

        // Delete signals
        const { error: signalsError } = await supabase
          .from('signals')
          .delete()
          .eq('strategy_id', strategyToDelete.id);

        if (signalsError && signalsError.code !== 'PGRST116') {
          console.warn('Signals deletion warning (may not exist):', signalsError);
        }

        // Delete strategy stats
        const { error: strategyStatsError } = await supabase
          .from('strategy_stats')
          .delete()
          .eq('strategy_id', strategyToDelete.id);

        if (strategyStatsError && strategyStatsError.code !== 'PGRST116') {
          console.warn('Strategy stats deletion warning (may not exist):', strategyStatsError);
        }

        // Delete daily trade stats
        const { error: tradeStatsDailyError } = await supabase
          .from('trade_stats_daily')
          .delete()
          .eq('strategy_id', strategyToDelete.id);

        if (tradeStatsDailyError && tradeStatsDailyError.code !== 'PGRST116') {
          console.warn('Daily trade stats deletion warning (may not exist):', tradeStatsDailyError);
        }

        // Then try to update strategy (without user_id filter to let RLS handle it)
        const { error: strategyError, count } = await supabase
          .from('strategies')
          .update({ is_deleted: true })
          .eq('id', strategyToDelete.id);

        if (strategyError) {
          console.error('Error deleting strategy (fallback):', strategyError);
          throw new Error(`Failed to delete strategy: ${strategyError.message || strategyError.code || 'Unknown error'}`);
        }

        if (count === 0) {
          throw new Error('Strategy not found or you do not have permission to delete it');
        }
      } else if (!success) {
        throw new Error('Strategy not found or you do not have permission to delete it');
      }

      console.log(`Strategy successfully soft-deleted: ${strategyToDelete.id}`);

      // Update local state
      setStrategies(strategies.filter((s) => s.id !== strategyToDelete.id));
      setDeleteDialogOpen(false);
      setStrategyToDelete(null);

      toast({
        title: 'Strategy Deleted',
        description: 'The strategy and all associated signals have been removed.',
      });
    } catch (error: any) {
      console.error('Error deleting strategy:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete strategy. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <StrategiesPageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Strategies</h1>
            <p className="text-muted-foreground">Manage your trading strategies</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Strategy
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Create Strategy</DialogTitle>
                <DialogDescription>
                  Set up a new strategy to receive TradingView signals
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createStrategy} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Strategy Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., BTC Breakout Strategy"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your strategy..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exchange">Exchange</Label>
                    <Input
                      id="exchange"
                      placeholder="e.g., Binance"
                      value={exchange}
                      onChange={(e) => setExchange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeframe">Timeframe</Label>
                    <Input
                      id="timeframe"
                      placeholder="e.g., 1H, 4H, 1D"
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Strategy
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Plan Info */}
        <Card className="border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {userPlan} Plan
              </Badge>
              <span className="text-sm text-muted-foreground">
                {strategies.length}/{getPlanLimits(userPlan).maxStrategies === -1 ? '∞' : getPlanLimits(userPlan).maxStrategies} strategies used
              </span>
            </div>
            {userPlan !== 'ELITE' && (
              <Link to="/pricing">
                <Button variant="outline" size="sm">Upgrade</Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Strategies List */}
        {strategies.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyStrategies onCreateClick={() => setDialogOpen(true)} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {strategies.map((strategy) => (
              <Card key={strategy.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{strategy.name}</h3>
                        {strategy.is_public ? (
                          <Badge className="signal-buy border text-xs">Public</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Private</Badge>
                        )}
                      </div>
                      {strategy.description && (
                        <p className="text-muted-foreground mb-2">{strategy.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {strategy.exchange && <span>📊 {strategy.exchange}</span>}
                        {strategy.timeframe && <span>⏱️ {strategy.timeframe}</span>}
                        <span>📈 {strategy.signals_count} signals</span>
                        <span>Created {formatDate(strategy.created_at, preferences.dateFormat)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 mr-4">
                        {strategy.is_public ? (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Switch
                          checked={strategy.is_public}
                          onCheckedChange={() => togglePublic(strategy)}
                        />
                      </div>
                      {strategy.is_public && strategy.slug && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyPublicLink(strategy)}
                            className="gap-2"
                            title="Copy public link"
                          >
                            {copiedLink === strategy.id ? (
                              <>
                                <Check className="h-4 w-4" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copy Link
                              </>
                            )}
                          </Button>
                          <Link to={`/s/${strategy.slug}`} target="_blank" rel="noopener noreferrer">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              title="Open public page in new window"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Open
                            </Button>
                          </Link>
                        </>
                      )}
                      <Link to={`/dashboard/strategies/${strategy.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Settings className="h-4 w-4" />
                          Setup
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(strategy)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Strategy</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this strategy?
              </DialogDescription>
            </DialogHeader>
            {strategyToDelete && (
              <div className="py-4 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Strategy:</p>
                  <p className="text-sm text-muted-foreground">{strategyToDelete.name}</p>
                </div>
                
                {/* Warning Alert */}
                <Alert variant="destructive" className="border-destructive/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-base font-semibold">Warning: This action cannot be undone</AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="text-sm font-medium mb-2">Deleting this strategy will permanently delete all related entries:</p>
                    <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                      <li>All signals associated with this strategy</li>
                      <li>All trades (both open and closed)</li>
                      <li>All alert logs</li>
                      <li>All strategy statistics and daily trade stats</li>
                    </ul>
                    <p className="text-sm font-semibold mt-3 text-destructive">
                      This action is permanent and cannot be reversed.
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setStrategyToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteStrategy}
                disabled={deleting}
                className="gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Strategy
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Strategies;
