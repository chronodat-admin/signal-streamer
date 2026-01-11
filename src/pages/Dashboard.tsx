import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, TrendingUp, Layers, Clock, ArrowRight, Plus, Sparkles, BarChart3, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Target, Trophy, Shield } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { useAdmin } from '@/hooks/useAdmin';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatUtils';
import { getUserPlan, getHistoryDateLimit } from '@/lib/planUtils';
import { formatPnL } from '@/lib/pnlUtils';
import { DashboardPageSkeleton, StatsCardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { EmptyTrades } from '@/components/dashboard/EmptyState';
import { DateFilter, DateFilterType, DateRange } from '@/components/dashboard/DateFilter';
import { useLanguage } from '@/i18n';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

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
  const { isAdmin } = useAdmin();
  const { t } = useLanguage();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
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
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Helper function to get date range based on filter type
  const getDateRange = (filter: DateFilterType, customRange?: DateRange): { from: Date | null; to: Date | null } => {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today

    switch (filter) {
      case 'today': {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        return { from: todayStart, to: now };
      }
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);
        return { from: weekStart, to: now };
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        return { from: monthStart, to: now };
      }
      case 'year': {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        yearStart.setHours(0, 0, 0, 0);
        return { from: yearStart, to: now };
      }
      case 'custom': {
        if (customRange?.from && customRange?.to) {
          const from = new Date(customRange.from);
          from.setHours(0, 0, 0, 0);
          const to = new Date(customRange.to);
          to.setHours(23, 59, 59, 999);
          return { from, to };
        }
        return { from: null, to: null };
      }
      default:
        return { from: null, to: null };
    }
  };

  // Filter trades based on selected date range
  const filteredTrades = useMemo(() => {
    if (dateFilter === 'all') {
      return allTrades;
    }

    const range = getDateRange(dateFilter, dateRange);
    if (!range.from || !range.to) {
      return allTrades;
    }

    return allTrades.filter((trade) => {
      const tradeDate = new Date(trade.entry_time);
      return tradeDate >= range.from! && tradeDate <= range.to!;
    });
  }, [allTrades, dateFilter, dateRange]);

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const closedTrades = filteredTrades.filter((t) => t.status === 'closed');
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl_percent || 0), 0);
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter((t) => (t.pnl_percent || 0) > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const openPositions = filteredTrades.filter((t) => t.status === 'open').length;
    const bestTrade = closedTrades.length > 0
      ? Math.max(...closedTrades.map(t => t.pnl_percent || 0))
      : null;

    return {
      totalPnL,
      totalTrades,
      winRate,
      openPositions,
      bestTrade,
    };
  }, [filteredTrades]);

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

      // Fetch all trades for filtering (we'll limit display later)
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
        .order('entry_time', { ascending: false });

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
        setAllTrades(formattedTrades);
        setTrades(formattedTrades.slice(0, 10)); // Keep recent 10 for display
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

      // Stats will be calculated from filtered trades in useMemo
      setStats({
        signalsToday,
        signalsWeek,
        mostActiveStrategy,
        mostActiveSymbol,
        totalPnL: 0,
        totalTrades: 0,
        winRate: 0,
        openPositions: 0,
        bestTrade: null,
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
            <h1 className="text-4xl font-display font-bold tracking-tight mb-2">{t.dashboard.title}</h1>
            <p className="text-muted-foreground text-lg">{t.dashboard.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Appearance Controls */}
            <div className="flex items-center gap-1">
              <LanguageSwitcher />
              <ColorSchemePicker />
              <ThemeToggle />
            </div>
            <DateFilter
              value={dateFilter}
              dateRange={dateRange}
              onFilterChange={(filter, range) => {
                setDateFilter(filter);
                setDateRange(range);
              }}
            />
            {isAdmin && (
              <Link to="/admin/users">
                <Button variant="outline" className="gap-2 border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 dark:hover:bg-purple-500/10">
                  <Shield className="h-4 w-4" />
                  {t.nav.adminPanel}
                </Button>
              </Link>
            )}
            <Link to="/dashboard/strategies">
              <Button className="gap-2 shadow-md hover:shadow-lg transition-all">
                <Plus className="h-4 w-4" />
                {t.dashboard.newStrategy}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.dashboard.totalPnL}</p>
                  <p className={`text-3xl font-semibold tracking-tight ${formatPnL(filteredStats.totalPnL).className}`}>
                    {formatPnL(filteredStats.totalPnL).value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{filteredStats.totalTrades} {t.dashboard.closedTrades}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className={`h-5 w-5 ${filteredStats.totalPnL >= 0 ? 'text-buy' : 'text-sell'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.dashboard.winRate}</p>
                  <p className="text-3xl font-semibold tracking-tight">{filteredStats.winRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {filteredStats.totalTrades > 0 ? `${Math.round((filteredStats.winRate / 100) * filteredStats.totalTrades)} ${t.dashboard.wins}` : t.dashboard.noTrades}
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
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.dashboard.signalsToday}</p>
                  <p className="text-3xl font-semibold tracking-tight">{stats.signalsToday}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.dashboard.last24Hours}</p>
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
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.dashboard.thisWeek}</p>
                  <p className="text-3xl font-semibold tracking-tight">{stats.signalsWeek}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.dashboard.last7Days}</p>
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
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.dashboard.strategies}</p>
                  <p className="text-3xl font-semibold tracking-tight">{strategiesCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.dashboard.activeStrategies}</p>
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
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.dashboard.topSymbol}</p>
                  <p className="text-2xl font-semibold mt-1 font-mono tracking-tight">{stats.mostActiveSymbol || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.dashboard.mostSignals}</p>
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
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.dashboard.openPositions}</p>
                  <p className="text-3xl font-semibold tracking-tight">{filteredStats.openPositions}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.dashboard.activeTrades}</p>
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
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.dashboard.bestTrade}</p>
                  <p className={`text-3xl font-semibold tracking-tight ${filteredStats.bestTrade !== null && filteredStats.bestTrade > 0 ? 'text-buy' : ''}`}>
                    {filteredStats.bestTrade !== null ? `+${filteredStats.bestTrade.toFixed(2)}%` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t.dashboard.topPerformer}</p>
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
              {t.dashboard.openTrades}
            </CardTitle>
            {filteredTrades.filter(tr => tr.status === 'open').length > 0 && (
              <Link to="/dashboard/signals">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                  {t.common.viewAll} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {filteredTrades.filter(tr => tr.status === 'open').length === 0 ? (
              <EmptyTrades type="open" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.dashboard.direction}</TableHead>
                      <TableHead>{t.dashboard.symbol}</TableHead>
                      <TableHead>{t.dashboard.entryPrice}</TableHead>
                      <TableHead>{t.dashboard.current}</TableHead>
                      <TableHead>{t.dashboard.strategy}</TableHead>
                      <TableHead>{t.dashboard.entryTime}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.filter(tr => tr.status === 'open').map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>
                          <Badge variant="outline" className={trade.direction === 'long' ? 'signal-buy border px-3 py-1' : 'signal-sell border px-3 py-1'}>
                            {trade.direction === 'long' ? (
                              <span className="flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                {t.dashboard.long}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <ArrowDownRight className="h-3 w-3" />
                                {t.dashboard.short}
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
              {t.dashboard.closedTrades}
            </CardTitle>
            {filteredTrades.filter(tr => tr.status === 'closed').length > 0 && (
              <Link to="/dashboard/signals">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                  {t.common.viewAll} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {filteredTrades.filter(tr => tr.status === 'closed').length === 0 ? (
              <EmptyTrades type="closed" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.dashboard.direction}</TableHead>
                      <TableHead>{t.dashboard.symbol}</TableHead>
                      <TableHead>{t.dashboard.entryPrice}</TableHead>
                      <TableHead>{t.dashboard.exitPrice}</TableHead>
                      <TableHead>{t.dashboard.pnl}</TableHead>
                      <TableHead>{t.dashboard.strategy}</TableHead>
                      <TableHead>{t.dashboard.time}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.filter(tr => tr.status === 'closed').map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>
                          <Badge variant="outline" className={trade.direction === 'long' ? 'signal-buy border px-3 py-1' : 'signal-sell border px-3 py-1'}>
                            {trade.direction === 'long' ? (
                              <span className="flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                {t.dashboard.long}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <ArrowDownRight className="h-3 w-3" />
                                {t.dashboard.short}
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
