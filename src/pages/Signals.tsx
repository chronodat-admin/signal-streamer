import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Activity, Filter, Download, Search, AlertCircle, CheckCircle2, XCircle, Plus, Loader2 } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatUtils';
import { getUserPlan, getHistoryDateLimit } from '@/lib/planUtils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { SignalsPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { EmptySignals, NoSearchResults } from '@/components/dashboard/EmptyState';
import { DateFilter, DateFilterType, DateRange } from '@/components/dashboard/DateFilter';

interface Signal {
  id: string;
  signal_type: string;
  symbol: string;
  price: number;
  signal_time: string;
  created_at: string;
  strategy_id: string;
  alert_id: string | null;
  source: string | null;
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

interface ManualSignalForm {
  strategy_id: string;
  signal_type: string;
  symbol: string;
  price: string;
  signal_time: string;
  notes: string;
}

const initialFormState: ManualSignalForm = {
  strategy_id: '',
  signal_type: '',
  symbol: '',
  price: '',
  signal_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  notes: '',
};

const Signals = () => {
  const { user } = useAuth();
  const { preferences } = usePreferences();
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

  // Manual signal entry state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ManualSignalForm>(initialFormState);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (user) {
      fetchSignals();
      fetchStrategies();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [signals, filters, dateFilter, dateRange]);

  // Helper function to get date range based on filter type
  const getDateRange = (filter: DateFilterType, customRange?: DateRange): { from: Date | null; to: Date | null } => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

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

