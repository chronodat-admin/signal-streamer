import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, TrendingUp, TrendingDown, Clock, ArrowLeft, Loader2, Lock, User, UserPlus, UserMinus, Trophy, Target, BarChart3, Percent, DollarSign, CheckCircle } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatUtils';
import { useLanguage } from '@/i18n';
import StrategyDiscussion from '@/components/strategy/StrategyDiscussion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SEO } from '@/components/SEO';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  exchange: string | null;
  timeframe: string | null;
  is_public: boolean;
  created_at: string;
  user_id: string;
  verified_at?: string | null;
}

interface OwnerProfile {
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
}

interface Signal {
  id: string;
  signal_type: string;
  symbol: string;
  price: number;
  signal_time: string;
  created_at: string;
}

interface StrategyStats {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  open_trades: number;
  win_rate: number;
  total_pnl: number;
  total_pnl_percent: number;
  avg_pnl_percent: number;
  best_trade_pnl: number;
  worst_trade_pnl: number;
  profit_factor: number;
  max_drawdown: number;
  follower_count: number;
  subscriber_count: number;
  first_trade_at: string | null;
  last_trade_at: string | null;
}

interface Stats {
  total: number;
  buys: number;
  sells: number;
  latestSignal: Signal | null;
}

const PublicStrategy = () => {
  const { slug } = useParams<{ slug: string }>();
  const { preferences } = usePreferences();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isDarkMode = theme === 'dark';
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, buys: 0, sells: 0, latestSignal: null });
  const [performanceStats, setPerformanceStats] = useState<StrategyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPublicStrategy();
    }
  }, [slug]);

  useEffect(() => {
    if (user && strategy) {
      checkFollowStatus();
    }
  }, [user, strategy]);

  const checkFollowStatus = async () => {
    if (!user || !strategy) return;
    
    try {
      const { data } = await (supabase
        .from('strategy_subscriptions' as any)
        .select('id, status')
        .eq('user_id', user.id)
        .eq('strategy_id', strategy.id)
        .maybeSingle() as any);
      
      setIsFollowing(data?.status === 'active');
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/auth', { state: { redirect: `/s/${slug}` } });
      return;
    }

    if (!strategy) return;
    setFollowLoading(true);

    try {
      const { error } = await (supabase.rpc as any)('follow_strategy', {
        p_strategy_id: strategy.id
      });

      if (error) throw error;

      setIsFollowing(true);
      toast({
        title: t.subscription?.followed || 'Following!',
        description: t.subscription?.followDescription || 'You will be notified of new signals',
      });
      
      // Refresh stats
      fetchPerformanceStats(strategy.id);
    } catch (error: any) {
      console.error('Error following strategy:', error);
      toast({
        title: t.common.error,
        description: t.subscription?.failedToFollow || 'Failed to follow strategy',
        variant: 'destructive',
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!user || !strategy) return;
    setFollowLoading(true);

    try {
      const { error } = await (supabase.rpc as any)('unfollow_strategy', {
        p_strategy_id: strategy.id
      });

      if (error) throw error;

      setIsFollowing(false);
      toast({
        title: t.subscription?.unfollowed || 'Unfollowed',
        description: 'You will no longer receive notifications',
      });
      
      // Refresh stats
      fetchPerformanceStats(strategy.id);
    } catch (error: any) {
      console.error('Error unfollowing strategy:', error);
      toast({
        title: t.common.error,
        description: t.subscription?.failedToUnfollow || 'Failed to unfollow strategy',
        variant: 'destructive',
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const fetchPerformanceStats = async (strategyId: string) => {
    try {
      const { data, error } = await supabase
        .from('strategy_stats')
        .select('*')
        .eq('strategy_id', strategyId)
        .maybeSingle();

      if (!error && data) {
        // Map the data to our interface, providing defaults for any missing fields
        setPerformanceStats({
          total_trades: data.total_trades || 0,
          winning_trades: data.winning_trades || 0,
          losing_trades: data.losing_trades || 0,
          open_trades: (data as any).open_trades || 0,
          win_rate: Number(data.win_rate) || 0,
          total_pnl: Number(data.total_pnl) || 0,
          total_pnl_percent: Number((data as any).total_pnl_percent) || 0,
          avg_pnl_percent: Number((data as any).avg_pnl_percent) || 0,
          best_trade_pnl: Number((data as any).best_trade_pnl) || 0,
          worst_trade_pnl: Number((data as any).worst_trade_pnl) || 0,
          profit_factor: Number(data.profit_factor) || 0,
          max_drawdown: Number(data.max_drawdown) || 0,
          follower_count: (data as any).follower_count || 0,
          subscriber_count: (data as any).subscriber_count || 0,
          first_trade_at: (data as any).first_trade_at || null,
          last_trade_at: data.last_signal_at || null,
        });
      }
    } catch (error) {
      console.error('Error fetching performance stats:', error);
    }
  };

  const fetchPublicStrategy = async () => {
    if (!slug) return;

    try {
      // Try to find by slug first, then by ID
      let { data: strategyData, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('slug', slug)
        .eq('is_deleted', false)
        .maybeSingle();

      if (!strategyData) {
        // Try by ID
        const { data, error: idError } = await supabase
          .from('strategies')
          .select('*')
          .eq('id', slug)
          .eq('is_deleted', false)
          .maybeSingle();

        if (idError) throw idError;
        strategyData = data;
      }

      if (!strategyData) {
        setLoading(false);
        setIsPrivate(false); // Not private, just not found
        return;
      }

      if (!strategyData.is_public) {
        setIsPrivate(true);
        setLoading(false);
        return;
      }

      setStrategy(strategyData);

      // Fetch owner profile
      if (strategyData.user_id) {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('user_id', strategyData.user_id)
          .maybeSingle();
        
        if (ownerData) {
          setOwner(ownerData);
        }
      }

      // Fetch performance stats
      await fetchPerformanceStats(strategyData.id);

      // Fetch signals (last 50)
      const { data: signalsData, error: signalsError } = await supabase
        .from('signals')
        .select('*')
        .eq('strategy_id', strategyData.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (signalsError) throw signalsError;
      setSignals(signalsData || []);

      // Calculate stats
      const allSignals = signalsData || [];
      const buys = allSignals.filter((s) => 
        s.signal_type.toUpperCase() === 'BUY' || s.signal_type.toUpperCase() === 'LONG'
      ).length;
      const sells = allSignals.filter((s) => 
        s.signal_type.toUpperCase() === 'SELL' || s.signal_type.toUpperCase() === 'SHORT'
      ).length;

      setStats({
        total: allSignals.length,
        buys,
        sells,
        latestSignal: allSignals[0] || null,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching public strategy:', error);
      setLoading(false);
      setIsPrivate(false);
      setStrategy(null);
    }
  };

  const getSignalBadge = (type: string) => {
    const upperType = type.toUpperCase();
    if (upperType === 'BUY' || upperType === 'LONG') {
      return <Badge variant="outline" className="signal-buy border">BUY</Badge>;
    }
    if (upperType === 'SELL' || upperType === 'SHORT') {
      return <Badge variant="outline" className="signal-sell border">SELL</Badge>;
    }
    return <Badge variant="outline" className="signal-neutral border">{upperType}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">{t.publicStrategy.strategyPrivate}</h1>
          <p className="text-muted-foreground mb-6">
            {t.publicStrategy.strategyPrivateDescription}
          </p>
          <Link to="/">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t.publicStrategy.goHome}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">{t.publicStrategy.strategyNotFound}</h1>
          <p className="text-muted-foreground mb-6">
            {t.publicStrategy.strategyNotFoundDescription}
          </p>
          <Link to="/">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t.publicStrategy.goHome}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={strategy ? `${strategy.name} - TradeMoq` : 'Public Strategy - TradeMoq'}
        description={strategy ? `View ${strategy.name} trading strategy performance, signals, and analytics on TradeMoq. ${strategy.description || 'Track real-time trading signals and performance metrics.'}` : 'View public trading strategy performance and signals on TradeMoq'}
        keywords={`${strategy?.name || 'trading strategy'}, trading signals, strategy performance, public strategy, ${strategy?.exchange || ''}, ${strategy?.timeframe || ''}`}
        canonical={`https://trademoq.com/s/${slug || ''}`}
      />
      <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-xl overflow-hidden" style={{ height: '64px' }}>
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center group h-full">
            <img
              src={isDarkMode ? '/tm_logo.svg' : '/tm_logo_black.svg'}
              alt="TradeMoq Logo"
              className="h-48 w-auto transition-all duration-300 group-hover:scale-105"
              key={theme}
            />
          </Link>
          <div className="flex items-center gap-3">
            {owner && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {t.publicStrategy.sharedBy} {owner.full_name || owner.email?.split('@')[0] || 'Anonymous'}
                </span>
              </div>
            )}
            {/* Appearance Controls */}
            <div className="flex items-center gap-1 border-l border-border pl-3 ml-3">
              <LanguageSwitcher />
              <ColorSchemePicker />
              <ThemeToggle />
            </div>
            <Link to="/auth">
              <Button size="sm">{t.publicStrategy.getStarted}</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-6xl pt-24">
        {/* Strategy Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold">{strategy.name}</h1>
                <Badge className="signal-buy border">{t.publicStrategy.public}</Badge>
                {strategy.verified_at && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="border-blue-500 text-blue-500 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {t.performance?.verified || 'Verified'}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Performance verified since {formatDate(strategy.verified_at, preferences.dateFormat)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {strategy.description && (
                <p className="text-lg text-muted-foreground mb-4">{strategy.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                {strategy.exchange && <span>📊 {strategy.exchange}</span>}
                {strategy.timeframe && <span>⏱️ {strategy.timeframe}</span>}
                <span>{t.publicStrategy.created} {formatDate(strategy.created_at, preferences.dateFormat)}</span>
                {performanceStats && performanceStats.follower_count > 0 && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {performanceStats.follower_count} {t.performance?.followers || 'followers'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Follow Button */}
            <div className="flex-shrink-0">
              {isFollowing ? (
                <Button
                  variant="outline"
                  onClick={handleUnfollow}
                  disabled={followLoading}
                  className="gap-2"
                >
                  {followLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4" />
                  )}
                  {t.subscription?.following || 'Following'}
                </Button>
              ) : (
                <Button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className="gap-2 glow-effect"
                >
                  {followLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {t.subscription?.follow || 'Follow'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Performance Stats Cards */}
        {performanceStats && performanceStats.total_trades >= 5 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Win Rate */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.performance?.winRate || 'Win Rate'}</p>
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <p className={`text-2xl font-bold ${performanceStats.win_rate >= 50 ? 'text-buy' : 'text-destructive'}`}>
                  {performanceStats.win_rate.toFixed(1)}%
                </p>
                <Progress 
                  value={performanceStats.win_rate} 
                  className="mt-2 h-1.5"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {performanceStats.winning_trades}W / {performanceStats.losing_trades}L
                </p>
              </CardContent>
            </Card>

            {/* Total P&L */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.performance?.totalPnL || 'Total P&L'}</p>
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <p className={`text-2xl font-bold ${performanceStats.total_pnl_percent >= 0 ? 'text-buy' : 'text-destructive'}`}>
                  {performanceStats.total_pnl_percent >= 0 ? '+' : ''}{performanceStats.total_pnl_percent.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Avg: {performanceStats.avg_pnl_percent >= 0 ? '+' : ''}{performanceStats.avg_pnl_percent.toFixed(2)}% per trade
                </p>
              </CardContent>
            </Card>

            {/* Profit Factor */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.performance?.profitFactor || 'Profit Factor'}</p>
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <p className={`text-2xl font-bold ${performanceStats.profit_factor >= 1 ? 'text-buy' : 'text-destructive'}`}>
                  {performanceStats.profit_factor > 99 ? '∞' : performanceStats.profit_factor.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {performanceStats.profit_factor >= 1.5 ? 'Excellent' : performanceStats.profit_factor >= 1 ? 'Good' : 'Needs improvement'}
                </p>
              </CardContent>
            </Card>

            {/* Total Trades */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.performance?.totalTrades || 'Total Trades'}</p>
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold">{performanceStats.total_trades}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {performanceStats.open_trades > 0 && `${performanceStats.open_trades} open`}
                  {performanceStats.last_trade_at && (
                    <span className="block">Last: {formatDate(performanceStats.last_trade_at, preferences.dateFormat)}</span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Fallback to basic stats if no performance data */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.publicStrategy.totalSignals}</p>
                    <p className="text-2xl font-semibold">{stats.total}</p>
                  </div>
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.publicStrategy.buySignals}</p>
                    <p className="text-2xl font-semibold text-buy">{stats.buys}</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-buy" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.publicStrategy.sellSignals}</p>
                    <p className="text-2xl font-semibold text-destructive">{stats.sells}</p>
                  </div>
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.publicStrategy.latestSignal}</p>
                    {stats.latestSignal ? (
                      <div className="mt-1">{getSignalBadge(stats.latestSignal.signal_type)}</div>
                    ) : (
                      <p className="text-lg font-semibold">-</p>
                    )}
                  </div>
                  <Clock className="h-5 w-5 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Performance Metrics */}
        {performanceStats && performanceStats.total_trades >= 5 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                {t.performance?.performanceMetrics || 'Performance Metrics'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">{t.performance?.bestTrade || 'Best Trade'}</p>
                  <p className="text-lg font-semibold text-buy">
                    +{performanceStats.best_trade_pnl > 0 ? formatCurrency(performanceStats.best_trade_pnl, preferences.currency) : '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.performance?.worstTrade || 'Worst Trade'}</p>
                  <p className="text-lg font-semibold text-destructive">
                    {formatCurrency(performanceStats.worst_trade_pnl, preferences.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.performance?.firstTrade || 'First Trade'}</p>
                  <p className="text-lg font-semibold">
                    {performanceStats.first_trade_at ? formatDate(performanceStats.first_trade_at, preferences.dateFormat) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.performance?.lastTrade || 'Last Trade'}</p>
                  <p className="text-lg font-semibold">
                    {performanceStats.last_trade_at ? formatDate(performanceStats.last_trade_at, preferences.dateFormat) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signals Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              {t.publicStrategy.recentSignals}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {signals.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t.publicStrategy.noSignalsYet}</h3>
                <p className="text-muted-foreground">
                  {t.publicStrategy.noSignalsDescription}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.publicStrategy.signal}</TableHead>
                      <TableHead>{t.publicStrategy.symbol}</TableHead>
                      <TableHead>{t.publicStrategy.price}</TableHead>
                      <TableHead>{t.publicStrategy.time}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signals.map((signal) => (
                      <TableRow key={signal.id}>
                        <TableCell>{getSignalBadge(signal.signal_type)}</TableCell>
                        <TableCell>
                          <span className="font-mono font-medium">{signal.symbol}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{formatCurrency(Number(signal.price), preferences.currency)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {formatDateTime(signal.created_at, preferences.dateFormat)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discussion Section */}
        {strategy && <StrategyDiscussion strategyId={strategy.id} />}

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            {t.publicStrategy.wantToTrack}
          </p>
          <Link to="/auth">
            <Button className="glow-effect">{t.publicStrategy.getStartedFree}</Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default PublicStrategy;
