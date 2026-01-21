-- Add DELETE policy for alert_logs so users can delete their own logs
DROP POLICY IF EXISTS "Users can delete their own alert logs" ON public.alert_logs;
CREATE POLICY "Users can delete their own alert logs"
  ON public.alert_logs FOR DELETE
  USING (auth.uid() = user_id);
