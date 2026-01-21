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
import { formatCurrency, formatDate, formatDateTime, getSourceBadgeConfig } from '@/lib/formatUtils';
import { StrategyAnalytics } from '@/components/strategy/StrategyAnalytics';
import { getUserPlan } from '@/lib/planUtils';
import { calculateSignalPnL, formatPnL } from '@/lib/pnlUtils';
import { useLanguage } from '@/i18n';

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
  source?: string | null;
  raw_payload: any;
  created_at: string;
}

const StrategyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [allSignals, setAllSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [pnlData, setPnlData] = useState<ReturnType<typeof calculateSignalPnL> | null>(null);

  // Production webhook URL - always use trademoq.com for consistency
  const baseUrl = 'https://trademoq.com';
  const webhookUrl = `${baseUrl}/api/tradingview`;

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
        title: t.strategyDetail.copied,
        description: t.strategyDetail.copiedDescription.replace('{type}', type),
      });
    } catch (error) {
      toast({
        title: t.strategyDetail.failedToCopy,
        description: t.strategyDetail.failedToCopyDescription,
        variant: 'destructive',
      });
    }
  };

  // Create JSON template (no secret required)
  const jsonTemplate = strategy
    ? JSON.stringify(
        {
          token: strategy.secret_token,
          strategyId: strategy.id,
          signal: '{{strategy.order.action}}',
          symbol: '{{ticker}}',
          price: '{{close}}',
          time: '{{timenow}}',
          interval: '{{interval}}',
          source: 'tradingview',
        },
        null,
        2
      )
    : '';

  // cURL command for Bash/Mac/Linux
  const curlCommandBash = strategy
    ? `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "${strategy.secret_token}",
    "strategyId": "${strategy.id}",
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 192.34,
    "time": "${new Date().toISOString()}",
    "interval": "5",
    "source": "tradingview"
  }'`
    : '';

  // cURL command for Windows (cmd.exe)
  const curlCommandWindows = strategy
    ? `curl.exe -X POST "${webhookUrl}" -H "Content-Type: application/json" -d "{\\"token\\": \\"${strategy.secret_token}\\", \\"strategyId\\": \\"${strategy.id}\\", \\"signal\\": \\"BUY\\", \\"symbol\\": \\"AAPL\\", \\"price\\": 192.34, \\"time\\": \\"${new Date().toISOString()}\\", \\"interval\\": \\"5\\", \\"source\\": \\"tradingview\\"}"`
    : '';

  // For display, we'll use a simplified version that works cross-platform
  const curlCommand = curlCommandBash;

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
        title: t.strategyDetail.upgradeRequired,
        description: t.strategyDetail.upgradeRequiredDescription,
        variant: 'destructive',
      });
      return;
    }

    if (signals.length === 0) {
      toast({
        title: t.strategyDetail.noData,
        description: t.strategyDetail.noDataDescription,
        variant: 'destructive',
      });
      return;
    }

    // Create CSV content
    const headers = [t.strategyDetail.signal, t.strategyDetail.symbol, t.strategyDetail.price, t.strategyDetail.interval, t.strategyDetail.time, 'Created At'];
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
      title: t.strategyDetail.exportSuccessful,
      description: t.strategyDetail.exportSuccessfulDescription.replace('{count}', signals.length.toString()),
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
            <p className="text-sm text-muted-foreground">{t.strategyDetail.loadingStrategy}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!strategy) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold">{t.strategyDetail.strategyNotFound}</h2>
          <Link to="/dashboard/strategies">
            <Button className="mt-4">{t.strategyDetail.backToStrategies}</Button>
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
                <Badge className="signal-buy border">{t.strategyDetail.public}</Badge>
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
                {t.strategyDetail.viewPublicPage}
              </Button>
            </Link>
          )}
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="h-10 p-1 bg-muted/50">
            <TabsTrigger value="analytics" className="gap-2 h-10 px-4">
              <BarChart3 className="h-4 w-4" />
              {t.strategyDetail.analyticsTab}
            </TabsTrigger>
            <TabsTrigger value="signals" className="gap-2 h-10 px-4">
              <Clock className="h-4 w-4" />
              {t.strategyDetail.signalsTab} ({signals.length})
            </TabsTrigger>
            <TabsTrigger value="setup" className="gap-2 h-10 px-4">
              <Webhook className="h-4 w-4" />
              {t.strategyDetail.setupTab}
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
                          {t.strategyDetail.totalPnL}
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
                          {t.strategyDetail.winRate}
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
                          {t.strategyDetail.totalTrades}
                        </p>
                        <p className="text-2xl font-semibold">{pnlData.totalTrades}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pnlData.winningTrades}{t.strategyDetail.wins} / {pnlData.losingTrades}{t.strategyDetail.losses}
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
                          {t.strategyDetail.avgGain}
                        </p>
                        <p className="text-2xl font-semibold text-buy">
                          {pnlData.avgGain > 0 ? `+${pnlData.avgGain.toFixed(2)}%` : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.strategyDetail.avgLoss}: {pnlData.avgLoss > 0 ? `-${pnlData.avgLoss.toFixed(2)}%` : '—'}
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
                {t.strategyDetail.exportCSV}
              </Button>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {signals.length === 0 ? (
                  <div className="text-center py-16">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t.strategyDetail.noSignalsYet}</h3>
                    <p className="text-muted-foreground">
                      {t.strategyDetail.noSignalsDescription}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.strategyDetail.signal}</TableHead>
                          <TableHead>{t.strategyDetail.symbol}</TableHead>
                          <TableHead>{t.strategyDetail.price}</TableHead>
                          <TableHead>{t.strategyDetail.interval}</TableHead>
                          <TableHead>{t.strategyDetail.time}</TableHead>
                          <TableHead>{t.signals.source}</TableHead>
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
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${getSourceBadgeConfig(signal.source).className}`}>
                                {getSourceBadgeConfig(signal.source).label}
                              </Badge>
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
                <CardTitle className="text-lg">{t.strategyDetail.webhookUrlTitle}</CardTitle>
                <CardDescription>
                  {t.strategyDetail.webhookDescription}
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
                <CardTitle className="text-lg">{t.strategyDetail.alertMessageTitle}</CardTitle>
                <CardDescription>
                  {t.strategyDetail.alertFormatDescription}
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
                <div className="text-sm text-muted-foreground mt-3 space-y-1">
                  <div>
                    {t.strategyDetail.jsonTemplateDescription
                      .replace('{field}', t.strategyDetail.signalField)
                      .split('{placeholder}').map((part, i, arr) => 
                        i === arr.length - 1 ? (
                          <span key={i}>{part}</span>
                        ) : (
                          <span key={i}>
                            {part}
                            <code className="bg-muted px-1.5 py-0.5 rounded">{'{{strategy.order.action}}'}</code>
                          </span>
                        )
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Setup Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.strategyDetail.setupStepsTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { step: 1, title: t.strategyDetail.step1Title, desc: t.strategyDetail.step1Description },
                  { step: 2, title: t.strategyDetail.step2Title, desc: t.strategyDetail.step2Description },
                  { step: 3, title: t.strategyDetail.step3Title, desc: t.strategyDetail.step3Description },
                  { step: 4, title: t.strategyDetail.step4Title, desc: t.strategyDetail.step4Description },
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
                <CardTitle className="text-lg">{t.strategyDetail.testWebhookTitle}</CardTitle>
                <CardDescription>
                  {t.strategyDetail.testWebhookDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{t.strategyDetail.bashMacLinux}</h4>
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
                </div>

                <div>
                  <h4 className="font-medium mb-2">{t.strategyDetail.windowsCommandPrompt}</h4>
                  <div className="relative">
                    <pre className="bg-muted/50 px-4 py-3 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                      {curlCommandWindows}
                    </pre>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(curlCommandWindows, 'Windows cURL')}
                    >
                      {copied === 'Windows cURL' ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <h4 className="font-medium text-emerald-600 dark:text-emerald-400 mb-2">{t.strategyDetail.usingPostman}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>{t.strategyDetail.method}:</strong> POST</p>
                    <p><strong>{t.strategyDetail.url}:</strong> {webhookUrl}</p>
                    <p><strong>{t.strategyDetail.headers}:</strong> Content-Type: application/json</p>
                    <p><strong>{t.strategyDetail.body}:</strong> {t.strategyDetail.bodyDescription}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  <strong>{t.strategyDetail.expectedResponse}</strong>{' '}
                  <code className="bg-muted px-1.5 py-0.5 rounded">{t.strategyDetail.expectedResponseValue}</code>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StrategyDetail;
