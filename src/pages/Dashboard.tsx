import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Layers, Clock, ArrowRight, Plus, Sparkles, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

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

interface DashboardStats {
  signalsToday: number;
  signalsWeek: number;
  mostActiveStrategy: string | null;
  mostActiveSymbol: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    signalsToday: 0,
    signalsWeek: 0,
    mostActiveStrategy: null,
    mostActiveSymbol: null,
  });
  const [loading, setLoading] = useState(true);
  const [strategiesCount, setStrategiesCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const { data: signalsData, error: signalsError } = await supabase
        .from('signals')
        .select(`
          *,
          strategies (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (signalsError) throw signalsError;
      setSignals(signalsData || []);

      const { count: stratCount } = await supabase
        .from('strategies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      setStrategiesCount(stratCount || 0);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const signalsToday = (signalsData || []).filter(
        (s) => new Date(s.created_at) >= todayStart
      ).length;

      const signalsWeek = (signalsData || []).filter(
        (s) => new Date(s.created_at) >= weekStart
      ).length;

      const strategyCount: Record<string, number> = {};
      (signalsData || []).forEach((s) => {
        const name = s.strategies?.name || 'Unknown';
        strategyCount[name] = (strategyCount[name] || 0) + 1;
      });
      const mostActiveStrategy = Object.entries(strategyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      const symbolCount: Record<string, number> = {};
      (signalsData || []).forEach((s) => {
        symbolCount[s.symbol] = (symbolCount[s.symbol] || 0) + 1;
      });
      const mostActiveSymbol = Object.entries(symbolCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      setStats({
        signalsToday,
        signalsWeek,
        mostActiveStrategy,
        mostActiveSymbol,
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
      return <Badge className="signal-buy border px-3 py-1">BUY</Badge>;
    }
    if (upperType === 'SELL' || upperType === 'SHORT') {
      return <Badge className="signal-sell border px-3 py-1">SELL</Badge>;
    }
    return <Badge className="signal-neutral border px-3 py-1">{upperType}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
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
          <Card className="stat-card group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Signals Today</p>
                  <p className="text-5xl font-bold mt-3 tracking-tight">{stats.signalsToday}</p>
                  <p className="text-xs text-muted-foreground mt-2">Last 24 hours</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">This Week</p>
                  <p className="text-5xl font-bold mt-3 tracking-tight">{stats.signalsWeek}</p>
                  <p className="text-xs text-muted-foreground mt-2">Last 7 days</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Strategies</p>
                  <p className="text-5xl font-bold mt-3 tracking-tight">{strategiesCount}</p>
                  <p className="text-xs text-muted-foreground mt-2">Active strategies</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                  <Layers className="h-6 w-6 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Top Symbol</p>
                  <p className="text-4xl font-bold mt-3 font-mono tracking-tight">{stats.mostActiveSymbol || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-2">Most signals</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Signals */}
        <Card className="glass-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Signals
            </CardTitle>
            {signals.length > 0 && (
              <Link to="/dashboard/strategies">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading signals...</p>
                </div>
              </div>
            ) : signals.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No signals yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Create a strategy and connect TradingView to start receiving signals
                </p>
                <Link to="/dashboard/strategies">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Strategy
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left py-4 px-6 table-header">Signal</th>
                      <th className="text-left py-4 px-6 table-header">Symbol</th>
                      <th className="text-left py-4 px-6 table-header">Price</th>
                      <th className="text-left py-4 px-6 table-header">Strategy</th>
                      <th className="text-left py-4 px-6 table-header">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((signal, index) => (
                      <tr key={signal.id} className={`table-row ${index === signals.length - 1 ? 'border-none' : ''}`}>
                        <td className="py-4 px-6">{getSignalBadge(signal.signal_type)}</td>
                        <td className="py-4 px-6">
                          <span className="font-mono font-semibold">{signal.symbol}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono text-foreground">${Number(signal.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-muted-foreground">{signal.strategies?.name}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(signal.created_at), 'MMM d, HH:mm')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
