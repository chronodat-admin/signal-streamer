import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Calendar, ArrowUpRight, Check, Sparkles, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

type PlanType = Database['public']['Enums']['plan_type'];

interface Profile {
  plan: PlanType;
  plan_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

interface PlanDetails {
  name: string;
  price: string;
  priceMonthly: number;
  features: string[];
  recommended?: boolean;
}

const planDetails: Record<PlanType, PlanDetails> = {
  FREE: {
    name: 'Free',
    price: '$0/forever',
    priceMonthly: 0,
    features: ['1 Strategy', '7-day signal history', 'Webhook integration', 'Email support'],
  },
  PRO: {
    name: 'Pro',
    price: '$19/month',
    priceMonthly: 19,
    features: ['10 Strategies', '90-day signal history', 'CSV export', 'Public strategy pages', 'Priority support'],
    recommended: true,
  },
  ELITE: {
    name: 'Elite',
    price: '$49/month',
    priceMonthly: 49,
    features: ['Unlimited strategies', 'Unlimited history', 'API access', 'Custom integrations', 'Dedicated support'],
  },
};

const Billing = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanType | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Handle success/canceled states from Stripe redirect
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    // Clear URL params after showing the message
    if (isSuccess || isCanceled) {
      const timer = setTimeout(() => {
        setSearchParams({});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isCanceled, setSearchParams]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at, stripe_customer_id, stripe_subscription_id')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  // Refetch profile after successful checkout
  useEffect(() => {
    if (isSuccess) {
      const refetchProfile = async () => {
        if (!user) return;
        
        // Wait a bit for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data } = await supabase
          .from('profiles')
          .select('plan, plan_expires_at, stripe_customer_id, stripe_subscription_id')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setProfile(data);
        }
      };
      refetchProfile();
    }
  }, [isSuccess, user]);

  const handleCheckout = async (plan: 'PRO' | 'ELITE') => {
    if (!session?.access_token) {
      toast({
        title: 'Error',
        description: 'Please sign in to upgrade your plan.',
        variant: 'destructive',
      });
      return;
    }

    setCheckoutLoading(plan);

    try {
      const response = await supabase.functions.invoke('create-checkout', {
        body: { plan },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create checkout session');
      }

      const { url } = response.data;
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Failed',
        description: error.message || 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!session?.access_token) {
      toast({
        title: 'Error',
        description: 'Please sign in to manage your subscription.',
        variant: 'destructive',
      });
      return;
    }

    setPortalLoading(true);

    try {
      const response = await supabase.functions.invoke('create-portal', {});

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create portal session');
      }

      const { url } = response.data;
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to open billing portal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const currentPlan = profile?.plan || 'FREE';
  const details = planDetails[currentPlan];
  const hasSubscription = profile?.stripe_subscription_id;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Billing</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and payment methods
          </p>
        </div>

        {/* Success/Canceled Alerts */}
        {isSuccess && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Payment Successful!</AlertTitle>
            <AlertDescription>
              Thank you for upgrading! Your new plan is now active. It may take a moment for changes to reflect.
            </AlertDescription>
          </Alert>
        )}

        {isCanceled && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle>Checkout Canceled</AlertTitle>
            <AlertDescription>
              Your checkout was canceled. No charges were made. Feel free to try again when you're ready.
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32 mt-1" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-28" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40 mt-1" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Current Plan */}
              <Card className="stat-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Current Plan</CardTitle>
                    <Badge variant={currentPlan === 'FREE' ? 'secondary' : 'default'}>
                      {details.name}
                    </Badge>
                  </div>
                  <CardDescription>Your active subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">{details.price}</div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {details.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {profile?.plan_expires_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Renews on {new Date(profile.plan_expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subscription Management */}
              <Card className="stat-card">
                <CardHeader>
                  <CardTitle className="text-lg">Subscription Management</CardTitle>
                  <CardDescription>
                    {hasSubscription 
                      ? 'Manage your subscription, payment methods, and invoices'
                      : 'Upgrade to unlock more features'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasSubscription ? (
                    <>
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="p-2 rounded-md bg-background">
                          <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Active Subscription</p>
                          <p className="text-xs text-muted-foreground">
                            Manage billing via Stripe
                          </p>
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={handleManageSubscription}
                        disabled={portalLoading}
                      >
                        {portalLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Opening Portal...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Manage Subscription
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Update payment method, view invoices, or cancel subscription
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="p-2 rounded-md bg-background">
                          <Sparkles className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Upgrade Your Plan</p>
                          <p className="text-xs text-muted-foreground">
                            Get more strategies, longer history & premium features
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        Choose a plan below to upgrade
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upgrade Options */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                {currentPlan === 'FREE' ? 'Upgrade Your Plan' : 'Change Plan'}
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                {(['FREE', 'PRO', 'ELITE'] as PlanType[]).map((plan) => {
                  const planInfo = planDetails[plan];
                  const isCurrent = plan === currentPlan;
                  const isDowngrade = planInfo.priceMonthly < details.priceMonthly;
                  const isUpgrade = planInfo.priceMonthly > details.priceMonthly;

                  return (
                    <Card 
                      key={plan} 
                      className={`stat-card relative ${
                        planInfo.recommended && !isCurrent ? 'border-primary ring-1 ring-primary' : ''
                      } ${isCurrent ? 'ring-2 ring-primary/50' : ''}`}
                    >
                      {planInfo.recommended && !isCurrent && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground">
                            Recommended
                          </Badge>
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge variant="secondary">Current Plan</Badge>
                        </div>
                      )}
                      <CardHeader className="text-center pb-4 pt-6">
                        <CardTitle className="text-xl">{planInfo.name}</CardTitle>
                        <div className="mt-2">
                          <span className="text-3xl font-bold">
                            ${planInfo.priceMonthly}
                          </span>
                          {planInfo.priceMonthly > 0 && (
                            <span className="text-muted-foreground">/mo</span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2 text-sm">
                          {planInfo.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {isCurrent ? (
                          <Button variant="secondary" className="w-full" disabled>
                            Current Plan
                          </Button>
                        ) : plan === 'FREE' ? (
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={handleManageSubscription}
                            disabled={!hasSubscription || portalLoading}
                          >
                            {hasSubscription ? 'Downgrade via Portal' : 'Already on Free'}
                          </Button>
                        ) : (
                          <Button 
                            className="w-full"
                            variant={isDowngrade ? 'outline' : 'default'}
                            onClick={() => handleCheckout(plan as 'PRO' | 'ELITE')}
                            disabled={checkoutLoading !== null}
                          >
                            {checkoutLoading === plan ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : isDowngrade ? (
                              'Downgrade'
                            ) : (
                              <>
                                <ArrowUpRight className="h-4 w-4 mr-2" />
                                {isUpgrade ? 'Upgrade' : 'Subscribe'}
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Billing Info */}
            <Card className="stat-card">
              <CardHeader>
                <CardTitle className="text-lg">Billing Information</CardTitle>
                <CardDescription>
                  Secure payments powered by Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Cancel anytime
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Instant access after payment
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Secure checkout with Stripe
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Invoices available in portal
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Billing;