    // Apply date filter first
    if (dateFilter !== 'all') {
      const range = getDateRange(dateFilter, dateRange);
      if (range.from && range.to) {
        filtered = filtered.filter((s) => {
          const signalDate = new Date(s.created_at);
          return signalDate >= range.from! && signalDate <= range.to!;
        });
      }
    }

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
      return <Badge variant="outline" className="signal-buy border px-3 py-1">BUY</Badge>;
    }
    if (upperType === 'SELL' || upperType === 'SHORT') {
      return <Badge variant="outline" className="signal-sell border px-3 py-1">SELL</Badge>;
    }
    return <Badge variant="outline" className="signal-neutral border px-3 py-1">{upperType}</Badge>;
  };

  const getSourceBadge = (source: string | null) => {
    const sourceLabels: Record<string, { label: string; className: string }> = {
      tradingview: { label: 'TradingView', className: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
      trendspider: { label: 'TrendSpider', className: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
      api: { label: 'API', className: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
      manual: { label: 'Manual', className: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
      other: { label: 'Other', className: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
    };
    const config = sourceLabels[source?.toLowerCase() || ''] || { label: source || 'Unknown', className: 'bg-gray-500/10 text-gray-400 border-gray-500/30' };
    return (
      <Badge variant="outline" className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const exportCSV = () => {
    const headers = ['Date', 'Time', 'Strategy', 'Signal', 'Symbol', 'Price', 'Source'];
    const rows = filteredSignals.map((s) => [
      format(new Date(s.created_at), 'yyyy-MM-dd'),
      format(new Date(s.created_at), 'HH:mm:ss'),
      s.strategies?.name || 'Unknown',
      s.signal_type,
      s.symbol,
      s.price.toString(),
      s.source || 'unknown',
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

  const resetForm = () => {
    setFormData({
      ...initialFormState,
      signal_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    });
  };

  const handleSubmitManualSignal = async () => {
    if (!user) return;

    // Validation
    if (!formData.strategy_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select a strategy',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.signal_type) {
      toast({
        title: 'Validation Error',
        description: 'Please select a signal type',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.symbol.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a symbol',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const signalTime = new Date(formData.signal_time).toISOString();
      
      const { data, error } = await supabase
        .from('signals')
        .insert({
          user_id: user.id,
          strategy_id: formData.strategy_id,
          signal_type: formData.signal_type.toUpperCase(),
          symbol: formData.symbol.toUpperCase().trim(),
          price: parseFloat(formData.price),
          signal_time: signalTime,
          source: 'manual',
          raw_payload: {
            notes: formData.notes,
            entered_at: new Date().toISOString(),
            manual_entry: true,
          },
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Signal Added',
        description: `Manual ${formData.signal_type.toUpperCase()} signal for ${formData.symbol.toUpperCase()} added successfully`,
      });

      // Refresh signals list
      await fetchSignals();
      
      // Close dialog and reset form
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error adding manual signal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add signal',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
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

  if (loading) {
    return (
      <DashboardLayout>
        <SignalsPageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">All Signals</h1>
            <p className="text-muted-foreground">View and filter all your trading signals</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Filter */}
            <DateFilter
              value={dateFilter}
              dateRange={dateRange}
              onFilterChange={(filter, range) => {
                setDateFilter(filter);
                setDateRange(range);
              }}
            />
            {/* Manual Signal Entry Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Signal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Manual Signal</DialogTitle>
                  <DialogDescription>
                    Enter a signal manually to track your trades. This works the same as signals from TradingView.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  {/* Strategy Selection */}
                  <div className="grid gap-2">
                    <Label htmlFor="strategy">Strategy *</Label>
                    <Select
                      value={formData.strategy_id}
                      onValueChange={(value) => setFormData({ ...formData, strategy_id: value })}
                    >
                      <SelectTrigger id="strategy">
                        <SelectValue placeholder="Select a strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        {strategies.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {strategies.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No strategies found. Create a strategy first.
                      </p>
                    )}
                  </div>

                  {/* Signal Type */}
                  <div className="grid gap-2">
                    <Label htmlFor="signal_type">Signal Type *</Label>
                    <Select
                      value={formData.signal_type}
                      onValueChange={(value) => setFormData({ ...formData, signal_type: value })}
                    >
                      <SelectTrigger id="signal_type">
                        <SelectValue placeholder="Select signal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUY">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            BUY (Long Entry)
                          </span>
                        </SelectItem>
                        <SelectItem value="SELL">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            SELL (Short Entry / Exit Long)
                          </span>
                        </SelectItem>
                        <SelectItem value="LONG">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            LONG (Open Long Position)
                          </span>
                        </SelectItem>
                        <SelectItem value="SHORT">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            SHORT (Open Short Position)
                          </span>
                        </SelectItem>
                        <SelectItem value="CLOSE">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-500" />
                            CLOSE (Close Position)
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Symbol and Price Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="symbol">Symbol *</Label>
                      <Input
                        id="symbol"
                        placeholder="e.g., AAPL, BTCUSD"
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                        className="uppercase"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.00001"
                        placeholder="e.g., 150.25"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Signal Time */}
                  <div className="grid gap-2">
                    <Label htmlFor="signal_time">Signal Time *</Label>
                    <Input
                      id="signal_time"
                      type="datetime-local"
                      value={formData.signal_time}
                      onChange={(e) => setFormData({ ...formData, signal_time: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      When did this signal occur? Defaults to now.
                    </p>
                  </div>

                  {/* Notes (Optional) */}
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      placeholder="e.g., RSI oversold, support level"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitManualSignal}
                    disabled={submitting || strategies.length === 0}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Signal
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button onClick={exportCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          </div>
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
            {filteredSignals.length === 0 ? (
              filters.search || filters.strategy !== 'all' || filters.symbol || filters.signalType !== 'all' ? (
                <NoSearchResults query={filters.search || 'your filters'} />
              ) : (
                <EmptySignals hasStrategies={strategies.length > 0} />
              )
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
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSignals.map((signal) => (
                      <TableRow key={signal.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {formatDate(signal.created_at, preferences.dateFormat)}
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
                          <span className="font-mono">{formatCurrency(Number(signal.price), preferences.currency)}</span>
                        </TableCell>
                        <TableCell>
                          {getSourceBadge(signal.source)}
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



