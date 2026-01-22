-- Add trial expiration logic for FREE plan users
-- FREE plan users get 15 days from account creation

-- Function to check if a FREE plan user's trial has expired
CREATE OR REPLACE FUNCTION public.is_trial_expired(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan plan_type;
  user_created_at TIMESTAMPTZ;
  trial_end_date TIMESTAMPTZ;
BEGIN
  -- Get user's plan and creation date
  SELECT plan, created_at INTO user_plan, user_created_at
  FROM public.profiles
  WHERE user_id = user_id_param;
  
  -- Only FREE plan users have trials
  IF user_plan != 'FREE' THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate trial end date (15 days from account creation)
  trial_end_date := user_created_at + INTERVAL '15 days';
  
  -- Check if current time is past trial end date
  RETURN NOW() > trial_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get trial end date for FREE plan users
CREATE OR REPLACE FUNCTION public.get_trial_end_date(user_id_param UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  user_plan plan_type;
  user_created_at TIMESTAMPTZ;
BEGIN
  -- Get user's plan and creation date
  SELECT plan, created_at INTO user_plan, user_created_at
  FROM public.profiles
  WHERE user_id = user_id_param;
  
  -- Only FREE plan users have trials
  IF user_plan != 'FREE' THEN
    RETURN NULL;
  END IF;
  
  -- Return trial end date (15 days from account creation)
  RETURN user_created_at + INTERVAL '15 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add comment
COMMENT ON FUNCTION public.is_trial_expired(UUID) IS 'Returns true if FREE plan user trial has expired (15 days from account creation)';
COMMENT ON FUNCTION public.get_trial_end_date(UUID) IS 'Returns trial end date for FREE plan users, NULL for paid plans';
