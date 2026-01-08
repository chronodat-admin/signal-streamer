import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, TrendingUp, Layers, Clock, ArrowRight, Plus, Sparkles, BarChart3, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Target, Trophy } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatUtils';
import { getUserPlan, getHistoryDateLimit } from '@/lib/planUtils';
import { formatPnL } from '@/lib/pnlUtils';
import { DashboardPageSkeleton, StatsCardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { EmptyTrades } from '@/components/dashboard/EmptyState';

interface Signal {
  id: string;
  signal_type: string;
  symbol: string;
  price: number;
  signal_time: string;
  created_at: string;
  strategy_id: string;
  strategies?: {
    name: string;
  };
}

interface Trade {
  id: string;
  strategy_id: string;
  strategy_name: string;
  symbol: string;
  direction: 'long' | 'short';
  status: 'open' | 'closed' | 'cancelled';
  entry_price: number;
  exit_price: number | null;
  entry_time: string;
  exit_time: string | null;
  pnl: number | null;
  pnl_percent: number | null;
  created_at: string;
}

interface DashboardStats {
  signalsToday: number;
  signalsWeek: number;
  mostActiveStrategy: string | null;
  mostActiveSymbol: string | null;
  totalPnL: number;
  totalTrades: number;
  winRate: number;
  openPositions: number;
  bestTrade: number | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    signalsToday: 0,
    signalsWeek: 0,
    mostActiveStrategy: null,
    mostActiveSymbol: null,
    totalPnL: 0,
    totalTrades: 0,
    winRate: 0,
    openPositions: 0,
    bestTrade: null,
  });
  const [loading, setLoading] = useState(true);
  const [strategiesCount, setStrategiesCount] = useState(0);
  const [allSignals, setAllSignals] = useState<Signal[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Get user plan and apply history limits
      const plan = await getUserPlan(user.id);
      const historyLimit = getHistoryDateLimit(plan);
      
      let query = supabase
        .from('signals')
        .select(`
          *,
          strategies (name)
        `)
        .eq('user_id', user.id);

      // Apply history limit if not unlimited
      if (historyLimit) {
        query = query.gte('created_at', historyLimit.toISOString());
      }

      // Fetch all signals for P&L calculation
      const { data: allSignalsData, error: allSignalsError } = await query
        .order('created_at', { ascending: false });

      if (allSignalsError) throw allSignalsError;
      setAllSignals(allSignalsData || []);

      // Get recent 10 signals for display
      const recentSignals = (allSignalsData || []).slice(0, 10);
      setSignals(recentSignals);

      // Fetch trades (unique buy/sell pairs) for dashboard
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select(`
          id,
          strategy_id,
          symbol,
          direction,
          status,
          entry_price,
          exit_price,
          entry_time,
          exit_time,
          pnl,
          pnl_percent,
          created_at,
          strategies (name)
        `)
        .eq('user_id', user.id)
        .order('entry_time', { ascending: false })
        .limit(10);

      if (tradesError) {
        console.warn('Error fetching trades, using signals instead:', tradesError);
      } else {
        const formattedTrades = (tradesData || []).map((t: any) => ({
          id: t.id,
          strategy_id: t.strategy_id,
          strategy_name: t.strategies?.name || 'Unknown',
          symbol: t.symbol,
          direction: t.direction,
          status: t.status,
          entry_price: t.entry_price,
          exit_price: t.exit_price,
          entry_time: t.entry_time,
          exit_time: t.exit_time,
          pnl: t.pnl,
          pnl_percent: t.pnl_percent,
          created_at: t.created_at,
        }));
        setTrades(formattedTrades);
      }

      const { count: stratCount } = await supabase
        .from('strategies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      setStrategiesCount(stratCount || 0);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const signalsToday = (allSignalsData || []).filter(
        (s) => new Date(s.created_at) >= todayStart
      ).length;

      const signalsWeek = (allSignalsData || []).filter(
        (s) => new Date(s.created_at) >= weekStart
      ).length;

      const strategyCount: Record<string, number> = {};
      (allSignalsData || []).forEach((s) => {
        const name = s.strategies?.name || 'Unknown';
        strategyCount[name] = (strategyCount[name] || 0) + 1;
      });
      const mostActiveStrategy = Object.entries(strategyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      const symbolCount: Record<string, number> = {};
      (allSignalsData || []).forEach((s) => {
        symbolCount[s.symbol] = (symbolCount[s.symbol] || 0) + 1;
      });
      const mostActiveSymbol = Object.entries(symbolCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      // Calculate P&L from trades (more accurate than signals)
      const { data: closedTradesData } = await supabase
        .from('trades')
        .select('pnl, pnl_percent')
        .eq('user_id', user.id)
        .eq('status', 'closed');

      const closedTrades = closedTradesData || [];
      const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl_percent || 0), 0);
      const totalTrades = closedTrades.length;
      const winningTrades = closedTrades.filter((t) => (t.pnl_percent || 0) > 0).length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      // Count open positions
      const { count: openCount } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'open');

      // Find best trade
      const bestTrade = closedTrades.length > 0
        ? Math.max(...closedTrades.map(t => t.pnl_percent || 0))
        : null;

      setStats({
        signalsToday,
        signalsWeek,
        mostActiveStrategy,
        mostActiveSymbol,
        totalPnL,
        totalTrades,
        winRate,
        openPositions: openCount || 0,
        bestTrade,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSignalBadge = (type: string) => {
    const upperType = type.toUpperCase();
    if (upperType === 'BUY' || upperType === 'LONG') {
      return <Badge variant="outline" className="signal-buy border px-3 py-1">BUY</Badge>;
    }
    if (upperType === 'SELL' || upperType === 'SHORT') {
      return <Badge variant="outline" className="signal-sell border px-3 py-1">SELL</Badge>;
    }
    return <Badge variant="outline" className="signal-neutral border px-3 py-1">{upperType}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardPageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted-foreground text-lg">Track and manage your trading signals</p>
          </div>
          <Link to="/dashboard/strategies">
            <Button className="gap-2 shadow-md hover:shadow-lg transition-all">
              <Plus className="h-4 w-4" />
              New Strategy
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total P&L</p>
                  <p className={`text-3xl font-semibold tracking-tight ${formatPnL(stats.totalPnL).className}`}>
                    {formatPnL(stats.totalPnL).value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.totalTrades} closed trades</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className={`h-5 w-5 ${stats.totalPnL >= 0 ? 'text-buy' : 'text-sell'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Win Rate</p>
                  <p className="text-3xl font-semibold tracking-tight">{stats.winRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalTrades > 0 ? `${Math.round((stats.winRate / 100) * stats.totalTrades)} wins` : 'No trades'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Signals Today</p>
                  <p className="text-3xl font-semibold tracking-tight">{stats.signalsToday}</p>
                  <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">This Week</p>
                  <p className="text-3xl font-semibold tracking-tight">{stats.signalsWeek}</p>
                  <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Strategies</p>
                  <p className="text-3xl font-semibold tracking-tight">{strategiesCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active strategies</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Top Symbol</p>
                  <p className="text-2xl font-semibold mt-1 font-mono tracking-tight">{stats.mostActiveSymbol || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-1">Most signals</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Open Positions</p>
                  <p className="text-3xl font-semibold tracking-tight">{stats.openPositions}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active trades</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Best Trade</p>
                  <p className={`text-3xl font-semibold tracking-tight ${stats.bestTrade !== null && stats.bestTrade > 0 ? 'text-buy' : ''}`}>
                    {stats.bestTrade !== null ? `+${stats.bestTrade.toFixed(2)}%` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Top performer</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Open Trades */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Open Trades
            </CardTitle>
            {trades.filter(t => t.status === 'open').length > 0 && (
              <Link to="/dashboard/signals">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                  View All Signals <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {trades.filter(t => t.status === 'open').length === 0 ? (
              <EmptyTrades type="open" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Direction</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Entry Price</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Entry Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.filter(t => t.status === 'open').map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>
                          <Badge variant="outline" className={trade.direction === 'long' ? 'signal-buy border px-3 py-1' : 'signal-sell border px-3 py-1'}>
                            {trade.direction === 'long' ? (
                              <span className="flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                LONG
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <ArrowDownRight className="h-3 w-3" />
                                SHORT
                              </span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-medium">{trade.symbol}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{formatCurrency(Number(trade.entry_price), preferences.currency)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">—</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">{trade.strategy_name}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {formatDateTime(trade.entry_time, preferences.dateFormat)}
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

        {/* Closed Trades */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Closed Trades
            </CardTitle>
            {trades.filter(t => t.status === 'closed').length > 0 && (
              <Link to="/dashboard/signals">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                  View All Signals <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {trades.filter(t => t.status === 'closed').length === 0 ? (
              <EmptyTrades type="closed" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Direction</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Exit</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.filter(t => t.status === 'closed').map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>
                          <Badge variant="outline" className={trade.direction === 'long' ? 'signal-buy border px-3 py-1' : 'signal-sell border px-3 py-1'}>
                            {trade.direction === 'long' ? (
                              <span className="flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                LONG
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <ArrowDownRight className="h-3 w-3" />
                                SHORT
                              </span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-medium">{trade.symbol}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{formatCurrency(Number(trade.entry_price), preferences.currency)}</span>
                        </TableCell>
                        <TableCell>
                          {trade.exit_price ? (
                            <span className="font-mono">{formatCurrency(Number(trade.exit_price), preferences.currency)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {trade.pnl_percent !== null ? (
                            <span className={`font-semibold ${formatPnL(trade.pnl_percent).className}`}>
                              {formatPnL(trade.pnl_percent).value}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">{trade.strategy_name}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {formatDateTime(trade.entry_time, preferences.dateFormat)}
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
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
