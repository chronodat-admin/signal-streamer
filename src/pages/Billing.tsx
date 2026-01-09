import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { CreditCard, Calendar, ArrowUpRight, Settings, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type PlanType = Database['public']['Enums']['plan_type'];

interface Profile {
  plan: PlanType;
  plan_expires_at: string | null;
  stripe_customer_id: string | null;
}

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
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at, stripe_customer_id')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

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

  const currentPlan = profile?.plan || 'FREE';
  const details = planDetails[currentPlan];
  const hasActiveSubscription = currentPlan !== 'FREE' && profile?.stripe_customer_id;

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
                    <li key={feature}>• {feature}</li>
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
                <Link to="/pricing">
                  <Button className="w-full mt-4" variant="outline">
                    {currentPlan === 'FREE' ? 'Upgrade Plan' : 'Change Plan'}
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Subscription Management */}
            <Card className="stat-card">
              <CardHeader>
                <CardTitle className="text-lg">Subscription Management</CardTitle>
                <CardDescription>Manage your payment and subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasActiveSubscription ? (
                  <>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="p-2 rounded-md bg-background">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Active Subscription</p>
                        <p className="text-xs text-muted-foreground">
                          Managed via Stripe
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Opening Portal...
                        </>
                      ) : (
                        <>
                          <Settings className="mr-2 h-4 w-4" />
                          Manage Subscription
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Update payment method, view invoices, or cancel
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
                          Upgrade to Pro or Elite to unlock features
                        </p>
                      </div>
                    </div>
                    <Link to="/pricing">
                      <Button variant="default" className="w-full">
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        View Plans & Upgrade
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card className="stat-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Billing History</CardTitle>
                <CardDescription>View your past invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>No billing history yet</p>
                  <p className="text-sm mt-1">
                    Your invoices will appear here once you upgrade
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Billing;
