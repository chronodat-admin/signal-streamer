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
  ArrowDownRight,
  Loader2, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Crown,
  Sparkles,
  Zap,
  Check
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { STRIPE_PLANS } from '@/lib/stripe';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/i18n';

type PlanType = Database['public']['Enums']['plan_type'];

// Plan hierarchy for comparison
const PLAN_HIERARCHY: Record<PlanType, number> = {
  FREE: 0,
  PRO: 1,
  ELITE: 2,
};

const planDetails: Record<PlanType, { 
  name: string; 
  price: string; 
  priceAmount: number;
  features: string[];
  icon: typeof Zap;
  color: string;
  bgColor: string;
}> = {
  FREE: {
    name: 'Free',
    price: '$0/forever',
    priceAmount: 0,
    features: ['1 Strategy', '7-day signal history', 'Email support'],
    icon: Zap,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
  },
  PRO: {
    name: 'Pro',
    price: '$19/month',
    priceAmount: 19,
    features: ['10 Strategies', '90-day signal history', 'CSV export', 'Public pages'],
    icon: Crown,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  ELITE: {
    name: 'Elite',
    price: '$49/month',
    priceAmount: 49,
    features: ['Unlimited strategies', 'Unlimited history', 'API access', 'Dedicated support'],
    icon: Sparkles,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
};

// All available plans in order
const ALL_PLANS: PlanType[] = ['FREE', 'PRO', 'ELITE'];

const Billing = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [processingSuccess, setProcessingSuccess] = useState(false);
  const { t } = useLanguage();
  
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
      toast.success(t.billing.paymentSuccessful);
      
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
            toast.success(t.billing.subscriptionActivated);
          } else {
            setTimeout(pollForUpdate, 2000);
          }
        }, 1000);
      };
      
        setTimeout(pollForUpdate, 2000);
    } else if (canceled === 'true') {
      toast.info(t.billing.checkoutCanceled);
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
          <p className="text-muted-foreground">{t.billing.pleaseSignIn}</p>
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
            <h1 className="text-3xl font-bold">{t.billing.title}</h1>
            <p className="text-muted-foreground mt-1">
              {t.billing.subtitle}
            </p>
          </div>
            <Button 
              variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t.billing.refreshStatus}
            </Button>
        </div>

        {/* Processing Alert */}
        {processingSuccess && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>{t.billing.processingSubscription}</AlertTitle>
            <AlertDescription>
              {t.billing.subscriptionActivating}
                </AlertDescription>
              </Alert>
            )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t.billing.error}</AlertTitle>
                <AlertDescription>
              {error}. <Button variant="link" className="p-0 h-auto" onClick={handleRefresh}>{t.billing.tryAgain}</Button>
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
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${details.bgColor}`}>
                      {(() => {
                        const PlanIcon = details.icon;
                        return <PlanIcon className={`h-5 w-5 ${details.color}`} />;
                      })()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t.billing.currentPlan}</CardTitle>
                      <CardDescription>{t.billing.yourActiveSubscription}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={plan === 'FREE' ? 'secondary' : 'default'} className="text-sm px-3 py-1">
                    {details.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">{details.price}</div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {details.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${details.color}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                {subscriptionEnd && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t.billing.renewsOn.replace('{date}', new Date(subscriptionEnd).toLocaleDateString())}
                    </span>
                  </div>
                )}
                <Link to="/pricing">
                  <Button className="w-full mt-4" variant="outline">
                    {plan === 'FREE' ? t.billing.viewAllPlans : t.billing.comparePlans}
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Subscription Management */}
              <Card className="stat-card">
                <CardHeader>
                <CardTitle className="text-lg">{t.billing.subscriptionManagement}</CardTitle>
                <CardDescription>
                  {subscribed 
                    ? t.billing.manageSubscriptionDescription
                    : t.billing.upgradeDescription
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
                        <p className="text-sm font-medium">{t.billing.activeSubscription}</p>
                          <p className="text-xs text-muted-foreground">
                          {t.billing.activeSubscriptionDescription.replace('{plan}', details.name)}
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
                          {t.billing.manageSubscription}
                        </Button>
                      <p className="text-xs text-center text-muted-foreground">
                      {t.billing.updatePaymentMethod}
                      </p>
                    </>
                  ) : (
                    <>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="p-2 rounded-md bg-background">
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                        <p className="text-sm font-medium">{t.billing.noActiveSubscription}</p>
                          <p className="text-xs text-muted-foreground">
                          {t.billing.noActiveSubscriptionDescription}
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
                          {t.billing.upgradeToPro}
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
                        {t.billing.upgradeToElite}
                      </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

            {/* All Plans - Upgrade/Downgrade Options */}
            <Card className="stat-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">{t.billing.changeYourPlan}</CardTitle>
                <CardDescription>
                  {plan === 'ELITE' 
                    ? t.billing.bestPlanDescription
                    : plan === 'PRO'
                    ? t.billing.upgradeDowngradeDescription
                    : t.billing.choosePlanDescription
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {ALL_PLANS.map((planKey) => {
                    const planInfo = planDetails[planKey];
                    const PlanIcon = planInfo.icon;
                    const isCurrent = planKey === plan;
                    const isUpgrade = PLAN_HIERARCHY[planKey] > PLAN_HIERARCHY[plan];
                    const isDowngrade = PLAN_HIERARCHY[planKey] < PLAN_HIERARCHY[plan];

                    return (
                      <div 
                        key={planKey}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isCurrent 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {/* Plan Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${planInfo.bgColor}`}>
                              <PlanIcon className={`h-4 w-4 ${planInfo.color}`} />
                            </div>
                            <h3 className="font-semibold">{planInfo.name}</h3>
                          </div>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">{t.billing.current}</Badge>
                          )}
                          {!isCurrent && isUpgrade && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                              {t.billing.upgrade}
                            </Badge>
                          )}
                          {!isCurrent && isDowngrade && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                              {t.billing.downgrade}
                            </Badge>
                          )}
                        </div>

                        {/* Price */}
                        <p className="text-2xl font-bold mb-3">
                          ${planInfo.priceAmount}
                          <span className="text-sm font-normal text-muted-foreground">
                            {planKey === 'FREE' ? t.billing.perForever : t.billing.perMonth}
                          </span>
                        </p>

                        {/* Features */}
                        <ul className="space-y-1.5 mb-4 text-sm">
                          {planInfo.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                              <Check className={`h-3.5 w-3.5 ${planInfo.color}`} />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        {/* Action Button */}
                        {isCurrent ? (
                          <Button variant="secondary" className="w-full" disabled>
                            <Check className="h-4 w-4 mr-2" />
                            {t.billing.currentPlanButton}
                          </Button>
                        ) : isUpgrade ? (
                          <Button 
                            className="w-full"
                            onClick={() => handleUpgrade(planKey as keyof typeof STRIPE_PLANS)}
                            disabled={checkoutLoading || planKey === 'FREE'}
                          >
                            {checkoutLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 mr-2" />
                            )}
                            {t.billing.upgradeTo.replace('{plan}', planInfo.name)}
                          </Button>
                        ) : isDowngrade ? (
                          planKey === 'FREE' ? (
                            <Button 
                              variant="outline"
                              className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={openCustomerPortal}
                              disabled={portalLoading}
                            >
                              {portalLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 mr-2" />
                              )}
                              {t.billing.cancelSubscription}
                            </Button>
                          ) : (
                            <Button 
                              variant="outline"
                              className="w-full"
                              onClick={openCustomerPortal}
                              disabled={portalLoading}
                            >
                              {portalLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 mr-2" />
                              )}
                              {t.billing.downgradeTo.replace('{plan}', planInfo.name)}
                            </Button>
                          )
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* Downgrade Notice */}
                {plan !== 'FREE' && (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    {t.billing.downgradeNotice}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card className="stat-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">{t.billing.billingHistory}</CardTitle>
                <CardDescription>{t.billing.viewInvoicesDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                {subscribed ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">
                      {t.billing.viewInvoicesDescription2}
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
                      {t.billing.viewInvoices}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t.billing.noBillingHistory}</p>
                    <p className="text-sm mt-1">
                      {t.billing.noBillingHistoryDescription}
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
