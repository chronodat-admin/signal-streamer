-- Fix RLS policy to allow updating strategies even when is_deleted changes
-- The UPDATE policy should work, but let's ensure it's correct

-- Drop and recreate the UPDATE policy to ensure it works correctly
DROP POLICY IF EXISTS "Users can update their own strategies" ON public.strategies;

CREATE POLICY "Users can update their own strategies"
  ON public.strategies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also create a function to safely delete strategies (bypasses RLS issues)
CREATE OR REPLACE FUNCTION public.soft_delete_strategy(p_strategy_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the strategy owner
  SELECT user_id INTO v_user_id
  FROM public.strategies
  WHERE id = p_strategy_id;
  
  -- Verify the user owns this strategy
  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- Delete all signals for this strategy
  DELETE FROM public.signals
  WHERE strategy_id = p_strategy_id;
  
  -- Soft delete the strategy
  UPDATE public.strategies
  SET is_deleted = true
  WHERE id = p_strategy_id;
  
  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.soft_delete_strategy(uuid) TO authenticated;



