import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Activity, Zap, Shield, BarChart3, ArrowRight, Check, 
  LayoutDashboard, Target, Clock, Share2, Download, Gauge, 
  TrendingUp, TrendingDown, Play, ChevronRight, Radio, 
  Bell, Webhook, ExternalLink, LineChart, Cpu
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';
import { FooterDisclaimer } from '@/components/FooterDisclaimer';
import { SEO } from '@/components/SEO';

// Simulated live signals for the hero visualization
const generateSignal = () => {
  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AAPL', 'NVDA', 'TSLA', 'EUR/USD', 'GBP/JPY'];
  const types = ['BUY', 'SELL'] as const;
  return {
    id: Math.random().toString(36).substr(2, 9),
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    type: types[Math.floor(Math.random() * types.length)],
    price: (Math.random() * 1000 + 100).toFixed(2),
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
};

// Live signal feed component
const LiveSignalFeed = () => {
  const [signals, setSignals] = useState(() => Array.from({ length: 5 }, generateSignal));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSignals(prev => [generateSignal(), ...prev.slice(0, 4)]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-card to-transparent z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent z-10" />
      
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-buy opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-buy"></span>
          </span>
          <span className="font-medium">Live Signal Feed</span>
        </div>
        
        {signals.map((signal, i) => (
          <div 
            key={signal.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-500 ${
              i === 0 ? 'bg-primary/10 border border-primary/20 scale-100' : 'bg-muted/30 scale-[0.98] opacity-70'
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-md ${signal.type === 'BUY' ? 'bg-buy/20' : 'bg-sell/20'}`}>
                {signal.type === 'BUY' ? (
                  <TrendingUp className={`h-3.5 w-3.5 text-buy`} />
                ) : (
                  <TrendingDown className={`h-3.5 w-3.5 text-sell`} />
                )}
              </div>
              <div>
                <span className="font-mono text-sm font-medium">{signal.symbol}</span>
                <div className="text-[10px] text-muted-foreground">{signal.time}</div>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                signal.type === 'BUY' ? 'bg-buy/20 text-buy' : 'bg-sell/20 text-sell'
              }`}>
                {signal.type}
              </span>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">${signal.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Animated background grid
const GridBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-grid-pattern opacity-40" />
    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-float" />
    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] animate-float-delayed" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/3 to-transparent rounded-full" />
  </div>
);

// Stats counter animation
const AnimatedCounter = ({ value, suffix = '' }: { value: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState('0');
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Animate to final value
          const numericPart = value.replace(/[^0-9.]/g, '');
          const prefix = value.match(/^[^0-9]*/)?.[0] || '';
          const duration = 2000;
          const startTime = Date.now();
          const endValue = parseFloat(numericPart);
          
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4); // Ease out quart
            const current = endValue * eased;
            
            if (numericPart.includes('.')) {
              setDisplayValue(prefix + current.toFixed(1));
            } else {
              setDisplayValue(prefix + Math.floor(current).toString());
            }
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(value);
            }
          };
          
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{displayValue}{suffix}</span>;
};

const Index = () => {
  const { user } = useAuth();
  const [activeFeature, setActiveFeature] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Webhook,
      title: 'TradingView Webhook Integration',
      description: 'Connect your TradingView alerts in under 60 seconds. Simply paste your webhook URL and start receiving signals instantly.',
      color: 'bg-primary/10 text-primary',
      demo: 'webhook',
    },
    {
      icon: LineChart,
      title: 'Real-Time Analytics Dashboard',
      description: 'Monitor signal performance with live metrics. Track win rates, signal frequency, and timing patterns across all strategies.',
      color: 'bg-cyan-500/10 text-cyan-500',
      demo: 'analytics',
    },
    {
      icon: Target,
      title: 'Multi-Strategy Management',
      description: 'Organize unlimited strategies by exchange, timeframe, or trading style. Each with its own webhook endpoint and analytics.',
      color: 'bg-violet-500/10 text-violet-500',
      demo: 'strategies',
    },
    {
      icon: Share2,
      title: 'Public Strategy Pages',
      description: 'Share your track record with shareable public pages. Perfect for signal providers and trading communities.',
      color: 'bg-emerald-500/10 text-emerald-500',
      demo: 'public',
    },
  ];

  return (
    <>
      <SEO 
        title="TradeMoq - Real-Time Trading Signal Tracking Platform"
        description="Connect TradingView webhooks to TradeMoq. Track, analyze, and share your trading signals with sub-50ms latency. Real-time analytics, multi-strategy management, and public strategy pages."
        keywords="trading signals, TradingView, webhook, trading alerts, signal tracking, trading analytics, cryptocurrency signals, stock signals, forex signals"
        canonical="https://trademoq.com/"
      />
      <div className="min-h-screen bg-background noise-overlay">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-xl overflow-hidden" style={{ height: '64px' }}>
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center group h-full">
            <img 
              src={isDarkMode ? '/tm_logo.svg' : '/tm_logo_black.svg'} 
              alt="TradeMoq Logo" 
              className="h-48 w-auto transition-transform group-hover:scale-105"
            />
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <Link to="/blog" className="nav-link">Blog</Link>
          </div>
          
          <div className="flex items-center gap-2">
            <ColorSchemePicker />
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard" >
                <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth" >
                  <Button variant="ghost" size="sm" className="hidden sm:flex">Sign In</Button>
                </Link>
                <Link to="/auth" >
                  <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-6 overflow-hidden">
        <GridBackground />
        
        <div className="container mx-auto max-w-7xl relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Hero content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6 animate-slide-up">
                <Radio className="h-3 w-3 animate-pulse" />
                <span>Real-Time Signal Tracking</span>
                <ChevronRight className="h-3 w-3" />
              </div>
              
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 tracking-tight animate-slide-up" style={{ animationDelay: '100ms' }}>
                <span className="block">Never Miss a</span>
                <span className="block mt-1">
                  <span className="gradient-text">Trading Signal</span>
                </span>
                <span className="block mt-1 text-muted-foreground/80">Again.</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '200ms' }}>
                Connect TradingView webhooks to TradeMoq. Track, analyze, and share your trading signals with{' '}
                <span className="text-foreground font-medium">sub-50ms latency</span>.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
                <Link to="/auth" >
                  <Button size="lg" className="gap-2 h-12 px-8 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                    <Play className="h-4 w-4 fill-current" />
                    Start Free Trial
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-8 group">
                    See How It Works
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
              </div>
              
              {/* Trust indicators */}
              <div className="flex items-center justify-center lg:justify-start gap-6 mt-10 text-sm text-muted-foreground animate-slide-up" style={{ animationDelay: '400ms' }}>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-buy" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-buy" />
                  <span>Setup in 60 seconds</span>
                </div>
              </div>
            </div>
            
            {/* Right: Live signal feed visualization */}
            <div className="relative animate-slide-up" style={{ animationDelay: '300ms' }}>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-cyan-500/20 to-violet-500/20 rounded-2xl blur-2xl opacity-50" />
              <div className="relative">
                <LiveSignalFeed />
                
                {/* Floating badge */}
                <div className="absolute -top-3 -right-3 bg-card border border-border rounded-lg px-3 py-2 shadow-xl animate-float">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">&lt;50ms Latency</span>
                  </div>
                </div>
                
                {/* Bottom metrics */}
                <div className="absolute -bottom-4 left-4 right-4 bg-card border border-border rounded-lg px-4 py-3 shadow-xl">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Signals Today</span>
                      <span className="font-bold">247</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-buy" />
                      <span className="text-buy font-medium">+12.4%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-16 border-y border-border/50 bg-muted/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="container mx-auto px-6 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {[
              { value: '50K', suffix: '+', label: 'Signals Tracked', icon: Activity },
              { value: '2.5K', suffix: '+', label: 'Active Traders', icon: Target },
              { value: '99.9', suffix: '%', label: 'Uptime SLA', icon: Shield },
              { value: '47', suffix: 'ms', label: 'Avg. Latency', icon: Gauge },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-3xl lg:text-4xl font-display font-bold mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-xs font-medium mb-4">
              <Cpu className="h-3 w-3" />
              <span>Simple Integration</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              Up and Running in{' '}
              <span className="gradient-text">3 Steps</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              No coding required. Connect TradingView to TradeMoq in under a minute.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/50 via-cyan-500/50 to-violet-500/50" />
            
            {[
              {
                step: '01',
                title: 'Create a Strategy',
                description: 'Define your trading strategy with a name, description, and preferred settings. Get a unique webhook URL instantly.',
                icon: Target,
                color: 'from-primary to-primary',
              },
              {
                step: '02',
                title: 'Connect TradingView',
                description: 'Copy your webhook URL into TradingView alerts. Use our JSON template or customize your payload format.',
                icon: Webhook,
                color: 'from-cyan-500 to-cyan-500',
              },
              {
                step: '03',
                title: 'Track & Analyze',
                description: 'Watch signals flow in real-time. Access analytics, export data, and share your track record with public pages.',
                icon: BarChart3,
                color: 'from-violet-500 to-violet-500',
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl" 
                     style={{ backgroundImage: `linear-gradient(to right, ${item.color.split(' ')[0].replace('from-', 'var(--')}), ${item.color.split(' ')[1].replace('to-', 'var(--')})` }} />
                <div className="relative stat-card h-full text-center group-hover:border-primary/30 transition-colors">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="text-xs font-mono text-primary mb-2">STEP {item.step}</div>
                  <h3 className="font-heading text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-muted/20 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500 text-xs font-medium mb-4">
              <Zap className="h-3 w-3" />
              <span>Powerful Features</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              Built for{' '}
              <span className="gradient-text">Serious Traders</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Everything you need to track, analyze, and share your trading signals.
            </p>
          </div>
          
          {/* Feature showcase with tabs */}
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Feature tabs */}
            <div className="lg:col-span-2 space-y-3">
              {features.map((feature, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                    activeFeature === i 
                      ? 'bg-card border-primary/30 shadow-lg shadow-primary/10' 
                      : 'bg-card/50 border-border/50 hover:border-border'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${feature.color} transition-transform ${activeFeature === i ? 'scale-110' : ''}`}>
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold mb-1">{feature.title}</h3>
                      <p className={`text-sm text-muted-foreground transition-all ${activeFeature === i ? 'opacity-100' : 'opacity-60'}`}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Feature preview */}
            <div className="lg:col-span-3">
              <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden shadow-2xl">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-background text-xs text-muted-foreground font-mono">
                      app.trademoq.com/dashboard
                    </div>
                  </div>
                </div>
                
                {/* Feature preview content */}
                <div className="p-6 min-h-[400px]">
                  {activeFeature === 0 && (
                    <div className="space-y-4 animate-fade-in">
                      <h4 className="font-heading font-semibold text-lg mb-4">Your Webhook URL</h4>
                      <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm break-all">
                        <span className="text-muted-foreground">https://</span>
                        <span className="text-primary">trademoq.com/api/webhook/</span>
                        <span className="text-cyan-500">abc123xyz</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="p-4 rounded-lg border border-border">
                          <div className="text-xs text-muted-foreground mb-1">Signals Received</div>
                          <div className="text-2xl font-bold">1,247</div>
                        </div>
                        <div className="p-4 rounded-lg border border-border">
                          <div className="text-xs text-muted-foreground mb-1">Last Signal</div>
                          <div className="text-2xl font-bold text-buy">BUY</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeFeature === 1 && (
                    <div className="space-y-4 animate-fade-in">
                      <h4 className="font-heading font-semibold text-lg mb-4">Performance Metrics</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Win Rate', value: '67.8%', change: '+5.2%' },
                          { label: 'Signals/Day', value: '24.3', change: '+12%' },
                          { label: 'Best Symbol', value: 'BTC', change: '' },
                        ].map((metric, i) => (
                          <div key={i} className="p-4 rounded-lg border border-border text-center">
                            <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
                            <div className="text-xl font-bold">{metric.value}</div>
                            {metric.change && <div className="text-xs text-buy">{metric.change}</div>}
                          </div>
                        ))}
                      </div>
                      <div className="h-32 rounded-lg bg-muted/30 flex items-end justify-around p-4 mt-6">
                        {[65, 45, 80, 55, 70, 90, 75].map((h, i) => (
                          <div key={i} className="w-8 bg-primary/60 rounded-t" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {activeFeature === 2 && (
                    <div className="space-y-4 animate-fade-in">
                      <h4 className="font-heading font-semibold text-lg mb-4">Your Strategies</h4>
                      {[
                        { name: 'BTC Scalper', signals: 847, active: true },
                        { name: 'ETH Swing', signals: 234, active: true },
                        { name: 'Forex Majors', signals: 166, active: false },
                      ].map((strategy, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${strategy.active ? 'bg-buy' : 'bg-muted-foreground'}`} />
                            <span className="font-medium">{strategy.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">{strategy.signals} signals</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeFeature === 3 && (
                    <div className="space-y-4 animate-fade-in">
                      <h4 className="font-heading font-semibold text-lg mb-4">Public Strategy Page</h4>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <ExternalLink className="h-4 w-4 text-primary" />
                          <span className="font-mono">trademoq.com/s/</span>
                          <span className="font-mono text-primary">your-strategy</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Share this link with your community</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="p-4 rounded-lg border border-border">
                          <div className="text-xs text-muted-foreground mb-1">Page Views</div>
                          <div className="text-2xl font-bold">3,421</div>
                        </div>
                        <div className="p-4 rounded-lg border border-border">
                          <div className="text-xs text-muted-foreground mb-1">Followers</div>
                          <div className="text-2xl font-bold">89</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional features grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
            {[
              { icon: Clock, title: 'Historical Data', desc: 'Up to unlimited history retention' },
              { icon: Download, title: 'CSV Export', desc: 'Download your data anytime' },
              { icon: Shield, title: 'Secure by Default', desc: 'Row-level security & encryption' },
              { icon: Gauge, title: 'Smart Rate Limits', desc: 'Scale up to 20 signals/sec' },
            ].map((feature, i) => (
              <div key={i} className="stat-card flex items-start gap-4 group hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <feature.icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-sm mb-1">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium mb-4">
              <Check className="h-3 w-3" />
              <span>Simple Pricing</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              Start Free,{' '}
              <span className="gradient-text">Scale as You Grow</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              No hidden fees. No surprise charges. Upgrade or downgrade anytime.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Free',
                price: '$0',
                description: 'Perfect for getting started',
                features: ['1 Strategy', '7-day signal history', 'Webhook integration', 'Basic analytics'],
                cta: 'Get Started',
                popular: false,
              },
              {
                name: 'Pro',
                price: '$19',
                description: 'For active traders',
                features: ['10 Strategies', '90-day signal history', 'CSV data export', 'Public strategy pages', 'Priority support'],
                cta: 'Start Pro Trial',
                popular: true,
              },
              {
                name: 'Elite',
                price: '$49',
                description: 'For power users & teams',
                features: ['Unlimited strategies', 'Unlimited history', 'API access', 'Custom integrations', 'Dedicated support'],
                cta: 'Contact Sales',
                popular: false,
              },
            ].map((plan, i) => (
              <div 
                key={i} 
                className={`relative stat-card ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-cyan-500 text-white text-xs font-semibold rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-heading text-xl font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth"  className="block">
                  <Button 
                    variant={plan.popular ? 'default' : 'outline'} 
                    className={`w-full ${plan.popular ? 'shadow-lg shadow-primary/25' : ''}`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-4xl text-center relative">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            Ready to Streamline Your
            <br />
            <span className="gradient-text">Signal Tracking?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of traders already using TradeMoq to track and analyze their trading signals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="gap-2 h-14 px-10 text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                <Play className="h-4 w-4 fill-current" />
                Start Your Free Trial
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Free forever on the starter plan
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 bg-muted/10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center -my-4">
                <img 
                  src={isDarkMode ? '/tm_logo.svg' : '/tm_logo_black.svg'} 
                  alt="TradeMoq Logo" 
                  className="h-56 w-auto"
                />
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs">
                The modern way to track, analyze, and share your trading signals from TradingView and beyond.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="mb-8">
            <FooterDisclaimer />
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2026 TradeMoq. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default Index;
