-- Fix RLS for rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limits are managed server-side only, no direct client access
CREATE POLICY "No direct client access to rate_limits"
ON public.rate_limits FOR SELECT
USING (false);

-- Fix RLS for webhook_queue table  
ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;

-- Webhook queue is managed server-side only
CREATE POLICY "No direct client access to webhook_queue"
ON public.webhook_queue FOR SELECT
USING (false);