import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Check, X, ArrowLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { FooterDisclaimer } from '@/components/FooterDisclaimer';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      { name: '1 Strategy', included: true },
      { name: '7-day signal history', included: true },
      { name: 'Webhook integration', included: true },
      { name: 'Email support', included: true },
      { name: 'CSV export', included: false },
      { name: 'Public strategy pages', included: false },
      { name: 'API access', included: false },
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For active traders',
    features: [
      { name: '10 Strategies', included: true },
      { name: '90-day signal history', included: true },
      { name: 'Webhook integration', included: true },
      { name: 'Priority support', included: true },
      { name: 'CSV export', included: true },
      { name: 'Public strategy pages', included: true },
      { name: 'API access', included: false },
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Elite',
    price: '$49',
    period: '/month',
    description: 'For professional traders',
    features: [
      { name: 'Unlimited strategies', included: true },
      { name: 'Unlimited signal history', included: true },
      { name: 'Webhook integration', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'CSV export', included: true },
      { name: 'Public strategy pages', included: true },
      { name: 'API access', included: true },
    ],
    cta: 'Go Elite',
    popular: false,
  },
];

const faqs = [
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards including Visa, Mastercard, and American Express. Payment processing is handled securely by Stripe.',
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer: 'You can start with our Free plan to test the platform. Upgrade anytime when you need more features.',
  },
  {
    question: 'What happens to my signals if I downgrade?',
    answer: 'Your signals are preserved, but you\'ll only be able to view signals within your new plan\'s history limit.',
  },
];

const Pricing = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<'PRO' | 'ELITE' | null>(null);

  const handleCheckout = async (plan: 'PRO' | 'ELITE') => {
    // If not logged in, redirect to auth
    if (!user || !session?.access_token) {
      navigate('/auth', { state: { redirect: '/pricing' } });
      return;
    }

    setCheckoutLoading(plan);

    try {
      const response = await supabase.functions.invoke('create-checkout', {
        body: { plan },
      });

      console.log('Checkout response:', response);

      // Handle function error (includes non-2xx responses)
      if (response.error) {
        console.error('Function error:', response.error);
        console.log('Response data:', response.data);
        
        // Try to extract the actual error message from the response
        let errorMessage = 'Failed to create checkout session';
        
        // Check if there's data with an error (edge function returned JSON error)
        if (response.data?.error) {
          errorMessage = response.data.error;
        } else if (response.error.message) {
          // Check for common configuration errors
          if (response.error.message.includes('non-2xx') || response.error.message.includes('500')) {
            // Edge function returned an error - likely Stripe not configured
            errorMessage = 'Payment processing is not yet configured. Please contact support or try again later.';
          } else if (response.error.message.includes('FunctionsHttpError')) {
            errorMessage = 'Payment service temporarily unavailable. Please try again later.';
          } else {
            errorMessage = response.error.message;
          }
        }
        
        throw new Error(errorMessage);
      }

      if (!response.data) {
        throw new Error('No response data from checkout function');
      }

      const { url, error: dataError } = response.data;
      
      if (dataError) {
        throw new Error(dataError);
      }
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      
      let errorMessage = 'Failed to start checkout. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.toString().includes('fetch')) {
        errorMessage = 'Unable to connect to payment service. Please try again later.';
      }
      
      toast({
        title: 'Checkout Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setCheckoutLoading(null);
    }
  };

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
            <Link to="/auth">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your trading needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`stat-card relative ${
                plan.popular ? 'border-primary glow-effect' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-success flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={feature.included ? '' : 'text-muted-foreground'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                {plan.name === 'Free' ? (
                  <Link to="/auth" className="block">
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant={plan.popular ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => handleCheckout(plan.name as 'PRO' | 'ELITE')}
                    disabled={checkoutLoading === plan.name}
                  >
                    {checkoutLoading === plan.name ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Upgrade
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Join hundreds of traders already using TradeOrin
          </p>
          <Link to="/auth">
            <Button size="lg" className="glow-effect">
              Start Free Today
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 mt-12">
        <div className="container mx-auto max-w-6xl">
          {/* Disclaimer */}
          <div className="mb-8">
            <FooterDisclaimer compact />
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
            <Link to="/" className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="font-semibold">TradeOrin</span>
            </Link>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <span>© 2026 TradeOrin</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
