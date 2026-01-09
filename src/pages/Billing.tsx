import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'react-router-dom';
import { 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  Settings, 
  Loader2, 
  Check, 
  X, 
  Zap,
  Crown,
  Sparkles,
  Shield,
  Clock,
  AlertTriangle,
  TrendingUp,
  Layers,
  Download,
  Globe,
  Key,
  Infinity,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Receipt,
  History
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getPlanLimits } from '@/lib/planUtils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type PlanType = Database['public']['Enums']['plan_type'];

interface Profile {
  plan: PlanType;
  plan_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

interface UsageStats {
  strategiesCount: number;
  integrationsCount: number;
  signalsToday: number;
}

const planDetails: Record<PlanType, { 
  name: string; 
  price: string;
  monthlyPrice: number;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  features: { name: string; included: boolean; highlight?: boolean }[];
}> = {
  FREE: {
    name: 'Free',
    price: '$0',
    monthlyPrice: 0,
    description: 'Perfect for getting started',
    icon: Zap,
    color: 'text-muted-foreground',
    gradient: 'from-slate-500/20 to-slate-600/20',
    features: [
      { name: '1 Strategy', included: true },
      { name: '7-day signal history', included: true },
      { name: 'Webhook integration', included: true },
      { name: 'Email support', included: true },
      { name: 'CSV export', included: false },
      { name: 'Public strategy pages', included: false },
      { name: 'API access', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  PRO: {
    name: 'Pro',
    price: '$19',
    monthlyPrice: 19,
    description: 'For active traders',
    icon: Crown,
    color: 'text-primary',
    gradient: 'from-primary/20 to-primary/10',
    features: [
      { name: '10 Strategies', included: true, highlight: true },
      { name: '90-day signal history', included: true, highlight: true },
      { name: 'Webhook integration', included: true },
      { name: 'Priority support', included: true },
      { name: 'CSV export', included: true, highlight: true },
      { name: 'Public strategy pages', included: true, highlight: true },
      { name: 'API access', included: false },
      { name: 'Dedicated support', included: false },
    ],
  },
  ELITE: {
    name: 'Elite',
    price: '$49',
    monthlyPrice: 49,
    description: 'For professional traders',
    icon: Sparkles,
    color: 'text-amber-500',
    gradient: 'from-amber-500/20 to-orange-500/20',
    features: [
      { name: 'Unlimited strategies', included: true, highlight: true },
      { name: 'Unlimited signal history', included: true, highlight: true },
      { name: 'Webhook integration', included: true },
      { name: 'Dedicated support', included: true, highlight: true },
      { name: 'CSV export', included: true },
      { name: 'Public strategy pages', included: true },
      { name: 'Full API access', included: true, highlight: true },
      { name: 'Custom integrations', included: true, highlight: true },
    ],
  },
};

const planOrder: PlanType[] = ['FREE', 'PRO', 'ELITE'];

const Billing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<'PRO' | 'ELITE' | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    strategiesCount: 0,
    integrationsCount: 0,
    signalsToday: 0,
  });

  // Handle success/canceled query params from Stripe checkout
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast({
        title: '🎉 Payment Successful!',
        description: 'Processing your subscription... This may take a moment.',
        duration: 6000,
      });
      // Clean up URL
      setSearchParams({});
      
      // Poll for profile update (webhook might take a moment)
      if (user) {
        let attempts = 0;
        const maxAttempts = 10;
        
        const pollForUpdate = async () => {
          attempts++;
          const { data } = await supabase
            .from('profiles')
            .select('plan')
            .eq('user_id', user.id)
            .single();
          
          if (data?.plan && data.plan !== 'FREE') {
            // Plan updated!
            toast({
              title: '🎉 Subscription Activated!',
              description: `You're now on the ${data.plan} plan! Enjoy your upgraded features.`,
              duration: 6000,
            });
            fetchProfile();
          } else if (attempts < maxAttempts) {
            // Keep polling
            setTimeout(pollForUpdate, 2000);
          } else {
            // Webhook might not be configured - show manual refresh option
            toast({
              title: 'Almost there!',
              description: 'Your payment was successful. If your plan hasn\'t updated, please refresh the page in a minute.',
              duration: 8000,
            });
            fetchProfile();
          }
        };
        
        // Start polling after a short delay
        setTimeout(pollForUpdate, 2000);
      }
    } else if (canceled === 'true') {
      toast({
        title: 'Checkout Canceled',
        description: 'Your subscription remains unchanged. Feel free to upgrade anytime.',
        variant: 'destructive',
        duration: 5000,
      });
      // Clean up URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast, user]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at, stripe_customer_id, stripe_subscription_id')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch usage stats
      const { count: strategiesCount } = await supabase
        .from('strategies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      const { count: integrationsCount } = await supabase
        .from('integrations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('status', 'deleted');

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { count: signalsToday } = await supabase
        .from('signals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString());

      setUsageStats({
        strategiesCount: strategiesCount || 0,
        integrationsCount: integrationsCount || 0,
        signalsToday: signalsToday || 0,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleManageSubscription = async () => {
    if (!profile?.stripe_customer_id) {
      toast({
        title: 'No Subscription',
        description: 'You don\'t have an active subscription to manage.',
        variant: 'destructive',
      });
      return;
    }

    setPortalLoading(true);

    try {
      const response = await supabase.functions.invoke('create-portal', {
        body: {},
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create portal session');
      }

      const { url, error: dataError } = response.data;
      
      if (dataError) {
        throw new Error(dataError);
      }
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to open subscription management.',
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCheckout = async (plan: 'PRO' | 'ELITE') => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to upgrade your plan.',
        variant: 'destructive',
      });
      return;
    }

    setCheckoutLoading(plan);

    try {
      console.log('Starting checkout for plan:', plan);
      
      // Use fetch directly to get more control over the response
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://ogcnilkuneeqkhmoamxi.supabase.co'}/functions/v1/create-checkout`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();
      console.log('Checkout response:', response.status, data);

      if (!response.ok) {
        // Show the actual error from the edge function
        const errorMessage = data?.error || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const { url, error: dataError } = data;
      
      if (dataError) {
        throw new Error(dataError);
      }
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned. Please ensure Stripe is properly configured.');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Error',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const currentPlan = profile?.plan || 'FREE';
  const details = planDetails[currentPlan];
  const limits = getPlanLimits(currentPlan);
  const hasActiveSubscription = currentPlan !== 'FREE' && profile?.stripe_customer_id;
  const PlanIcon = details.icon;

  // Calculate usage percentages
  const strategiesUsage = limits.maxStrategies === -1 
    ? 0 
    : Math.min((usageStats.strategiesCount / limits.maxStrategies) * 100, 100);
  const strategiesNearLimit = limits.maxStrategies !== -1 && usageStats.strategiesCount >= limits.maxStrategies * 0.8;
  const strategiesAtLimit = limits.maxStrategies !== -1 && usageStats.strategiesCount >= limits.maxStrategies;

  // Check if subscription is expiring soon (within 7 days)
  const isExpiringSoon = profile?.plan_expires_at 
    ? new Date(profile.plan_expires_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  // Get next plan for upgrade
  const currentPlanIndex = planOrder.indexOf(currentPlan);
  const nextPlan = currentPlanIndex < planOrder.length - 1 ? planOrder[currentPlanIndex + 1] : null;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Billing</h1>
            <p className="text-muted-foreground mt-1">
              Manage your subscription, usage, and payment methods
            </p>
          </div>
          {hasActiveSubscription && (
            <Button 
              variant="outline" 
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="gap-2"
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Manage in Stripe
            </Button>
          )}
        </div>

        {loading ? (
          <BillingSkeleton />
        ) : (
          <>
            {/* Alerts */}
            {strategiesAtLimit && nextPlan && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-600 dark:text-amber-400">Strategy Limit Reached</AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span>You've reached your strategy limit. Upgrade to {planDetails[nextPlan].name} to create more strategies.</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1 border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                    onClick={() => handleCheckout(nextPlan as 'PRO' | 'ELITE')}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === nextPlan ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ArrowUpRight className="h-3 w-3" />
                    )}
                    Upgrade Now
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {isExpiringSoon && hasActiveSubscription && (
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Clock className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-600 dark:text-blue-400">Subscription Renewing Soon</AlertTitle>
                <AlertDescription>
                  Your subscription renews on {new Date(profile!.plan_expires_at!).toLocaleDateString()}. 
                  Ensure your payment method is up to date.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Current Plan Card */}
              <Card className={`stat-card lg:col-span-2 relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${details.gradient} opacity-50`} />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${details.gradient} flex items-center justify-center shadow-lg`}>
                        <PlanIcon className={`h-6 w-6 ${details.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          {details.name} Plan
                          {currentPlan !== 'FREE' && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              Active
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">{details.description}</CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold tracking-tight">{details.price}</div>
                      <div className="text-sm text-muted-foreground">
                        {currentPlan === 'FREE' ? 'forever' : '/month'}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  {/* Usage Stats */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Layers className="h-4 w-4" />
                          Strategies
                        </span>
                        <span className={`font-medium ${strategiesAtLimit ? 'text-amber-500' : ''}`}>
                          {usageStats.strategiesCount}
                          {limits.maxStrategies !== -1 && ` / ${limits.maxStrategies}`}
                          {limits.maxStrategies === -1 && (
                            <Infinity className="inline h-4 w-4 ml-1 text-muted-foreground" />
                          )}
                        </span>
                      </div>
                      {limits.maxStrategies !== -1 && (
                        <Progress 
                          value={strategiesUsage} 
                          className={`h-2 ${strategiesNearLimit ? '[&>div]:bg-amber-500' : ''}`}
                        />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <History className="h-4 w-4" />
                          Signal History
                        </span>
                        <span className="font-medium">
                          {limits.historyDays === -1 ? (
                            <span className="flex items-center gap-1">
                              Unlimited <Infinity className="h-4 w-4 text-muted-foreground" />
                            </span>
                          ) : (
                            `${limits.historyDays} days`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Feature Overview */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <QuickFeature 
                      icon={Download} 
                      label="CSV Export" 
                      enabled={limits.csvExport} 
                    />
                    <QuickFeature 
                      icon={Globe} 
                      label="Public Pages" 
                      enabled={limits.publicPages} 
                    />
                    <QuickFeature 
                      icon={Key} 
                      label="API Access" 
                      enabled={currentPlan === 'ELITE'} 
                    />
                    <QuickFeature 
                      icon={Shield} 
                      label="Priority Support" 
                      enabled={currentPlan !== 'FREE'} 
                    />
                  </div>

                  {/* Renewal Info */}
                  {profile?.plan_expires_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(profile.plan_expires_at) > new Date() ? 'Renews' : 'Expired'} on{' '}
                        <span className="font-medium text-foreground">
                          {new Date(profile.plan_expires_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {currentPlan === 'FREE' ? (
                      <div className="flex flex-1 gap-2">
                        <Button 
                          className="flex-1 gap-2 shadow-md hover:shadow-lg transition-all"
                          onClick={() => handleCheckout('PRO')}
                          disabled={checkoutLoading !== null}
                        >
                          {checkoutLoading === 'PRO' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Crown className="h-4 w-4" />
                          )}
                          Upgrade to Pro
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => handleCheckout('ELITE')}
                          disabled={checkoutLoading !== null}
                        >
                          {checkoutLoading === 'ELITE' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Upgrade to Elite
                        </Button>
                      </div>
                    ) : nextPlan ? (
                      <>
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-2"
                          onClick={() => handleCheckout(nextPlan as 'PRO' | 'ELITE')}
                          disabled={checkoutLoading !== null}
                        >
                          {checkoutLoading === nextPlan ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TrendingUp className="h-4 w-4" />
                          )}
                          Upgrade to {planDetails[nextPlan].name}
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="gap-2"
                          onClick={handleManageSubscription}
                          disabled={portalLoading}
                        >
                          {portalLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Settings className="h-4 w-4" />
                          )}
                          Manage
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={handleManageSubscription}
                        disabled={portalLoading}
                      >
                        {portalLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Settings className="h-4 w-4" />
                        )}
                        Manage Subscription
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Management Card */}
              <Card className="stat-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    Payment
                  </CardTitle>
                  <CardDescription>Manage billing & invoices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasActiveSubscription ? (
                    <>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Subscription Active</p>
                          <p className="text-xs text-muted-foreground">
                            Managed via Stripe
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start gap-2"
                          onClick={handleManageSubscription}
                          disabled={portalLoading}
                        >
                          {portalLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Settings className="h-4 w-4" />
                          )}
                          Manage Subscription
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start gap-2 text-muted-foreground"
                          onClick={handleManageSubscription}
                          disabled={portalLoading}
                        >
                          <Receipt className="h-4 w-4" />
                          View Invoices
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start gap-2 text-muted-foreground"
                          onClick={handleManageSubscription}
                          disabled={portalLoading}
                        >
                          <CreditCard className="h-4 w-4" />
                          Update Payment Method
                        </Button>
                      </div>

                      <Separator />

                      <p className="text-xs text-center text-muted-foreground">
                        Cancel anytime from the Stripe portal. Your access continues until the billing period ends.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">No Active Subscription</p>
                          <p className="text-xs text-muted-foreground">
                            Upgrade to unlock premium features
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Upgrade to Pro</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-muted-foreground mb-3">
                          <li className="flex items-center gap-1.5">
                            <Check className="h-3 w-3 text-primary" />
                            10 strategies
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="h-3 w-3 text-primary" />
                            90-day signal history
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="h-3 w-3 text-primary" />
                            CSV export & public pages
                          </li>
                        </ul>
                        <Button 
                          size="sm" 
                          className="w-full gap-1"
                          onClick={() => handleCheckout('PRO')}
                          disabled={checkoutLoading !== null}
                        >
                          {checkoutLoading === 'PRO' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          Upgrade to Pro - $19/mo
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Plan Comparison */}
            <Card className="stat-card">
              <CardHeader>
                <CardTitle className="text-lg">Compare Plans</CardTitle>
                <CardDescription>See what's included in each plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {planOrder.map((plan) => {
                    const planInfo = planDetails[plan];
                    const isCurrentPlan = plan === currentPlan;
                    const PIcon = planInfo.icon;
                    
                    return (
                      <div 
                        key={plan}
                        className={`relative p-5 rounded-xl border-2 transition-all ${
                          isCurrentPlan 
                            ? 'border-primary bg-primary/5 shadow-md' 
                            : 'border-border hover:border-primary/30 hover:shadow-sm'
                        }`}
                      >
                        {isCurrentPlan && (
                          <div className="absolute -top-3 left-4">
                            <Badge className="bg-primary text-primary-foreground text-xs">
                              Current Plan
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${planInfo.gradient} flex items-center justify-center`}>
                            <PIcon className={`h-5 w-5 ${planInfo.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{planInfo.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {planInfo.price}{plan !== 'FREE' && '/mo'}
                            </p>
                          </div>
                        </div>

                        <ul className="space-y-2 mb-4">
                          {planInfo.features.slice(0, 6).map((feature, i) => (
                            <li 
                              key={i}
                              className={`flex items-center gap-2 text-sm ${
                                feature.included 
                                  ? feature.highlight 
                                    ? 'text-foreground font-medium' 
                                    : 'text-muted-foreground'
                                  : 'text-muted-foreground/50'
                              }`}
                            >
                              {feature.included ? (
                                <Check className={`h-4 w-4 flex-shrink-0 ${
                                  feature.highlight ? 'text-primary' : 'text-muted-foreground'
                                }`} />
                              ) : (
                                <X className="h-4 w-4 flex-shrink-0" />
                              )}
                              {feature.name}
                            </li>
                          ))}
                        </ul>

                        {!isCurrentPlan && planOrder.indexOf(plan) > currentPlanIndex && (
                          <Button 
                            variant="default"
                            size="sm"
                            className="w-full gap-1"
                            onClick={() => handleCheckout(plan as 'PRO' | 'ELITE')}
                            disabled={checkoutLoading !== null}
                          >
                            {checkoutLoading === plan ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3" />
                            )}
                            Upgrade to {planInfo.name}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Usage Details */}
            <Card className="stat-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  Usage This Period
                </CardTitle>
                <CardDescription>Your current usage statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <UsageStat 
                    label="Strategies"
                    value={usageStats.strategiesCount}
                    limit={limits.maxStrategies}
                    icon={Layers}
                    warning={strategiesNearLimit}
                  />
                  <UsageStat 
                    label="Integrations"
                    value={usageStats.integrationsCount}
                    limit={limits.integrations}
                    icon={Zap}
                  />
                  <UsageStat 
                    label="Signals Today"
                    value={usageStats.signalsToday}
                    limit={limits.rateLimitPerDay}
                    icon={TrendingUp}
                  />
                  <UsageStat 
                    label="History Retention"
                    value={limits.historyDays === -1 ? 'Unlimited' : `${limits.historyDays} days`}
                    icon={History}
                  />
                </div>
              </CardContent>
            </Card>

            {/* FAQ / Help */}
            <Card className="stat-card">
              <CardHeader>
                <CardTitle className="text-lg">Billing FAQ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FaqItem 
                    question="How do I cancel my subscription?"
                    answer="Click 'Manage Subscription' to access the Stripe portal where you can cancel anytime. Your access continues until the end of your billing period."
                  />
                  <FaqItem 
                    question="What happens to my data if I downgrade?"
                    answer="Your signals and strategies are preserved, but you'll only be able to access data within your new plan's limits."
                  />
                  <FaqItem 
                    question="Can I change plans mid-cycle?"
                    answer="Yes! Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing period."
                  />
                  <FaqItem 
                    question="What payment methods are accepted?"
                    answer="We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment processor."
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

// Helper Components
const QuickFeature = ({ icon: Icon, label, enabled }: { icon: React.ElementType; label: string; enabled: boolean }) => (
  <div className={`flex items-center gap-2 text-sm ${enabled ? 'text-foreground' : 'text-muted-foreground/50'}`}>
    {enabled ? (
      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
    ) : (
      <XCircle className="h-4 w-4 flex-shrink-0" />
    )}
    <span>{label}</span>
  </div>
);

const UsageStat = ({ 
  label, 
  value, 
  limit, 
  icon: Icon,
  warning 
}: { 
  label: string; 
  value: number | string; 
  limit?: number; 
  icon: React.ElementType;
  warning?: boolean;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" />
      {label}
    </div>
    <div className={`text-2xl font-semibold ${warning ? 'text-amber-500' : ''}`}>
      {typeof value === 'number' ? value.toLocaleString() : value}
      {limit !== undefined && limit !== -1 && (
        <span className="text-sm font-normal text-muted-foreground">
          {' '}/ {limit === -1 ? '∞' : limit.toLocaleString()}
        </span>
      )}
    </div>
    {limit !== undefined && limit !== -1 && typeof value === 'number' && (
      <Progress 
        value={Math.min((value / limit) * 100, 100)} 
        className={`h-1.5 ${warning ? '[&>div]:bg-amber-500' : ''}`}
      />
    )}
  </div>
);

const FaqItem = ({ question, answer }: { question: string; answer: string }) => (
  <div className="p-4 rounded-lg bg-muted/30 border border-border">
    <h4 className="font-medium text-sm mb-1">{question}</h4>
    <p className="text-sm text-muted-foreground">{answer}</p>
  </div>
);

const BillingSkeleton = () => (
  <div className="grid gap-6 lg:grid-cols-3">
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24 mt-1" />
            </div>
          </div>
          <Skeleton className="h-10 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Separator />
        <div className="grid gap-3 sm:grid-cols-4">
          <Skeleton className="h-6" />
          <Skeleton className="h-6" />
          <Skeleton className="h-6" />
          <Skeleton className="h-6" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-32 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </CardContent>
    </Card>
  </div>
);

export default Billing;
