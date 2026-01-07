import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Check, Webhook, Clock, Download, ExternalLink, Loader2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { StrategyAnalytics } from '@/components/strategy/StrategyAnalytics';

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

  const webhookUrl = `https://werpnszquvnivfjdhcfd.supabase.co/functions/v1/tradingview-webhook`;

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
          token: strategy.secret_token,
          strategyId: strategy.id,
          signal: 'BUY',
          symbol: '{{ticker}}',
          price: '{{close}}',
          time: '{{time}}',
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
    "token": "${strategy.secret_token}",
    "strategyId": "${strategy.id}",
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 192.34,
    "time": "${new Date().toISOString()}",
    "interval": "5"
  }'`
    : '';

  const exportCSV = () => {
    toast({
      title: 'Upgrade Required',
      description: 'CSV export is available for Pro users. Upgrade to unlock.',
      variant: 'destructive',
    });
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
          <TabsList className="glass-card h-12 p-1">
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
            <StrategyAnalytics signals={allSignals} strategyName={strategy.name} />
          </TabsContent>

          <TabsContent value="signals" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" className="gap-2" onClick={exportCSV}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>

            <Card className="glass-card overflow-hidden">
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
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left py-4 px-6 table-header">Signal</th>
                          <th className="text-left py-4 px-6 table-header">Symbol</th>
                          <th className="text-left py-4 px-6 table-header">Price</th>
                          <th className="text-left py-4 px-6 table-header">Interval</th>
                          <th className="text-left py-4 px-6 table-header">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {signals.map((signal, index) => (
                          <tr
                            key={signal.id}
                            className={`table-row ${index === signals.length - 1 ? 'border-none' : ''}`}
                          >
                            <td className="py-4 px-6">{getSignalBadge(signal.signal_type)}</td>
                            <td className="py-4 px-6 font-mono font-semibold">{signal.symbol}</td>
                            <td className="py-4 px-6 font-mono">${Number(signal.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-4 px-6 text-muted-foreground">{signal.interval || '-'}</td>
                            <td className="py-4 px-6 text-sm text-muted-foreground">
                              {format(new Date(signal.created_at), 'MMM d, HH:mm:ss')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="space-y-6">
            {/* Webhook URL */}
            <Card className="glass-card">
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
            <Card className="glass-card">
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
                <p className="text-sm text-muted-foreground mt-3">
                  <strong>Note:</strong> Replace <code className="bg-muted px-1.5 py-0.5 rounded">BUY</code> with 
                  {' '}<code className="bg-muted px-1.5 py-0.5 rounded">SELL</code> or 
                  {' '}<code className="bg-muted px-1.5 py-0.5 rounded">EXIT</code> as needed.
                </p>
              </CardContent>
            </Card>

            {/* Setup Steps */}
            <Card className="glass-card">
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
            <Card className="glass-card">
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
