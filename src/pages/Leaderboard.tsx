import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Activity, 
  Trophy, 
  TrendingUp, 
  Users, 
  Search, 
  ArrowUpRight,
  Loader2,
  Medal,
  Target,
  BarChart3,
  Crown,
  Star
} from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { formatDate } from '@/lib/formatUtils';
import { useLanguage } from '@/i18n';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SEO } from '@/components/SEO';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardStrategy {
  strategy_id: string;
  strategy_name: string;
  strategy_slug: string | null;
  strategy_description: string | null;
  strategy_exchange: string | null;
  strategy_timeframe: string | null;
  owner_name: string | null;
  owner_avatar: string | null;
  total_trades: number;
  win_rate: number;
  total_pnl_percent: number;
  profit_factor: number;
  follower_count: number;
  subscriber_count: number;
  ranking_score: number;
  first_trade_at: string | null;
  last_trade_at: string | null;
}

const Leaderboard = () => {
  const { preferences } = usePreferences();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isDarkMode = theme === 'dark';
  
  const [strategies, setStrategies] = useState<LeaderboardStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('ranking_score');
  const [minTrades, setMinTrades] = useState('10');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy, minTrades]);

  useEffect(() => {
    if (user) {
      fetchFollowing();
    }
  }, [user]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_strategy_leaderboard', {
        p_limit: 50,
        p_min_trades: parseInt(minTrades),
        p_sort_by: sortBy
      });

      if (error) throw error;
      setStrategies(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: t.common.error,
        description: 'Failed to load leaderboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('strategy_subscriptions')
        .select('strategy_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (data) {
        setFollowingIds(new Set(data.map(s => s.strategy_id)));
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const handleFollow = async (strategyId: string) => {
    if (!user) {
      navigate('/auth', { state: { redirect: '/leaderboard' } });
      return;
    }

    setFollowLoading(strategyId);

    try {
      if (followingIds.has(strategyId)) {
        const { error } = await supabase.rpc('unfollow_strategy', {
          p_strategy_id: strategyId
        });
        if (error) throw error;
        
        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(strategyId);
          return next;
        });
        
        toast({
          title: t.subscription?.unfollowed || 'Unfollowed',
        });
      } else {
        const { error } = await supabase.rpc('follow_strategy', {
          p_strategy_id: strategyId
        });
        if (error) throw error;
        
        setFollowingIds(prev => new Set([...prev, strategyId]));
        
        toast({
          title: t.subscription?.followed || 'Following!',
        });
      }
    } catch (error: any) {
      console.error('Error following/unfollowing:', error);
      toast({
        title: t.common.error,
        description: error.message || 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setFollowLoading(null);
    }
  };

  const filteredStrategies = strategies.filter(s => 
    s.strategy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.owner_name && s.owner_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.strategy_exchange && s.strategy_exchange.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRankBadge = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <>
      <SEO 
        title="Strategy Leaderboard - TradeMoq"
        description="Discover top-performing trading strategies from verified traders. View win rates, profit factors, and follow the best strategies on TradeMoq."
        keywords="trading leaderboard, best trading strategies, verified traders, copy trading, trading signals"
        canonical="https://trademoq.com/leaderboard"
      />
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-xl overflow-hidden" style={{ height: '64px' }}>
          <div className="container mx-auto px-6 h-full flex items-center justify-between">
            <Link to="/" className="flex items-center group h-full">
              <img
                src={isDarkMode ? '/tm_logo.svg' : '/tm_logo_black.svg'}
                alt="TradeMoq Logo"
                className="h-48 w-auto transition-all duration-300 group-hover:scale-105"
                key={theme}
              />
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              <a href="/#features" className="nav-link">Features</a>
              <a href="/#how-it-works" className="nav-link">How It Works</a>
              <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
              <a href="/#pricing" className="nav-link">Pricing</a>
              <Link to="/blog" className="nav-link">Blog</Link>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 border-l border-border pl-3 ml-3">
                <LanguageSwitcher />
                <ColorSchemePicker />
                <ThemeToggle />
              </div>
              {user ? (
                <Link to="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="sm">{t.publicStrategy.getStarted}</Button>
                </Link>
              )}
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-8 max-w-6xl pt-24">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="h-10 w-10 text-yellow-500" />
              <h1 className="text-4xl font-bold">{t.leaderboard?.title || 'Strategy Leaderboard'}</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.leaderboard?.subtitle || 'Discover top-performing trading strategies from verified traders'}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.common.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.leaderboard?.sortBy || 'Sort by'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ranking_score">{t.leaderboard?.ranking || 'Ranking Score'}</SelectItem>
                <SelectItem value="win_rate">{t.leaderboard?.winRate || 'Win Rate'}</SelectItem>
                <SelectItem value="pnl">{t.leaderboard?.pnl || 'Total P&L'}</SelectItem>
                <SelectItem value="profit_factor">{t.leaderboard?.profitFactor || 'Profit Factor'}</SelectItem>
                <SelectItem value="followers">{t.leaderboard?.followers || 'Followers'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={minTrades} onValueChange={setMinTrades}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.leaderboard?.minTrades || 'Min. trades'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5+ {t.leaderboard?.trades || 'trades'}</SelectItem>
                <SelectItem value="10">10+ {t.leaderboard?.trades || 'trades'}</SelectItem>
                <SelectItem value="25">25+ {t.leaderboard?.trades || 'trades'}</SelectItem>
                <SelectItem value="50">50+ {t.leaderboard?.trades || 'trades'}</SelectItem>
                <SelectItem value="100">100+ {t.leaderboard?.trades || 'trades'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Leaderboard */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredStrategies.length === 0 ? (
            <Card className="py-20">
              <CardContent className="text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t.leaderboard?.noStrategies || 'No strategies found'}</h3>
                <p className="text-muted-foreground mb-6">
                  {t.leaderboard?.noStrategiesDescription || 'Be the first to create a public strategy with verified performance!'}
                </p>
                <Link to="/auth">
                  <Button>{t.publicStrategy.getStartedFree}</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredStrategies.map((strategy, index) => (
                <Card 
                  key={strategy.strategy_id} 
                  className={`hover:border-primary/50 transition-colors ${index < 3 ? 'border-primary/30' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                        {getRankBadge(index)}
                      </div>

                      {/* Strategy Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Link 
                            to={`/s/${strategy.strategy_slug || strategy.strategy_id}`}
                            className="text-lg font-semibold hover:text-primary transition-colors truncate"
                          >
                            {strategy.strategy_name}
                          </Link>
                          {strategy.strategy_exchange && (
                            <Badge variant="outline" className="text-xs">
                              {strategy.strategy_exchange}
                            </Badge>
                          )}
                          {strategy.strategy_timeframe && (
                            <Badge variant="secondary" className="text-xs">
                              {strategy.strategy_timeframe}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {strategy.owner_name && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={strategy.owner_avatar || undefined} />
                                <AvatarFallback className="text-xs">
                                  {strategy.owner_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{strategy.owner_name}</span>
                            </div>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {strategy.follower_count + strategy.subscriber_count} {t.leaderboard?.followers || 'followers'}
                          </span>
                          <span>{strategy.total_trades} {t.leaderboard?.trades || 'trades'}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 lg:gap-8">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Target className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className={`text-lg font-bold ${strategy.win_rate >= 50 ? 'text-buy' : 'text-destructive'}`}>
                            {strategy.win_rate.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">{t.leaderboard?.winRate || 'Win Rate'}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className={`text-lg font-bold ${strategy.total_pnl_percent >= 0 ? 'text-buy' : 'text-destructive'}`}>
                            {strategy.total_pnl_percent >= 0 ? '+' : ''}{strategy.total_pnl_percent.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">{t.leaderboard?.pnl || 'P&L'}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className={`text-lg font-bold ${strategy.profit_factor >= 1 ? 'text-buy' : 'text-destructive'}`}>
                            {strategy.profit_factor > 99 ? '∞' : strategy.profit_factor.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">{t.leaderboard?.profitFactor || 'PF'}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant={followingIds.has(strategy.strategy_id) ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleFollow(strategy.strategy_id)}
                          disabled={followLoading === strategy.strategy_id}
                        >
                          {followLoading === strategy.strategy_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : followingIds.has(strategy.strategy_id) ? (
                            t.leaderboard?.following || 'Following'
                          ) : (
                            t.leaderboard?.follow || 'Follow'
                          )}
                        </Button>
                        <Link to={`/s/${strategy.strategy_slug || strategy.strategy_id}`}>
                          <Button variant="ghost" size="sm">
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 text-center">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-12">
                <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Want to be on the leaderboard?</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create a public strategy, verify your performance, and attract followers.
                </p>
                <Link to="/auth">
                  <Button size="lg" className="glow-effect">
                    {t.publicStrategy.getStartedFree}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-6 mt-12">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div className="text-lg">
                  <span className="italic" style={{ fontFamily: "'Times New Roman', serif", fontStyle: 'italic', fontWeight: 'normal' }}>trade</span>
                  <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 800 }}>moq</span>
                </div>
              </Link>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                <span>© 2026 TradeMoq</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Leaderboard;
