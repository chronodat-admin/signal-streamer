import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { usePreferences } from '@/hooks/usePreferences';
import { formatCurrency, formatDate } from '@/lib/formatUtils';
import { useLanguage } from '@/i18n';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  BarChart3,
  Star,
  Crown,
  Settings,
  ExternalLink,
  Loader2,
  ArrowUpRight,
  Target,
  Sparkles
} from 'lucide-react';

interface StrategyWithStats {
  id: string;
  name: string;
  slug: string | null;
  is_public: boolean;
  is_monetized: boolean;
  allow_free_follow: boolean;
  verified_at: string | null;
  stats: {
    total_trades: number;
    win_rate: number;
    total_pnl_percent: number;
    profit_factor: number;
    follower_count: number;
    subscriber_count: number;
    ranking_score: number;
  } | null;
}

interface CreatorStats {
  totalFollowers: number;
  totalSubscribers: number;
  totalEarnings: number;
  pendingEarnings: number;
  strategiesCount: number;
  publicStrategiesCount: number;
}

const CreatorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { preferences } = usePreferences();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState<StrategyWithStats[]>([]);
  const [creatorStats, setCreatorStats] = useState<CreatorStats>({
    totalFollowers: 0,
    totalSubscribers: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    strategiesCount: 0,
    publicStrategiesCount: 0
  });
  const [updatingStrategy, setUpdatingStrategy] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCreatorData();
    }
  }, [user]);

  const fetchCreatorData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch strategies with their stats
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('strategies')
        .select(`
          id,
          name,
          slug,
          is_public,
          is_monetized,
          allow_free_follow,
          verified_at
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (strategiesError) throw strategiesError;

      // Fetch stats for each strategy
      const strategiesWithStats: StrategyWithStats[] = [];
      let totalFollowers = 0;
      let totalSubscribers = 0;

      for (const strategy of strategiesData || []) {
        const { data: statsData } = await supabase
          .from('strategy_stats')
          .select('*')
          .eq('strategy_id', strategy.id)
          .maybeSingle();

        strategiesWithStats.push({
          ...strategy,
          stats: statsData ? {
            total_trades: statsData.total_trades,
            win_rate: Number(statsData.win_rate),
            total_pnl_percent: Number(statsData.total_pnl_percent),
            profit_factor: Number(statsData.profit_factor),
            follower_count: statsData.follower_count,
            subscriber_count: statsData.subscriber_count,
            ranking_score: Number(statsData.ranking_score)
          } : null
        });

        if (statsData) {
          totalFollowers += statsData.follower_count || 0;
          totalSubscribers += statsData.subscriber_count || 0;
        }
      }

      setStrategies(strategiesWithStats);

      // Calculate creator stats
      const publicStrategies = strategiesWithStats.filter(s => s.is_public);
      
      // Fetch earnings
      const { data: earningsData } = await supabase
        .from('creator_earnings')
        .select('net_amount, payout_status')
        .eq('user_id', user.id);

      const totalEarnings = earningsData?.reduce((sum, e) => sum + Number(e.net_amount), 0) || 0;
      const pendingEarnings = earningsData?.filter(e => e.payout_status === 'pending')
        .reduce((sum, e) => sum + Number(e.net_amount), 0) || 0;

      setCreatorStats({
        totalFollowers,
        totalSubscribers,
        totalEarnings,
        pendingEarnings,
        strategiesCount: strategiesWithStats.length,
        publicStrategiesCount: publicStrategies.length
      });

    } catch (error) {
      console.error('Error fetching creator data:', error);
      toast({
        title: t.common.error,
        description: 'Failed to load creator dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStrategyVisibility = async (strategyId: string, isPublic: boolean) => {
    setUpdatingStrategy(strategyId);
    try {
      const { error } = await supabase
        .from('strategies')
        .update({ is_public: isPublic })
        .eq('id', strategyId);

      if (error) throw error;

      setStrategies(prev => prev.map(s => 
        s.id === strategyId ? { ...s, is_public: isPublic } : s
      ));

      toast({
        title: 'Strategy updated',
        description: isPublic ? 'Strategy is now public' : 'Strategy is now private',
      });
    } catch (error) {
      console.error('Error updating strategy:', error);
      toast({
        title: t.common.error,
        description: 'Failed to update strategy',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStrategy(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
              <Crown className="h-8 w-8 text-primary" />
              Creator Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your strategies and track your performance
            </p>
          </div>
          <Link to="/leaderboard">
            <Button variant="outline" className="gap-2">
              <Trophy className="h-4 w-4" />
              View Leaderboard
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Followers</p>
                  <p className="text-2xl font-bold">{creatorStats.totalFollowers}</p>
                </div>
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Paid Subscribers</p>
                  <p className="text-2xl font-bold">{creatorStats.totalSubscribers}</p>
                </div>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Earnings</p>
                  <p className="text-2xl font-bold">{formatCurrency(creatorStats.totalEarnings, preferences.currency)}</p>
                </div>
                <DollarSign className="h-5 w-5 text-buy" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Public Strategies</p>
                  <p className="text-2xl font-bold">{creatorStats.publicStrategiesCount} / {creatorStats.strategiesCount}</p>
                </div>
                <Eye className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Your Strategies
            </CardTitle>
            <CardDescription>
              Manage visibility and monetization for your strategies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {strategies.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No strategies yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first strategy to start building your audience
                </p>
                <Link to="/dashboard/strategies">
                  <Button>Create Strategy</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Strategy</TableHead>
                      <TableHead className="text-center">Visibility</TableHead>
                      <TableHead className="text-center">Performance</TableHead>
                      <TableHead className="text-center">Followers</TableHead>
                      <TableHead className="text-center">Rank Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategies.map((strategy) => (
                      <TableRow key={strategy.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{strategy.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {strategy.verified_at && (
                                  <Badge variant="outline" className="text-xs border-blue-500 text-blue-500">
                                    Verified
                                  </Badge>
                                )}
                                {strategy.stats && strategy.stats.total_trades >= 10 && (
                                  <span className="text-xs text-muted-foreground">
                                    {strategy.stats.total_trades} trades
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={strategy.is_public}
                              onCheckedChange={(checked) => toggleStrategyVisibility(strategy.id, checked)}
                              disabled={updatingStrategy === strategy.id}
                            />
                            <span className="text-xs text-muted-foreground">
                              {strategy.is_public ? 'Public' : 'Private'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {strategy.stats && strategy.stats.total_trades >= 5 ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-center gap-2">
                                <Target className="h-3 w-3 text-muted-foreground" />
                                <span className={`font-medium ${strategy.stats.win_rate >= 50 ? 'text-buy' : 'text-destructive'}`}>
                                  {strategy.stats.win_rate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                <span className={`text-sm ${strategy.stats.total_pnl_percent >= 0 ? 'text-buy' : 'text-destructive'}`}>
                                  {strategy.stats.total_pnl_percent >= 0 ? '+' : ''}{strategy.stats.total_pnl_percent.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not enough data</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span>{strategy.stats?.follower_count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {strategy.stats ? (
                            <span className="font-mono text-sm">
                              {strategy.stats.ranking_score.toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/dashboard/strategies/${strategy.id}`}>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </Link>
                            {strategy.is_public && (
                              <Link to={`/s/${strategy.slug || strategy.id}`} target="_blank">
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips to Grow */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Tips to Grow Your Following
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-buy" />
                  Consistent Performance
                </h4>
                <p className="text-sm text-muted-foreground">
                  Maintain a win rate above 50% and positive P&L to rank higher on the leaderboard.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-buy" />
                  More Trades = More Trust
                </h4>
                <p className="text-sm text-muted-foreground">
                  Strategies with 50+ verified trades get more visibility and follower trust.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-buy" />
                  Engage Your Community
                </h4>
                <p className="text-sm text-muted-foreground">
                  Share your strategy link on social media and trading communities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreatorDashboard;
