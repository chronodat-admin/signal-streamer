// Stripe product and price mapping
// Now database-driven with fallback to environment variables
import { getPlan, type SubscriptionPlan } from './planService';
import type { Database } from '@/integrations/supabase/types';

type PlanType = Database['public']['Enums']['plan_type'];

// Legacy constant for backward compatibility
// This will be populated from database on first use
export const STRIPE_PLANS = {
  PRO: {
    name: 'Pro',
    price: '$7/month',
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_1SnTupCRSet8VgXEYX1JuFu5',
    productId: import.meta.env.VITE_STRIPE_PRO_PRODUCT_ID || 'prod_Tkzuk0NeshkOAM',
  },
  ELITE: {
    name: 'Elite',
    price: '$18/month',
    priceId: import.meta.env.VITE_STRIPE_ELITE_PRICE_ID || 'price_1SnTvDCRSet8VgXEURGSOqcw',
    productId: import.meta.env.VITE_STRIPE_ELITE_PRODUCT_ID || 'prod_TkzvPzWPAd8jYf',
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;

// Get Stripe plan info from database
export const getStripePlan = async (planType: 'PRO' | 'ELITE'): Promise<{
  name: string;
  price: string;
  priceId: string;
  productId: string;
}> => {
  try {
    const plan = await getPlan(planType);
    if (plan && plan.stripe_price_id && plan.stripe_product_id) {
      return {
        name: plan.name,
        price: `$${plan.price_monthly}/month`,
        priceId: plan.stripe_price_id,
        productId: plan.stripe_product_id,
      };
    }
  } catch (error) {
    console.error('Error fetching plan from database:', error);
  }

  // Fallback to environment variables or defaults
  return STRIPE_PLANS[planType];
};

// Get all Stripe plans (for checkout)
export const getStripePlans = async (): Promise<Record<'PRO' | 'ELITE', {
  name: string;
  price: string;
  priceId: string;
  productId: string;
}>> => {
  const [proPlan, elitePlan] = await Promise.all([
    getStripePlan('PRO'),
    getStripePlan('ELITE'),
  ]);

  return {
    PRO: proPlan,
    ELITE: elitePlan,
  };
};
