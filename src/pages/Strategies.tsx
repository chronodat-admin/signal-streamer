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
import { Plus, Layers, Settings, Eye, EyeOff, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

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
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exchange, setExchange] = useState('');
  const [timeframe, setTimeframe] = useState('');

  useEffect(() => {
    if (user) {
      fetchStrategies();
    }
  }, [user]);

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

    // Check plan limits (FREE = 1 strategy)
    if (strategies.length >= 1) {
      toast({
        title: 'Upgrade Required',
        description: 'Free plan allows only 1 strategy. Upgrade to Pro for more.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
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

  const deleteStrategy = async (strategy: Strategy) => {
    if (!confirm('Are you sure you want to delete this strategy?')) return;

    try {
      const { error } = await supabase
        .from('strategies')
        .update({ is_deleted: true })
        .eq('id', strategy.id);

      if (error) throw error;

      setStrategies(strategies.filter((s) => s.id !== strategy.id));

      toast({
        title: 'Strategy Deleted',
        description: 'The strategy has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete strategy',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Strategies</h1>
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
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Free Plan
              </Badge>
              <span className="text-sm text-muted-foreground">
                {strategies.length}/1 strategies used
              </span>
            </div>
            <Link to="/pricing">
              <Button variant="outline" size="sm">Upgrade</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Strategies List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : strategies.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No strategies yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first strategy to start receiving TradingView signals
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Strategy
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {strategies.map((strategy) => (
              <Card key={strategy.id} className="stat-card">
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
                        <span>Created {format(new Date(strategy.created_at), 'MMM d, yyyy')}</span>
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
                      <Link to={`/dashboard/strategies/${strategy.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Settings className="h-4 w-4" />
                          Setup
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteStrategy(strategy)}
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
      </div>
    </DashboardLayout>
  );
};

export default Strategies;
