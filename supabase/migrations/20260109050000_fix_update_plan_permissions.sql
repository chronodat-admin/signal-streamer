-- Fix permissions for update_user_plan functions
-- Grant execute to authenticated role so sync-subscription edge function works reliably

-- Grant execute permission to authenticated role (in addition to service_role)
-- This ensures the functions can be called from edge functions using service_role
-- and also allows for future direct calls if needed
GRANT EXECUTE ON FUNCTION public.update_user_plan(uuid, plan_type, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_plan_by_customer(text, plan_type, text, timestamptz) TO authenticated;

-- Also ensure anon can call for edge function scenarios
GRANT EXECUTE ON FUNCTION public.update_user_plan(uuid, plan_type, text, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_plan_by_customer(text, plan_type, text, timestamptz) TO anon;





