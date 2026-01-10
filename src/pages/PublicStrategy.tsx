import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, TrendingUp, TrendingDown, Clock, ArrowLeft, Loader2, Lock, User } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatUtils';
import { useLanguage } from '@/i18n';
import StrategyDiscussion from '@/components/strategy/StrategyDiscussion';

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  exchange: string | null;
  timeframe: string | null;
  is_public: boolean;
  created_at: string;
  user_id: string;
}

interface OwnerProfile {
  full_name: string | null;
  email: string | null;
}

interface Signal {
  id: string;
  signal_type: string;
  symbol: string;
  price: number;
  signal_time: string;
  created_at: string;
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
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, buys: 0, sells: 0, latestSignal: null });
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPublicStrategy();
    }
  }, [slug]);

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
          .select('full_name, email')
          .eq('user_id', strategyData.user_id)
          .maybeSingle();
        
        if (ownerData) {
          setOwner(ownerData);
        }
      }

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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">TradeOrin</span>
          </Link>
          <div className="flex items-center gap-4">
            {owner && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {t.publicStrategy.sharedBy} {owner.full_name || owner.email?.split('@')[0] || 'Anonymous'}
                </span>
              </div>
            )}
            <Link to="/auth">
              <Button size="sm">{t.publicStrategy.getStarted}</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Strategy Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{strategy.name}</h1>
            <Badge className="signal-buy border">{t.publicStrategy.public}</Badge>
          </div>
          {strategy.description && (
            <p className="text-lg text-muted-foreground mb-4">{strategy.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {strategy.exchange && <span>📊 {strategy.exchange}</span>}
            {strategy.timeframe && <span>⏱️ {strategy.timeframe}</span>}
            <span>{t.publicStrategy.created} {formatDate(strategy.created_at, preferences.dateFormat)}</span>
          </div>
        </div>

        {/* Stats Cards */}
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
  );
};

export default PublicStrategy;
