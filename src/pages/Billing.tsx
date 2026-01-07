import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { CreditCard, Calendar, ArrowUpRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PlanType = Database['public']['Enums']['plan_type'];

interface Profile {
  plan: PlanType;
  plan_expires_at: string | null;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const currentPlan = profile?.plan || 'FREE';
  const details = planDetails[currentPlan];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and payment methods
          </p>
        </div>

        {loading ? (
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

            {/* Payment Method */}
            <Card className="stat-card">
              <CardHeader>
                <CardTitle className="text-lg">Payment Method</CardTitle>
                <CardDescription>Manage your payment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="p-2 rounded-md bg-background">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">No payment method</p>
                    <p className="text-xs text-muted-foreground">
                      Add a payment method to upgrade
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" disabled>
                  Add Payment Method
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Payment processing coming soon
                </p>
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
