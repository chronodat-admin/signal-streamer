-- Create error_logs table to track application errors
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL, -- 'api', 'edge_function', 'frontend', 'webhook', 'database'
  severity TEXT NOT NULL DEFAULT 'error', -- 'error', 'warning', 'critical'
  source TEXT, -- e.g., 'tradingview-webhook', 'signal-api', 'billing'
  message TEXT NOT NULL,
  error_message TEXT,
  stack_trace TEXT,
  request_url TEXT,
  request_method TEXT,
  request_headers JSONB,
  request_body JSONB,
  response_status INTEGER,
  response_body TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs(error_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON public.error_logs(source, created_at DESC);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own error logs
DROP POLICY IF EXISTS "Users can view their own error logs" ON public.error_logs;
CREATE POLICY "Users can view their own error logs"
  ON public.error_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all error logs
DROP POLICY IF EXISTS "Admins can view all error logs" ON public.error_logs;
CREATE POLICY "Admins can view all error logs"
  ON public.error_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete error logs
DROP POLICY IF EXISTS "Admins can delete error logs" ON public.error_logs;
CREATE POLICY "Admins can delete error logs"
  ON public.error_logs FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert logs (bypasses RLS when using service key)
-- No explicit policy needed as service role bypasses RLS

-- Function to log errors (for use in edge functions and API routes)
CREATE OR REPLACE FUNCTION public.log_error(
  p_user_id UUID DEFAULT NULL,
  p_error_type TEXT DEFAULT 'api',
  p_severity TEXT DEFAULT 'error',
  p_source TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_stack_trace TEXT DEFAULT NULL,
  p_request_url TEXT DEFAULT NULL,
  p_request_method TEXT DEFAULT NULL,
  p_request_headers JSONB DEFAULT NULL,
  p_request_body JSONB DEFAULT NULL,
  p_response_status INTEGER DEFAULT NULL,
  p_response_body TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.error_logs (
    user_id,
    error_type,
    severity,
    source,
    message,
    error_message,
    stack_trace,
    request_url,
    request_method,
    request_headers,
    request_body,
    response_status,
    response_body,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_error_type,
    p_severity,
    p_source,
    p_message,
    p_error_message,
    p_stack_trace,
    p_request_url,
    p_request_method,
    p_request_headers,
    p_request_body,
    p_response_status,
    p_response_body,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_error TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_error TO anon;
GRANT EXECUTE ON FUNCTION public.log_error TO service_role;

-- Function to clean up old error logs (optional, for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.error_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.cleanup_old_error_logs(INTEGER) TO authenticated;
