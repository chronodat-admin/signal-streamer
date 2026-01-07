import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Filter, Download, Search, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getUserPlan, getHistoryDateLimit } from '@/lib/planUtils';
import { useToast } from '@/hooks/use-toast';

interface Signal {
  id: string;
  signal_type: string;
  symbol: string;
  price: number;
  signal_time: string;
  created_at: string;
  strategy_id: string;
  alert_id: string | null;
  raw_payload: any;
  strategies?: {
    name: string;
  };
}

interface SignalFilters {
  strategy: string;
  symbol: string;
  signalType: string;
  search: string;
}

const Signals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filteredSignals, setFilteredSignals] = useState<Signal[]>([]);
  const [strategies, setStrategies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SignalFilters>({
    strategy: 'all',
    symbol: '',
    signalType: 'all',
    search: '',
  });

  useEffect(() => {
    if (user) {
      fetchSignals();
      fetchStrategies();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [signals, filters]);

  const fetchStrategies = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;
      setStrategies(data || []);
    } catch (error) {
      console.error('Error fetching strategies:', error);
    }
  };

  const fetchSignals = async () => {
    if (!user) return;

    try {
      const plan = await getUserPlan(user.id);
      const historyLimit = getHistoryDateLimit(plan);

      let query = supabase
        .from('signals')
        .select(`
          *,
          strategies (name)
        `)
        .eq('user_id', user.id);

      if (historyLimit) {
        query = query.gte('created_at', historyLimit.toISOString());
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setSignals(data || []);
    } catch (error) {
      console.error('Error fetching signals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load signals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...signals];

    if (filters.strategy !== 'all') {
      filtered = filtered.filter((s) => s.strategy_id === filters.strategy);
    }

    if (filters.symbol) {
      filtered = filtered.filter((s) =>
        s.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
      );
    }

    if (filters.signalType !== 'all') {
      filtered = filtered.filter((s) => {
        const type = s.signal_type.toUpperCase();
        if (filters.signalType === 'buy') {
          return type === 'BUY' || type === 'LONG';
        }
        if (filters.signalType === 'sell') {
          return type === 'SELL' || type === 'SHORT';
        }
        return true;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.symbol.toLowerCase().includes(searchLower) ||
          s.strategies?.name.toLowerCase().includes(searchLower) ||
          s.signal_type.toLowerCase().includes(searchLower)
      );
    }

    setFilteredSignals(filtered);
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

  const exportCSV = () => {
    const headers = ['Date', 'Time', 'Strategy', 'Signal', 'Symbol', 'Price', 'Alert ID'];
    const rows = filteredSignals.map((s) => [
      format(new Date(s.created_at), 'yyyy-MM-dd'),
      format(new Date(s.created_at), 'HH:mm:ss'),
      s.strategies?.name || 'Unknown',
      s.signal_type,
      s.symbol,
      s.price.toString(),
      s.alert_id || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signals-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: 'Signals exported to CSV',
    });
  };

  const stats = {
    total: filteredSignals.length,
    buys: filteredSignals.filter((s) => {
      const type = s.signal_type.toUpperCase();
      return type === 'BUY' || type === 'LONG';
    }).length,
    sells: filteredSignals.filter((s) => {
      const type = s.signal_type.toUpperCase();
      return type === 'SELL' || type === 'SHORT';
    }).length,
    duplicates: filteredSignals.filter((s, index, arr) => {
      return arr.findIndex(
        (other) =>
          other.symbol === s.symbol &&
          other.signal_type.toUpperCase() === s.signal_type.toUpperCase() &&
          other.id !== s.id &&
          Math.abs(new Date(other.created_at).getTime() - new Date(s.created_at).getTime()) < 60000
      ) !== -1;
    }).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">All Signals</h1>
            <p className="text-muted-foreground">View and filter all your trading signals</p>
          </div>
          <Button onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Total Signals
                  </p>
                  <p className="text-2xl font-semibold">{stats.total}</p>
                </div>
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    BUY Signals
                  </p>
                  <p className="text-2xl font-semibold text-buy">{stats.buys}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-buy" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    SELL Signals
                  </p>
                  <p className="text-2xl font-semibold text-sell">{stats.sells}</p>
                </div>
                <XCircle className="h-5 w-5 text-sell" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Potential Duplicates
                  </p>
                  <p className="text-2xl font-semibold">{stats.duplicates}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            <CardDescription>Filter signals by strategy, symbol, or type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search signals..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>

              <Select
                value={filters.strategy}
                onValueChange={(value) => setFilters({ ...filters, strategy: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Strategies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Strategies</SelectItem>
                  {strategies.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Filter by symbol..."
                value={filters.symbol}
                onChange={(e) => setFilters({ ...filters, symbol: e.target.value })}
              />

              <Select
                value={filters.signalType}
                onValueChange={(value) => setFilters({ ...filters, signalType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="buy">BUY/LONG</SelectItem>
                  <SelectItem value="sell">SELL/SHORT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Signals Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signals ({filteredSignals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Activity className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                <p className="text-muted-foreground">Loading signals...</p>
              </div>
            ) : filteredSignals.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No signals found</h3>
                <p className="text-muted-foreground">
                  {signals.length === 0
                    ? "You haven't received any signals yet"
                    : 'Try adjusting your filters'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Signal</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Alert ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSignals.map((signal) => (
                      <TableRow key={signal.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(new Date(signal.created_at), 'MMM d, yyyy')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(signal.created_at), 'HH:mm:ss')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{signal.strategies?.name || 'Unknown'}</span>
                        </TableCell>
                        <TableCell>{getSignalBadge(signal.signal_type)}</TableCell>
                        <TableCell>
                          <span className="font-mono font-medium">{signal.symbol}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">${Number(signal.price).toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          {signal.alert_id ? (
                            <span className="font-mono text-xs text-muted-foreground">
                              {signal.alert_id}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
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

export default Signals;



