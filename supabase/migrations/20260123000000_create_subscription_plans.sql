-- Create subscription_plans table for database-driven pricing
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan identification
  plan_type plan_type NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10, 2),
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_price_id TEXT, -- Stripe Price ID for this plan
  stripe_product_id TEXT, -- Stripe Product ID
  
  -- Plan limits (stored as JSONB for flexibility)
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example limits structure:
  -- {
  --   "maxStrategies": 1,
  --   "historyDays": 7,
  --   "csvExport": false,
  --   "publicPages": false,
  --   "integrations": 0,
  --   "rateLimitPerSec": 1,
  --   "rateLimitPerDay": 2000
  -- }
  
  -- Features list (for display)
  features JSONB DEFAULT '[]'::jsonb,
  -- Example: ["10 Strategies", "90-day signal history", "CSV export", "Public strategy pages"]
  
  -- Display settings
  display_order INTEGER NOT NULL DEFAULT 0,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  
  -- UI customization
  icon_name TEXT, -- e.g., "Zap", "Crown", "Sparkles"
  color TEXT, -- e.g., "text-slate-500", "text-blue-500"
  bg_color TEXT, -- e.g., "bg-slate-500/10", "bg-blue-500/10"
  
  -- Metadata
  trial_days INTEGER DEFAULT 0, -- 0 for no trial, 15 for 15-day trial
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for active plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active, display_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscription_plans_visible ON public.subscription_plans(is_visible, display_order) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_subscription_plans_type ON public.subscription_plans(plan_type);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read active, visible plans
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true AND is_visible = true);

-- RLS Policy: Only service role can modify plans (for admin operations)
CREATE POLICY "Service role can manage subscription plans"
  ON public.subscription_plans
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to get plan by type
CREATE OR REPLACE FUNCTION public.get_subscription_plan(p_plan_type plan_type)
RETURNS TABLE (
  id UUID,
  plan_type plan_type,
  name TEXT,
  description TEXT,
  price_monthly NUMERIC,
  price_yearly NUMERIC,
  currency TEXT,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  limits JSONB,
  features JSONB,
  display_order INTEGER,
  is_popular BOOLEAN,
  is_active BOOLEAN,
  is_visible BOOLEAN,
  icon_name TEXT,
  color TEXT,
  bg_color TEXT,
  trial_days INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.plan_type,
    sp.name,
    sp.description,
    sp.price_monthly,
    sp.price_yearly,
    sp.currency,
    sp.stripe_price_id,
    sp.stripe_product_id,
    sp.limits,
    sp.features,
    sp.display_order,
    sp.is_popular,
    sp.is_active,
    sp.is_visible,
    sp.icon_name,
    sp.color,
    sp.bg_color,
    sp.trial_days,
    sp.created_at,
    sp.updated_at
  FROM public.subscription_plans sp
  WHERE sp.plan_type = p_plan_type
    AND sp.is_active = true
    AND sp.is_visible = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get all active plans ordered by display_order
CREATE OR REPLACE FUNCTION public.get_all_subscription_plans()
RETURNS TABLE (
  id UUID,
  plan_type plan_type,
  name TEXT,
  description TEXT,
  price_monthly NUMERIC,
  price_yearly NUMERIC,
  currency TEXT,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  limits JSONB,
  features JSONB,
  display_order INTEGER,
  is_popular BOOLEAN,
  is_active BOOLEAN,
  is_visible BOOLEAN,
  icon_name TEXT,
  color TEXT,
  bg_color TEXT,
  trial_days INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.plan_type,
    sp.name,
    sp.description,
    sp.price_monthly,
    sp.price_yearly,
    sp.currency,
    sp.stripe_price_id,
    sp.stripe_product_id,
    sp.limits,
    sp.features,
    sp.display_order,
    sp.is_popular,
    sp.is_active,
    sp.is_visible,
    sp.icon_name,
    sp.color,
    sp.bg_color,
    sp.trial_days,
    sp.created_at,
    sp.updated_at
  FROM public.subscription_plans sp
  WHERE sp.is_active = true
    AND sp.is_visible = true
  ORDER BY sp.display_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add comment
COMMENT ON TABLE public.subscription_plans IS 'Database-driven subscription plans with pricing, limits, and features';
COMMENT ON FUNCTION public.get_subscription_plan(plan_type) IS 'Get a single subscription plan by type';
COMMENT ON FUNCTION public.get_all_subscription_plans() IS 'Get all active, visible subscription plans ordered by display_order';
