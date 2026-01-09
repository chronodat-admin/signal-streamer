-- Create a function to update user plan that bypasses RLS
-- This ensures webhooks can always update plans even if RLS policies change

CREATE OR REPLACE FUNCTION public.update_user_plan(
  p_user_id uuid,
  p_plan plan_type,
  p_stripe_subscription_id text DEFAULT NULL,
  p_plan_expires_at timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    plan = p_plan,
    stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
    plan_expires_at = COALESCE(p_plan_expires_at, plan_expires_at),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permission to service_role (used by webhooks)
GRANT EXECUTE ON FUNCTION public.update_user_plan(uuid, plan_type, text, timestamptz) TO service_role;

-- Also create a function to update plan by Stripe customer ID
CREATE OR REPLACE FUNCTION public.update_user_plan_by_customer(
  p_stripe_customer_id text,
  p_plan plan_type,
  p_stripe_subscription_id text DEFAULT NULL,
  p_plan_expires_at timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    plan = p_plan,
    stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
    plan_expires_at = COALESCE(p_plan_expires_at, plan_expires_at),
    updated_at = now()
  WHERE stripe_customer_id = p_stripe_customer_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.update_user_plan_by_customer(text, plan_type, text, timestamptz) TO service_role;



