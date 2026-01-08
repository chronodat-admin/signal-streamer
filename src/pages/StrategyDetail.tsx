import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Check, Webhook, Clock, Download, ExternalLink, Loader2, BarChart3, DollarSign, TrendingUp } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatUtils';
import { StrategyAnalytics } from '@/components/strategy/StrategyAnalytics';
import { getUserPlan } from '@/lib/planUtils';
import { calculateSignalPnL, formatPnL } from '@/lib/pnlUtils';

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  exchange: string | null;
  timeframe: string | null;
  is_public: boolean;
  secret_token: string;
  slug: string | null;
  created_at: string;
}

interface Signal {
  id: string;
  signal_type: string;
  symbol: string;
  price: number;
  signal_time: string;
  interval: string | null;
  raw_payload: any;
  created_at: string;
}

const StrategyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [allSignals, setAllSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [pnlData, setPnlData] = useState<ReturnType<typeof calculateSignalPnL> | null>(null);

  // Get webhook URL - use Vercel proxy if available, otherwise fallback to Supabase
  const vercelUrl = import.meta.env.VITE_VERCEL_URL || window.location.origin;
  const webhookUrl = `${vercelUrl}/api/tradingview`;

  useEffect(() => {
    if (user && id) {
      fetchStrategy();
      fetchSignals();
      fetchAllSignals();
    }
  }, [user, id]);

  const fetchStrategy = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStrategy(data);
    } catch (error) {
      console.error('Error fetching strategy:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSignals = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('strategy_id', id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSignals(data || []);
    } catch (error) {
      console.error('Error fetching signals:', error);
    }
  };

  const fetchAllSignals = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('strategy_id', id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setAllSignals(data || []);
      
      // Calculate P&L
      const pnl = calculateSignalPnL(data || []);
      setPnlData(pnl);
    } catch (error) {
      console.error('Error fetching all signals:', error);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      toast({
        title: 'Copied!',
        description: `${type} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const jsonTemplate = strategy
    ? JSON.stringify(
        {
          secret: 'YOUR_TRADINGVIEW_SECRET',
          token: strategy.secret_token,
          strategyId: strategy.id,
          signal: '{{strategy.order.action}}',
          symbol: '{{ticker}}',
          price: '{{close}}',
          time: '{{timenow}}',
          interval: '{{interval}}',
        },
        null,
        2
      )
    : '';

  const curlCommand = strategy
    ? `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "secret": "YOUR_TRADINGVIEW_SECRET",
    "token": "${strategy.secret_token}",
    "strategyId": "${strategy.id}",
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 192.34,
    "time": "${new Date().toISOString()}",
    "interval": "5"
  }'`
    : '';

  const [userPlan, setUserPlan] = useState<'FREE' | 'PRO' | 'ELITE'>('FREE');

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', user.id)
        .single();
      if (data?.plan) setUserPlan(data.plan);
    };
    fetchUserPlan();
  }, [user]);

  const exportCSV = () => {
    if (userPlan === 'FREE') {
      toast({
        title: 'Upgrade Required',
        description: 'CSV export is available for Pro users. Upgrade to unlock.',
        variant: 'destructive',
      });
      return;
    }

    if (signals.length === 0) {
      toast({
        title: 'No Data',
        description: 'There are no signals to export.',
        variant: 'destructive',
      });
      return;
    }

    // Create CSV content
    const headers = ['Signal Type', 'Symbol', 'Price', 'Interval', 'Time', 'Created At'];
    const rows = signals.map((signal) => [
      signal.signal_type,
      signal.symbol,
      signal.price.toString(),
      signal.interval || '',
      signal.signal_time,
      signal.created_at,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${strategy?.name || 'signals'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: `Exported ${signals.length} signals to CSV`,
    });
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
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading strategy...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!strategy) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold">Strategy not found</h2>
          <Link to="/dashboard/strategies">
            <Button className="mt-4">Back to Strategies</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard/strategies">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{strategy.name}</h1>
              {strategy.is_public && (
                <Badge className="signal-buy border">Public</Badge>
              )}
            </div>
            {strategy.description && (
              <p className="text-muted-foreground mt-1">{strategy.description}</p>
            )}
          </div>
          {strategy.is_public && strategy.slug && (
            <Link to={`/s/${strategy.slug}`} target="_blank">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Public Page
              </Button>
            </Link>
          )}
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="h-10 p-1 bg-muted/50">
            <TabsTrigger value="analytics" className="gap-2 h-10 px-4">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="signals" className="gap-2 h-10 px-4">
              <Clock className="h-4 w-4" />
              Signals ({signals.length})
            </TabsTrigger>
            <TabsTrigger value="setup" className="gap-2 h-10 px-4">
              <Webhook className="h-4 w-4" />
              Setup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {/* P&L Summary Cards */}
            {pnlData && pnlData.totalTrades > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                          Total P&L
                        </p>
                        <p className={`text-2xl font-semibold ${formatPnL(pnlData.totalPnL).className}`}>
                          {formatPnL(pnlData.totalPnL).value}
                        </p>
                      </div>
                      <DollarSign className={`h-5 w-5 ${pnlData.totalPnL >= 0 ? 'text-buy' : 'text-sell'}`} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                          Win Rate
                        </p>
                        <p className="text-2xl font-semibold">
                          {((pnlData.winningTrades / pnlData.totalTrades) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-buy" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                          Total Trades
                        </p>
                        <p className="text-2xl font-semibold">{pnlData.totalTrades}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pnlData.winningTrades}W / {pnlData.losingTrades}L
                        </p>
                      </div>
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                          Avg Gain
                        </p>
                        <p className="text-2xl font-semibold text-buy">
                          {pnlData.avgGain > 0 ? `+${pnlData.avgGain.toFixed(2)}%` : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Avg Loss: {pnlData.avgLoss > 0 ? `-${pnlData.avgLoss.toFixed(2)}%` : '—'}
                        </p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-buy" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <StrategyAnalytics signals={allSignals} strategyName={strategy.name} />
          </TabsContent>

          <TabsContent value="signals" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" className="gap-2" onClick={exportCSV}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {signals.length === 0 ? (
                  <div className="text-center py-16">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No signals yet</h3>
                    <p className="text-muted-foreground">
                      Signals will appear here when TradingView sends webhooks
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Signal</TableHead>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Interval</TableHead>
                          <TableHead>Time</TableHead>
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
                              <span className="text-muted-foreground">{signal.interval || '-'}</span>
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
          </TabsContent>

          <TabsContent value="setup" className="space-y-6">
            {/* Webhook URL */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Webhook URL</CardTitle>
                <CardDescription>
                  Copy this URL and paste it into TradingView alert settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted/50 px-4 py-3 rounded-xl font-mono text-sm break-all">
                    {webhookUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                  >
                    {copied === 'Webhook URL' ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* JSON Template */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Alert Message (JSON)</CardTitle>
                <CardDescription>
                  Use this JSON template in your TradingView alert message
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-muted/50 px-4 py-3 rounded-xl font-mono text-sm overflow-x-auto">
                    {jsonTemplate}
                  </pre>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(jsonTemplate, 'JSON Template')}
                  >
                    {copied === 'JSON Template' ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-3 space-y-1">
                  <div>
                    <strong>Important:</strong> Replace <code className="bg-muted px-1.5 py-0.5 rounded">YOUR_TRADINGVIEW_SECRET</code> with 
                    {' '}your actual secret (must match <code className="bg-muted px-1.5 py-0.5 rounded">TRADINGVIEW_SECRET</code> in Vercel).
                  </div>
                  <div>
                    The <code className="bg-muted px-1.5 py-0.5 rounded">signal</code> field uses 
                    {' '}<code className="bg-muted px-1.5 py-0.5 rounded">{'{{strategy.order.action}}'}</code> which will automatically 
                    {' '}be replaced with BUY, SELL, etc. by TradingView.
                  </div>
                </p>
              </CardContent>
            </Card>

            {/* Setup Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3. Setup Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { step: 1, title: 'Create TradingView Alert', desc: 'In TradingView, right-click on your chart and select "Add Alert"' },
                  { step: 2, title: 'Enable Webhook', desc: 'Check "Webhook URL" and paste the URL from step 1' },
                  { step: 3, title: 'Set Message', desc: 'In the "Message" field, paste the JSON template from step 2' },
                  { step: 4, title: 'Save Alert', desc: 'Click "Create" and your signals will appear here in real-time' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Test with cURL */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test with cURL</CardTitle>
                <CardDescription>
                  Test your webhook integration from the command line
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-muted/50 px-4 py-3 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                    {curlCommand}
                  </pre>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(curlCommand, 'cURL Command')}
                  >
                    {copied === 'cURL Command' ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StrategyDetail;
