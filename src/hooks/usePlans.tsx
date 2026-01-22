import { useState, useEffect } from 'react';
import { getAllPlans, getPlan, type SubscriptionPlan } from '@/lib/planService';
import type { Database } from '@/integrations/supabase/types';

type PlanType = Database['public']['Enums']['plan_type'];

export const usePlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const allPlans = await getAllPlans();
        setPlans(allPlans);
        setError(null);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch plans'));
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return { plans, loading, error };
};

export const usePlan = (planType: PlanType) => {
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const planData = await getPlan(planType);
        setPlan(planData);
        setError(null);
      } catch (err) {
        console.error('Error fetching plan:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch plan'));
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planType]);

  return { plan, loading, error };
};
