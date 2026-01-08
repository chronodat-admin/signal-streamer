-- Update soft_delete_strategy function to also delete alert_logs, signals, trades, and stats
-- This ensures all related data is cleaned up when a strategy is deleted

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
  
  -- Delete all alert logs for this strategy
  DELETE FROM public.alert_logs
  WHERE strategy_id = p_strategy_id;
  
  -- Delete all trades (open and closed) for this strategy
  DELETE FROM public.trades
  WHERE strategy_id = p_strategy_id;
  
  -- Delete all signals for this strategy
  DELETE FROM public.signals
  WHERE strategy_id = p_strategy_id;
  
  -- Delete strategy stats
  DELETE FROM public.strategy_stats
  WHERE strategy_id = p_strategy_id;
  
  -- Delete daily trade stats
  DELETE FROM public.trade_stats_daily
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

