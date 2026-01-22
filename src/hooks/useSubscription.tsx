import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type PlanType = Database['public']['Enums']['plan_type'];

interface SubscriptionState {
  plan: PlanType;
  subscribed: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  error: string | null;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    plan: 'FREE',
    subscribed: false,
    subscriptionEnd: null,
    loading: true,
    error: null,
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Fetch plan directly from database as primary source
  const fetchPlanFromDatabase = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at, stripe_subscription_id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const plan = (profile?.plan as PlanType) || 'FREE';
      const subscribed = plan !== 'FREE' && !!profile?.stripe_subscription_id;

      setState({
        plan,
        subscribed,
        subscriptionEnd: profile?.plan_expires_at || null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching plan from database:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: 'Failed to load subscription status'
      }));
    }
  }, [user]);

  // Check subscription via edge function (syncs with Stripe)
  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        // Fall back to database
        await fetchPlanFromDatabase();
        return;
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        // Fall back to database
        await fetchPlanFromDatabase();
        return;
      }

      setState({
        plan: data.plan || 'FREE',
        subscribed: data.subscribed || false,
        subscriptionEnd: data.subscription_end || null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Fall back to database
      await fetchPlanFromDatabase();
    }
  }, [session?.access_token, fetchPlanFromDatabase]);

  // Initial load - fetch from database first for faster UX
  useEffect(() => {
    if (user && session) {
      fetchPlanFromDatabase();
    } else {
      setState({
        plan: 'FREE',
        subscribed: false,
        subscriptionEnd: null,
        loading: false,
        error: null,
      });
    }
  }, [user, session, fetchPlanFromDatabase]);

  // Create checkout session
  const createCheckout = async (priceId: string) => {
    // Ensure we have a valid session
    let currentSession = session;
    if (!currentSession?.access_token) {
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession?.access_token) {
        toast.error('Session expired. Please sign in again.');
        return;
      }
      currentSession = freshSession;
    }

    setCheckoutLoading(true);

    try {
      console.log('Creating checkout with priceId:', priceId);
      
      // Use fetch directly to have more control over the request
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const responseData = await response.json();

      console.log('Checkout response:', { status: response.status, data: responseData });

      if (!response.ok) {
        // Extract error message from response
        const errorMessage = responseData?.error || responseData?.message || `Server returned ${response.status}`;
        throw new Error(errorMessage);
      }

      if (responseData?.error) {
        throw new Error(responseData.error);
      }

      if (responseData?.url) {
        // Redirect in same window for better UX
        window.location.href = responseData.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error.message || 'Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Open customer portal
  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      toast.error('Please sign in to manage subscription');
      return;
    }

    setPortalLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Portal access failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error(error.message || 'Failed to open subscription management. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  return {
    ...state,
    checkoutLoading,
    portalLoading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    refetch: fetchPlanFromDatabase,
  };
};
