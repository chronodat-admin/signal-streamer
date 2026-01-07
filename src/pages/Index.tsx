import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Shield, BarChart3, ArrowRight, Check, Sparkles, LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Removed auto-redirect to allow users to see the home page
  // Users can click the Dashboard button to go to dashboard

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-md">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">SignalPulse</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/pricing" className="nav-link hidden sm:block">Pricing</Link>
            <ColorSchemePicker />
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard">
                <Button size="sm" className="shadow-md gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="shadow-md">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span>Real-time TradingView Signal Tracking</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in tracking-tight leading-[1.1]">
            Track Your Trading
            <br />
            <span className="gradient-text">Signals with Precision</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in leading-relaxed">
            Connect TradingView webhooks to SignalPulse and never miss a signal. 
            Track, analyze, and share your trading strategies in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all h-12 px-8">
                  <LayoutDashboard className="h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all h-12 px-8">
                    Start Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" size="lg" className="h-12 px-8">View Pricing</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10K+', label: 'Signals Tracked' },
              { value: '500+', label: 'Active Traders' },
              { value: '99.9%', label: 'Uptime' },
              { value: '<50ms', label: 'Latency' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Everything You Need to Track Signals
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Simple webhook integration, powerful analytics, and real-time notifications.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Instant Webhooks',
                description: 'Connect TradingView alerts in seconds. Just paste your webhook URL and start tracking.',
                color: 'text-primary bg-primary/10',
              },
              {
                icon: BarChart3,
                title: 'Signal Analytics',
                description: 'Track signal performance with detailed metrics. Analyze BUY/SELL ratios and timing.',
                color: 'text-emerald-500 bg-emerald-500/10',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Your strategies stay private by default. Share only when you want to.',
                color: 'text-violet-500 bg-violet-500/10',
              },
            ].map((feature, i) => (
              <div key={i} className="stat-card group cursor-default">
                <div className={`h-14 w-14 rounded-xl ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground text-lg">Start free, upgrade when you need more power.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: 'Free',
                price: '$0',
                features: ['1 Strategy', '7-day history', 'Webhook integration'],
              },
              {
                name: 'Pro',
                price: '$19',
                popular: true,
                features: ['10 Strategies', '90-day history', 'CSV Export', 'Public pages'],
              },
              {
                name: 'Elite',
                price: '$49',
                features: ['Unlimited strategies', 'Unlimited history', 'Priority support', 'API access'],
              },
            ].map((plan, i) => (
              <div key={i} className={`stat-card relative ${plan.popular ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-cyan-500 text-white text-xs font-semibold rounded-full shadow-md">
                    Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-1">
                  {plan.price}<span className="text-base font-normal text-muted-foreground">/mo</span>
                </div>
                <ul className="space-y-3 my-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="block">
                  <Button variant={plan.popular ? 'default' : 'outline'} className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Ready to Track Your Signals?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join hundreds of traders already using SignalPulse.
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all h-12 px-8">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold">SignalPulse</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2026 SignalPulse. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
