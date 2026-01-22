import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { getPlanLimits as getPlanLimitsFromDB, type PlanLimits } from './planService';

type PlanType = Database['public']['Enums']['plan_type'];

// Re-export PlanLimits type
export type { PlanLimits } from './planService';

// Legacy synchronous function for backward compatibility
// Now uses database with fallback
export const getPlanLimits = async (plan: PlanType): Promise<PlanLimits> => {
  return await getPlanLimitsFromDB(plan);
};

// Synchronous fallback for cases where async isn't possible
export const getPlanLimitsSync = (plan: PlanType): PlanLimits => {
  switch (plan) {
    case 'FREE':
      return {
        maxStrategies: 1,
        historyDays: 7,
        csvExport: false,
        publicPages: false,
        integrations: 0,
        rateLimitPerSec: 1,
        rateLimitPerDay: 2000,
      };
    case 'PRO':
      return {
        maxStrategies: 10,
        historyDays: 90,
        csvExport: true,
        publicPages: true,
        integrations: 5,
        rateLimitPerSec: 5,
        rateLimitPerDay: 50000,
      };
    case 'ELITE':
      return {
        maxStrategies: -1, // unlimited
        historyDays: -1, // unlimited
        csvExport: true,
        publicPages: true,
        integrations: -1, // unlimited
        rateLimitPerSec: 20,
        rateLimitPerDay: 200000,
      };
    default:
      return getPlanLimitsSync('FREE');
  }
};

export const getUserPlan = async (userId: string): Promise<PlanType> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('plan')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return 'FREE';
  }

  return data.plan;
};

export const canCreateStrategy = async (userId: string, currentCount: number): Promise<{ allowed: boolean; reason?: string }> => {
  const plan = await getUserPlan(userId);
  const limits = await getPlanLimits(plan);

  if (limits.maxStrategies === -1) {
    return { allowed: true };
  }

  if (currentCount >= limits.maxStrategies) {
    return {
      allowed: false,
      reason: `${plan} plan allows only ${limits.maxStrategies} strategy${limits.maxStrategies > 1 ? 'ies' : ''}. Upgrade to ${plan === 'FREE' ? 'Pro' : 'Elite'} for more.`,
    };
  }

  return { allowed: true };
};

export const getHistoryDateLimit = async (plan: PlanType): Promise<Date | null> => {
  const limits = await getPlanLimits(plan);
  if (limits.historyDays === -1) {
    return null; // unlimited
  }
  const date = new Date();
  date.setDate(date.getDate() - limits.historyDays);
  return date;
};

// Synchronous version for backward compatibility
export const getHistoryDateLimitSync = (plan: PlanType): Date | null => {
  const limits = getPlanLimitsSync(plan);
  if (limits.historyDays === -1) {
    return null; // unlimited
  }
  const date = new Date();
  date.setDate(date.getDate() - limits.historyDays);
  return date;
};

// Trial expiration helpers
export interface TrialStatus {
  isExpired: boolean;
  daysRemaining: number | null;
  trialEndDate: Date | null;
}

export const getTrialStatus = async (userId: string): Promise<TrialStatus> => {
  // Get user profile to check plan and created_at
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan, created_at')
    .eq('user_id', userId)
    .single();

  if (error || !profile || profile.plan !== 'FREE') {
    return {
      isExpired: false,
      daysRemaining: null,
      trialEndDate: null,
    };
  }

  // Calculate trial end date (15 days from account creation)
  const createdDate = new Date(profile.created_at);
  const trialEndDate = new Date(createdDate);
  trialEndDate.setDate(trialEndDate.getDate() + 15);

  const now = new Date();
  const isExpired = now > trialEndDate;
  
  // Calculate days remaining
  const diffTime = trialEndDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    isExpired,
    daysRemaining: isExpired ? 0 : daysRemaining,
    trialEndDate,
  };
};

export const isTrialExpired = async (userId: string): Promise<boolean> => {
  const status = await getTrialStatus(userId);
  return status.isExpired;
};

