-- Seed initial subscription plans data
-- This migration inserts the default FREE, PRO, and ELITE plans

INSERT INTO public.subscription_plans (
  plan_type,
  name,
  description,
  price_monthly,
  currency,
  limits,
  features,
  display_order,
  is_popular,
  is_active,
  is_visible,
  icon_name,
  color,
  bg_color,
  trial_days
) VALUES
-- FREE Plan
(
  'FREE',
  'Free',
  '15-day free trial, then upgrade required',
  0.00,
  'USD',
  '{
    "maxStrategies": 1,
    "historyDays": 7,
    "csvExport": false,
    "publicPages": false,
    "integrations": 0,
    "rateLimitPerSec": 1,
    "rateLimitPerDay": 2000
  }'::jsonb,
  '["1 Strategy", "7-day signal history", "Webhook integration", "Email support"]'::jsonb,
  0,
  false,
  true,
  true,
  'Zap',
  'text-slate-500',
  'bg-slate-500/10',
  15
),
-- PRO Plan
(
  'PRO',
  'Pro',
  'For active traders',
  7.00,
  'USD',
  '{
    "maxStrategies": 10,
    "historyDays": 90,
    "csvExport": true,
    "publicPages": true,
    "integrations": 5,
    "rateLimitPerSec": 5,
    "rateLimitPerDay": 50000
  }'::jsonb,
  '["10 Strategies", "90-day signal history", "CSV export", "Public strategy pages", "5 Integrations", "5 API Keys", "Priority support"]'::jsonb,
  1,
  true,
  true,
  true,
  'Crown',
  'text-blue-500',
  'bg-blue-500/10',
  0
),
-- ELITE Plan
(
  'ELITE',
  'Elite',
  'For professional traders',
  18.00,
  'USD',
  '{
    "maxStrategies": -1,
    "historyDays": -1,
    "csvExport": true,
    "publicPages": true,
    "integrations": -1,
    "rateLimitPerSec": 20,
    "rateLimitPerDay": 200000
  }'::jsonb,
  '["Unlimited strategies", "Unlimited signal history", "Unlimited integrations", "Unlimited API Keys", "Full API access", "Dedicated support"]'::jsonb,
  2,
  false,
  true,
  true,
  'Sparkles',
  'text-amber-500',
  'bg-amber-500/10',
  0
)
ON CONFLICT (plan_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  limits = EXCLUDED.limits,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order,
  is_popular = EXCLUDED.is_popular,
  icon_name = EXCLUDED.icon_name,
  color = EXCLUDED.color,
  bg_color = EXCLUDED.bg_color,
  trial_days = EXCLUDED.trial_days,
  updated_at = now();

-- Note: stripe_price_id and stripe_product_id should be updated via admin panel
-- or environment variables after Stripe products are created
