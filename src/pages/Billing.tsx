import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  Loader2, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { STRIPE_PLANS } from '@/lib/stripe';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type PlanType = Database['public']['Enums']['plan_type'];

const planDetails: Record<PlanType, { name: string; price: string; features: string[] }> = {
  FREE: {
    name: 'Free',
    price: '$0/forever',
    features: ['1 Strategy', '7-day signal history', 'Email support'],
  },
  PRO: {
    name: 'Pro',
    price: '$19/month',
    features: ['10 Strategies', '90-day signal history', 'CSV export', 'Public pages'],
  },
  ELITE: {
    name: 'Elite',
    price: '$49/month',
    features: ['Unlimited strategies', 'Unlimited history', 'API access', 'Dedicated support'],
  },
};

const Billing = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [processingSuccess, setProcessingSuccess] = useState(false);
  
  const { 
    plan, 
    subscribed, 
    subscriptionEnd, 
    loading,
    error,
    checkoutLoading,
    portalLoading,
    checkSubscription, 
    createCheckout,
    openCustomerPortal,
    refetch,
  } = useSubscription();

  // Handle success/cancel redirects from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setProcessingSuccess(true);
      toast.success('Payment successful! Activating your subscription...');
      
      // Clean URL
      setSearchParams({});
      
      // Poll for subscription update
      let attempts = 0;
      const maxAttempts = 10;
      
      const pollForUpdate = async () => {
        attempts++;
        await checkSubscription();
        
        // After polling, refresh from database
        setTimeout(() => {
          refetch();
          if (attempts >= maxAttempts) {
            setProcessingSuccess(false);
            toast.success('Subscription activated! Enjoy your new plan.');
          } else {
            setTimeout(pollForUpdate, 2000);
          }
        }, 1000);
      };
      
      setTimeout(pollForUpdate, 2000);
    } else if (canceled === 'true') {
      toast.info('Checkout was canceled. No charges were made.');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, checkSubscription, refetch]);

  const details = planDetails[plan];

  const handleUpgrade = async (planKey: keyof typeof STRIPE_PLANS) => {
    const stripePlan = STRIPE_PLANS[planKey];
    console.log('Upgrading to:', planKey, 'priceId:', stripePlan.priceId);
    await createCheckout(stripePlan.priceId);
  };

  const handleRefresh = async () => {
    await checkSubscription();
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Please sign in to view billing.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Billing</h1>
            <p className="text-muted-foreground mt-1">
              Manage your subscription and payment methods
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>

        {/* Processing Alert */}
        {processingSuccess && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Processing your subscription...</AlertTitle>
            <AlertDescription>
              Please wait while we activate your subscription. This may take a few moments.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}. <Button variant="link" className="p-0 h-auto" onClick={handleRefresh}>Try again</Button>
            </AlertDescription>
          </Alert>
        )}

        {loading && !processingSuccess ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Current Plan */}
            <Card className="stat-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Current Plan</CardTitle>
                  <Badge variant={plan === 'FREE' ? 'secondary' : 'default'}>
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
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {subscriptionEnd && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Renews on {new Date(subscriptionEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <Link to="/pricing">
                  <Button className="w-full mt-4" variant="outline">
                    {plan === 'FREE' ? 'View Plans' : 'Compare Plans'}
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Subscription Management */}
            <Card className="stat-card">
              <CardHeader>
                <CardTitle className="text-lg">Subscription Management</CardTitle>
                <CardDescription>
                  {subscribed 
                    ? 'Manage your subscription, update payment method, or cancel'
                    : 'Upgrade to a paid plan to unlock more features'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscribed ? (
                  <>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="p-2 rounded-md bg-green-500/20">
                        <CreditCard className="h-6 w-6 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Active Subscription</p>
                        <p className="text-xs text-muted-foreground">
                          {details.name} plan via Stripe
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={openCustomerPortal}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Manage Subscription
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Update payment method, change plan, or cancel subscription
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="p-2 rounded-md bg-background">
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">No active subscription</p>
                        <p className="text-xs text-muted-foreground">
                          You're on the free plan
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Button 
                        className="w-full"
                        onClick={() => handleUpgrade('PRO')}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Upgrade to Pro - $19/mo
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => handleUpgrade('ELITE')}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Upgrade to Elite - $49/mo
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Upgrade Options (only show for non-elite users) */}
            {plan !== 'ELITE' && (
              <Card className="stat-card lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Upgrade Your Plan</CardTitle>
                  <CardDescription>Get more features with a paid plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {plan === 'FREE' && (
                      <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">Pro Plan</h3>
                          <Badge>Popular</Badge>
                        </div>
                        <p className="text-2xl font-bold mb-2">$19<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                        <p className="text-sm text-muted-foreground mb-4">10 strategies, 90-day history, CSV export</p>
                        <Button 
                          className="w-full"
                          onClick={() => handleUpgrade('PRO')}
                          disabled={checkoutLoading}
                        >
                          {checkoutLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          Upgrade to Pro
                        </Button>
                      </div>
                    )}
                    <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Elite Plan</h3>
                        <Badge variant="secondary">Best Value</Badge>
                      </div>
                      <p className="text-2xl font-bold mb-2">$49<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                      <p className="text-sm text-muted-foreground mb-4">Unlimited everything + API access</p>
                      <Button 
                        variant={plan === 'PRO' ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => handleUpgrade('ELITE')}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {plan === 'PRO' ? 'Upgrade to Elite' : 'Go Elite'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing History */}
            <Card className="stat-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Billing History</CardTitle>
                <CardDescription>View your past invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                {subscribed ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">
                      View and download your invoices from the Stripe Customer Portal
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={openCustomerPortal}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      View Invoices
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No billing history yet</p>
                    <p className="text-sm mt-1">
                      Your invoices will appear here once you upgrade
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Billing;
