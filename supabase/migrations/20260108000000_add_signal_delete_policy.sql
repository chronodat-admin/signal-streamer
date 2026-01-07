-- Add DELETE policy for signals so users can delete their own signals
CREATE POLICY "Users can delete their own signals"
  ON public.signals FOR DELETE
  USING (auth.uid() = user_id);

-- Function to delete all signals for a strategy (called when strategy is soft-deleted)
CREATE OR REPLACE FUNCTION public.delete_strategy_signals(p_strategy_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all signals for this strategy
  DELETE FROM public.signals
  WHERE strategy_id = p_strategy_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_strategy_signals(uuid) TO authenticated;



