import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Activity, Clock, Percent, BarChart3, PieChartIcon } from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

interface Signal {
  id: string;
  signal_type: string;
  symbol: string;
  price: number;
  signal_time: string;
  interval: string | null;
  created_at: string;
}

interface StrategyAnalyticsProps {
  signals: Signal[];
  strategyName: string;
}

export const StrategyAnalytics = ({ signals, strategyName }: StrategyAnalyticsProps) => {
  const analytics = useMemo(() => {
    if (signals.length === 0) {
      return null;
    }

    // Count signal types
    const buyCount = signals.filter(s => 
      ['BUY', 'LONG', 'ENTRY'].includes(s.signal_type.toUpperCase())
    ).length;
    const sellCount = signals.filter(s => 
      ['SELL', 'SHORT', 'EXIT'].includes(s.signal_type.toUpperCase())
    ).length;
    const otherCount = signals.length - buyCount - sellCount;

    // Symbol distribution
    const symbolCounts: Record<string, number> = {};
    signals.forEach(s => {
      symbolCounts[s.symbol] = (symbolCounts[s.symbol] || 0) + 1;
    });
    const symbolData = Object.entries(symbolCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Signals over time (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
    
    const signalsByDay: Record<string, { buy: number; sell: number; other: number }> = {};
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      signalsByDay[key] = { buy: 0, sell: 0, other: 0 };
    });

    signals.forEach(s => {
      const signalDate = format(new Date(s.created_at), 'yyyy-MM-dd');
      if (signalsByDay[signalDate]) {
        const type = s.signal_type.toUpperCase();
        if (['BUY', 'LONG', 'ENTRY'].includes(type)) {
          signalsByDay[signalDate].buy++;
        } else if (['SELL', 'SHORT', 'EXIT'].includes(type)) {
          signalsByDay[signalDate].sell++;
        } else {
          signalsByDay[signalDate].other++;
        }
      }
    });

    const timeSeriesData = Object.entries(signalsByDay).map(([date, counts]) => ({
      date: format(new Date(date), 'MMM d'),
      fullDate: date,
      ...counts,
      total: counts.buy + counts.sell + counts.other,
    }));

    // Hourly distribution
    const hourlyDistribution: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourlyDistribution[i] = 0;
    signals.forEach(s => {
      const hour = new Date(s.created_at).getHours();
      hourlyDistribution[hour]++;
    });
    const hourlyData = Object.entries(hourlyDistribution).map(([hour, count]) => ({
      hour: `${hour}:00`,
      signals: count,
    }));

    // Calculate averages
    const avgPrice = signals.reduce((sum, s) => sum + Number(s.price), 0) / signals.length;
    const signalsPerDay = signals.length / 30;

    // Recent activity (last 7 days vs previous 7 days)
    const sevenDaysAgo = subDays(now, 7);
    const fourteenDaysAgo = subDays(now, 14);
    const recentSignals = signals.filter(s => new Date(s.created_at) >= sevenDaysAgo).length;
    const previousSignals = signals.filter(s => {
      const date = new Date(s.created_at);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    }).length;
    const trendPercent = previousSignals > 0 
      ? ((recentSignals - previousSignals) / previousSignals * 100)
      : recentSignals > 0 ? 100 : 0;

    return {
      total: signals.length,
      buyCount,
      sellCount,
      otherCount,
      buyPercent: (buyCount / signals.length * 100).toFixed(1),
      sellPercent: (sellCount / signals.length * 100).toFixed(1),
      symbolData,
      timeSeriesData,
      hourlyData,
      avgPrice,
      signalsPerDay: signalsPerDay.toFixed(1),
      recentSignals,
      trendPercent: trendPercent.toFixed(0),
      isTrendUp: trendPercent >= 0,
    };
  }, [signals]);

  if (!analytics) {
    return (
      <Card className="glass-card">
        <CardContent className="py-16 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
          <p className="text-muted-foreground">
            Start receiving signals to see performance analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  const pieColors = ['hsl(var(--buy))', 'hsl(var(--sell))', 'hsl(var(--muted-foreground))'];
  const signalTypeData = [
    { name: 'Buy', value: analytics.buyCount },
    { name: 'Sell', value: analytics.sellCount },
    { name: 'Other', value: analytics.otherCount },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Signals</p>
                <p className="text-3xl font-bold mt-1">{analytics.total}</p>
                <div className="flex items-center gap-1 mt-2">
                  {analytics.isTrendUp ? (
                    <TrendingUp className="h-3.5 w-3.5 text-buy" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-sell" />
                  )}
                  <span className={`text-xs font-medium ${analytics.isTrendUp ? 'text-buy' : 'text-sell'}`}>
                    {analytics.trendPercent}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs last week</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Buy/Sell Ratio</p>
                <p className="text-3xl font-bold mt-1">
                  {analytics.sellCount > 0 ? (analytics.buyCount / analytics.sellCount).toFixed(2) : '∞'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="signal-buy border text-xs px-2">{analytics.buyCount} Buy</Badge>
                  <Badge variant="outline" className="signal-sell border text-xs px-2">{analytics.sellCount} Sell</Badge>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-buy/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-buy" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Daily</p>
                <p className="text-3xl font-bold mt-1">{analytics.signalsPerDay}</p>
                <p className="text-xs text-muted-foreground mt-2">signals per day</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Symbol</p>
                <p className="text-2xl font-bold font-mono mt-1">
                  {analytics.symbolData[0]?.name || '-'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {analytics.symbolData[0]?.value || 0} signals
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Signals Over Time */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Signals Over Time (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeSeriesData}>
                  <defs>
                    <linearGradient id="buyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--buy))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--buy))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sellGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--sell))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--sell))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="buy"
                    stackId="1"
                    stroke="hsl(var(--buy))"
                    fill="url(#buyGradient)"
                    strokeWidth={2}
                    name="Buy"
                  />
                  <Area
                    type="monotone"
                    dataKey="sell"
                    stackId="1"
                    stroke="hsl(var(--sell))"
                    fill="url(#sellGradient)"
                    strokeWidth={2}
                    name="Sell"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Signal Type Distribution */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              Signal Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={signalTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {signalTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-buy" />
                    <span className="text-sm">Buy/Long</span>
                  </div>
                  <span className="font-semibold">{analytics.buyPercent}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-sell" />
                    <span className="text-sm">Sell/Short</span>
                  </div>
                  <span className="font-semibold">{analytics.sellPercent}%</span>
                </div>
                {analytics.otherCount > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                      <span className="text-sm">Other</span>
                    </div>
                    <span className="font-semibold">
                      {(100 - Number(analytics.buyPercent) - Number(analytics.sellPercent)).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Symbol Breakdown */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Top Symbols
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.symbolData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]} 
                    name="Signals"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Hourly Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar 
                    dataKey="signals" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                    name="Signals"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
