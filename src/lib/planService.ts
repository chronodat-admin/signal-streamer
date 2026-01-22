import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PlanType = Database['public']['Enums']['plan_type'];

export interface PlanLimits {
  maxStrategies: number;
  historyDays: number;
  csvExport: boolean;
  publicPages: boolean;
  integrations: number;
  rateLimitPerSec: number;
  rateLimitPerDay: number;
}

export interface SubscriptionPlan {
  id: string;
  plan_type: PlanType;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  limits: PlanLimits;
  features: string[];
  display_order: number;
  is_popular: boolean;
  is_active: boolean;
  is_visible: boolean;
  icon_name: string | null;
  color: string | null;
  bg_color: string | null;
  trial_days: number;
  created_at: string;
  updated_at: string;
}

// Cache for plans (in-memory cache, refreshes every 5 minutes)
let plansCache: Map<PlanType, SubscriptionPlan> | null = null;
let allPlansCache: SubscriptionPlan[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get a single plan by type (with caching)
export const getPlan = async (planType: PlanType): Promise<SubscriptionPlan | null> => {
  // Check cache first
  const now = Date.now();
  if (plansCache && (now - cacheTimestamp) < CACHE_DURATION) {
    const cached = plansCache.get(planType);
    if (cached) return cached;
  }

  // Fetch from database
  const { data, error } = await supabase
    .rpc('get_subscription_plan', { p_plan_type: planType });

  if (error || !data || data.length === 0) {
    console.error('Error fetching plan:', error);
    // Fallback to default limits if database fails
    return getDefaultPlan(planType);
  }

  const plan = mapPlanFromDB(data[0]);
  
  // Update cache
  if (!plansCache) plansCache = new Map();
  plansCache.set(planType, plan);
  cacheTimestamp = now;

  return plan;
};

// Get all active plans (with caching)
export const getAllPlans = async (): Promise<SubscriptionPlan[]> => {
  // Check cache first
  const now = Date.now();
  if (allPlansCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return allPlansCache;
  }

  // Fetch from database
  const { data, error } = await supabase
    .rpc('get_all_subscription_plans');

  if (error || !data) {
    console.error('Error fetching plans:', error);
    // Fallback to default plans
    return getDefaultPlans();
  }

  const plans = data.map(mapPlanFromDB);
  
  // Update cache
  allPlansCache = plans;
  plansCache = new Map(plans.map(p => [p.plan_type, p]));
  cacheTimestamp = now;

  return plans;
};

// Get plan limits from database
export const getPlanLimits = async (planType: PlanType): Promise<PlanLimits> => {
  const plan = await getPlan(planType);
  if (!plan) {
    return getDefaultLimits(planType);
  }
  return plan.limits;
};

// Helper to map database result to SubscriptionPlan
function mapPlanFromDB(dbPlan: any): SubscriptionPlan {
  return {
    id: dbPlan.id,
    plan_type: dbPlan.plan_type,
    name: dbPlan.name,
    description: dbPlan.description,
    price_monthly: Number(dbPlan.price_monthly),
    price_yearly: dbPlan.price_yearly ? Number(dbPlan.price_yearly) : null,
    currency: dbPlan.currency,
    stripe_price_id: dbPlan.stripe_price_id,
    stripe_product_id: dbPlan.stripe_product_id,
    limits: dbPlan.limits as PlanLimits,
    features: (dbPlan.features || []) as string[],
    display_order: dbPlan.display_order,
    is_popular: dbPlan.is_popular,
    is_active: dbPlan.is_active,
    is_visible: dbPlan.is_visible,
    icon_name: dbPlan.icon_name,
    color: dbPlan.color,
    bg_color: dbPlan.bg_color,
    trial_days: dbPlan.trial_days,
    created_at: dbPlan.created_at,
    updated_at: dbPlan.updated_at,
  };
}

// Fallback: Default plans if database fails
function getDefaultPlans(): SubscriptionPlan[] {
  return [
    getDefaultPlan('FREE')!,
    getDefaultPlan('PRO')!,
    getDefaultPlan('ELITE')!,
  ];
}

function getDefaultPlan(planType: PlanType): SubscriptionPlan | null {
  const defaults: Record<PlanType, Partial<SubscriptionPlan>> = {
    FREE: {
      plan_type: 'FREE',
      name: 'Free',
      description: '15-day free trial, then upgrade required',
      price_monthly: 0,
      limits: {
        maxStrategies: 1,
        historyDays: 7,
        csvExport: false,
        publicPages: false,
        integrations: 0,
        rateLimitPerSec: 1,
        rateLimitPerDay: 2000,
      },
      features: ['1 Strategy', '7-day signal history', 'Webhook integration', 'Email support'],
      icon_name: 'Zap',
      color: 'text-slate-500',
      bg_color: 'bg-slate-500/10',
      trial_days: 15,
    },
    PRO: {
      plan_type: 'PRO',
      name: 'Pro',
      description: 'For active traders',
      price_monthly: 7,
      limits: {
        maxStrategies: 10,
        historyDays: 90,
        csvExport: true,
        publicPages: true,
        integrations: 5,
        rateLimitPerSec: 5,
        rateLimitPerDay: 50000,
      },
      features: ['10 Strategies', '90-day signal history', 'CSV export', 'Public strategy pages', '5 Integrations', 'Priority support'],
      icon_name: 'Crown',
      color: 'text-blue-500',
      bg_color: 'bg-blue-500/10',
      trial_days: 0,
    },
    ELITE: {
      plan_type: 'ELITE',
      name: 'Elite',
      description: 'For professional traders',
      price_monthly: 18,
      limits: {
        maxStrategies: -1,
        historyDays: -1,
        csvExport: true,
        publicPages: true,
        integrations: -1,
        rateLimitPerSec: 20,
        rateLimitPerDay: 200000,
      },
      features: ['Unlimited strategies', 'Unlimited signal history', 'Unlimited integrations', 'Full API access', 'Dedicated support'],
      icon_name: 'Sparkles',
      color: 'text-amber-500',
      bg_color: 'bg-amber-500/10',
      trial_days: 0,
    },
  };

  const defaultPlan = defaults[planType];
  if (!defaultPlan) return null;

  return {
    id: '',
    plan_type: planType,
    name: defaultPlan.name || planType,
    description: defaultPlan.description || null,
    price_monthly: defaultPlan.price_monthly || 0,
    price_yearly: null,
    currency: 'USD',
    stripe_price_id: null,
    stripe_product_id: null,
    limits: defaultPlan.limits || getDefaultLimits(planType),
    features: defaultPlan.features || [],
    display_order: planType === 'FREE' ? 0 : planType === 'PRO' ? 1 : 2,
    is_popular: planType === 'PRO',
    is_active: true,
    is_visible: true,
    icon_name: defaultPlan.icon_name || null,
    color: defaultPlan.color || null,
    bg_color: defaultPlan.bg_color || null,
    trial_days: defaultPlan.trial_days || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function getDefaultLimits(planType: PlanType): PlanLimits {
  const plan = getDefaultPlan(planType);
  return plan?.limits || {
    maxStrategies: 1,
    historyDays: 7,
    csvExport: false,
    publicPages: false,
    integrations: 0,
    rateLimitPerSec: 1,
    rateLimitPerDay: 2000,
  };
}

// Clear cache (useful for admin updates)
export const clearPlanCache = () => {
  plansCache = null;
  allPlansCache = null;
  cacheTimestamp = 0;
};
