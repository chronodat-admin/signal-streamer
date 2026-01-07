-- Create alert_logs table to track alert sending attempts
CREATE TABLE IF NOT EXISTS public.alert_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES public.signals(id) ON DELETE SET NULL,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE SET NULL,
  integration_type TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'error', 'pending'
  message TEXT,
  error_message TEXT,
  webhook_url TEXT,
  response_status INTEGER,
  response_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for alert_logs
CREATE INDEX IF NOT EXISTS idx_alert_logs_user_id ON public.alert_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_logs_strategy_id ON public.alert_logs(strategy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_logs_integration_id ON public.alert_logs(integration_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_logs_status ON public.alert_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_logs_created_at ON public.alert_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own alert logs" ON public.alert_logs;
CREATE POLICY "Users can view their own alert logs"
  ON public.alert_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert/update logs (bypasses RLS when using service key)
-- No explicit policy needed as service role bypasses RLS

-- Function to clean up old logs (optional, for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_alert_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.alert_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.cleanup_old_alert_logs(INTEGER) TO authenticated;

