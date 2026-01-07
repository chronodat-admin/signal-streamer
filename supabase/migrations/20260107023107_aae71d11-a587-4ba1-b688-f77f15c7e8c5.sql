-- =====================================================
-- PHASE 1: Core Schema Enhancements
-- =====================================================

-- Add stripe_customer_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Create app_role enum for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- PHASE 2: Usage Counters & Rate Limiting
-- =====================================================

-- Usage counters table
CREATE TABLE public.usage_counters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    strategy_id uuid REFERENCES public.strategies(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    signals_received integer NOT NULL DEFAULT 0,
    invalid_requests integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, strategy_id, date)
);

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
ON public.usage_counters FOR SELECT
USING (auth.uid() = user_id);

-- Rate limit tracking table
CREATE TABLE public.rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id uuid REFERENCES public.strategies(id) ON DELETE CASCADE NOT NULL,
    window_start timestamptz NOT NULL DEFAULT now(),
    request_count integer NOT NULL DEFAULT 1,
    is_blocked boolean NOT NULL DEFAULT false,
    blocked_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_strategy_window ON public.rate_limits(strategy_id, window_start DESC);

-- =====================================================
-- PHASE 3: Audit Events
-- =====================================================

CREATE TYPE public.audit_event_type AS ENUM (
    'LOGIN',
    'LOGOUT', 
    'STRATEGY_CREATED',
    'STRATEGY_UPDATED',
    'STRATEGY_DELETED',
    'TOKEN_ROTATED',
    'PLAN_CHANGED',
    'WEBHOOK_RECEIVED',
    'WEBHOOK_FAILED',
    'SUBSCRIPTION_CREATED',
    'SUBSCRIPTION_CANCELLED',
    'PAYMENT_SUCCEEDED',
    'PAYMENT_FAILED'
);

CREATE TABLE public.audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    event_type audit_event_type NOT NULL,
    metadata jsonb DEFAULT '{}',
    ip_address text,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit events"
ON public.audit_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit events"
ON public.audit_events FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_audit_events_user_time ON public.audit_events(user_id, created_at DESC);
CREATE INDEX idx_audit_events_type ON public.audit_events(event_type, created_at DESC);

-- =====================================================
-- PHASE 4: Webhook Queue & Failures
-- =====================================================

CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'dead');

CREATE TABLE public.webhook_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id uuid NOT NULL,
    payload jsonb NOT NULL,
    status job_status NOT NULL DEFAULT 'pending',
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 3,
    last_error text,
    scheduled_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_queue_status ON public.webhook_queue(status, scheduled_at) WHERE status IN ('pending', 'failed');
CREATE INDEX idx_webhook_queue_strategy ON public.webhook_queue(strategy_id, created_at DESC);

CREATE TABLE public.webhook_failures (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id uuid REFERENCES public.strategies(id) ON DELETE SET NULL,
    user_id uuid,
    payload jsonb,
    error_message text NOT NULL,
    error_code text,
    ip_address text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhook failures"
ON public.webhook_failures FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX idx_webhook_failures_user ON public.webhook_failures(user_id, created_at DESC);
CREATE INDEX idx_webhook_failures_strategy ON public.webhook_failures(strategy_id, created_at DESC);

-- =====================================================
-- PHASE 5: Trade Pairing & Analytics
-- =====================================================

CREATE TYPE public.trade_status AS ENUM ('open', 'closed', 'cancelled');
CREATE TYPE public.trade_direction AS ENUM ('long', 'short');

CREATE TABLE public.trades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    strategy_id uuid REFERENCES public.strategies(id) ON DELETE CASCADE NOT NULL,
    symbol text NOT NULL,
    direction trade_direction NOT NULL,
    status trade_status NOT NULL DEFAULT 'open',
    entry_signal_id uuid REFERENCES public.signals(id) ON DELETE SET NULL,
    exit_signal_id uuid REFERENCES public.signals(id) ON DELETE SET NULL,
    entry_price numeric NOT NULL,
    exit_price numeric,
    entry_time timestamptz NOT NULL,
    exit_time timestamptz,
    quantity numeric DEFAULT 1,
    pnl numeric,
    pnl_percent numeric,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades"
ON public.trades FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Public can view trades for public strategies"
ON public.trades FOR SELECT
USING (EXISTS (
    SELECT 1 FROM strategies s 
    WHERE s.id = trades.strategy_id 
    AND s.is_public = true 
    AND s.is_deleted = false
));

CREATE INDEX idx_trades_strategy ON public.trades(strategy_id, entry_time DESC);
CREATE INDEX idx_trades_user ON public.trades(user_id, entry_time DESC);
CREATE INDEX idx_trades_symbol ON public.trades(symbol, entry_time DESC);

-- Strategy stats (pre-aggregated)
CREATE TABLE public.strategy_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id uuid REFERENCES public.strategies(id) ON DELETE CASCADE NOT NULL UNIQUE,
    total_signals integer NOT NULL DEFAULT 0,
    total_trades integer NOT NULL DEFAULT 0,
    winning_trades integer NOT NULL DEFAULT 0,
    losing_trades integer NOT NULL DEFAULT 0,
    win_rate numeric,
    total_pnl numeric DEFAULT 0,
    avg_win numeric,
    avg_loss numeric,
    profit_factor numeric,
    max_drawdown numeric,
    last_signal_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.strategy_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own strategy stats"
ON public.strategy_stats FOR SELECT
USING (EXISTS (
    SELECT 1 FROM strategies s 
    WHERE s.id = strategy_stats.strategy_id 
    AND s.user_id = auth.uid()
));

CREATE POLICY "Public can view stats for public strategies"
ON public.strategy_stats FOR SELECT
USING (EXISTS (
    SELECT 1 FROM strategies s 
    WHERE s.id = strategy_stats.strategy_id 
    AND s.is_public = true 
    AND s.is_deleted = false
));

-- Daily stats for charting
CREATE TABLE public.trade_stats_daily (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id uuid REFERENCES public.strategies(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    signals_count integer NOT NULL DEFAULT 0,
    trades_count integer NOT NULL DEFAULT 0,
    winning_trades integer NOT NULL DEFAULT 0,
    pnl numeric DEFAULT 0,
    cumulative_pnl numeric DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (strategy_id, date)
);

ALTER TABLE public.trade_stats_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily stats"
ON public.trade_stats_daily FOR SELECT
USING (EXISTS (
    SELECT 1 FROM strategies s 
    WHERE s.id = trade_stats_daily.strategy_id 
    AND s.user_id = auth.uid()
));

CREATE POLICY "Public can view daily stats for public strategies"
ON public.trade_stats_daily FOR SELECT
USING (EXISTS (
    SELECT 1 FROM strategies s 
    WHERE s.id = trade_stats_daily.strategy_id 
    AND s.is_public = true 
    AND s.is_deleted = false
));

CREATE INDEX idx_trade_stats_daily_strategy ON public.trade_stats_daily(strategy_id, date DESC);

-- =====================================================
-- PHASE 6: Integrations & Notifications
-- =====================================================

CREATE TYPE public.integration_type AS ENUM ('telegram', 'discord', 'email', 'webhook');
CREATE TYPE public.integration_status AS ENUM ('active', 'paused', 'error', 'deleted');

CREATE TABLE public.integrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    strategy_id uuid REFERENCES public.strategies(id) ON DELETE CASCADE,
    type integration_type NOT NULL,
    name text NOT NULL,
    config jsonb NOT NULL DEFAULT '{}',
    status integration_status NOT NULL DEFAULT 'active',
    last_delivery_at timestamptz,
    error_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own integrations"
ON public.integrations FOR ALL
USING (auth.uid() = user_id);

CREATE INDEX idx_integrations_user ON public.integrations(user_id);
CREATE INDEX idx_integrations_strategy ON public.integrations(strategy_id) WHERE strategy_id IS NOT NULL;

CREATE TABLE public.integration_deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id uuid REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
    signal_id uuid REFERENCES public.signals(id) ON DELETE CASCADE NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    response_code integer,
    response_body text,
    error_message text,
    delivered_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deliveries"
ON public.integration_deliveries FOR SELECT
USING (EXISTS (
    SELECT 1 FROM integrations i 
    WHERE i.id = integration_deliveries.integration_id 
    AND i.user_id = auth.uid()
));

CREATE INDEX idx_integration_deliveries_integration ON public.integration_deliveries(integration_id, created_at DESC);

-- =====================================================
-- PHASE 7: Optimized Signal Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_signals_strategy_time ON public.signals(strategy_id, signal_time DESC);
CREATE INDEX IF NOT EXISTS idx_signals_user_time ON public.signals(user_id, signal_time DESC);
CREATE INDEX IF NOT EXISTS idx_signals_symbol_time ON public.signals(symbol, signal_time DESC);
CREATE INDEX IF NOT EXISTS idx_signals_alert_id ON public.signals(strategy_id, alert_id) WHERE alert_id IS NOT NULL;

-- Add processed_at to signals
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- =====================================================
-- PHASE 8: Helper Functions
-- =====================================================

-- Function to get plan limits
CREATE OR REPLACE FUNCTION public.get_plan_limits(plan_name plan_type)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE plan_name
    WHEN 'FREE' THEN
      RETURN jsonb_build_object(
        'max_strategies', 1,
        'history_days', 7,
        'rate_limit_per_sec', 1,
        'rate_limit_per_day', 2000,
        'csv_export', false,
        'public_pages', false,
        'integrations', 0
      );
    WHEN 'PRO' THEN
      RETURN jsonb_build_object(
        'max_strategies', 10,
        'history_days', 90,
        'rate_limit_per_sec', 5,
        'rate_limit_per_day', 50000,
        'csv_export', true,
        'public_pages', true,
        'integrations', 5
      );
    WHEN 'ELITE' THEN
      RETURN jsonb_build_object(
        'max_strategies', -1,
        'history_days', -1,
        'rate_limit_per_sec', 20,
        'rate_limit_per_day', 200000,
        'csv_export', true,
        'public_pages', true,
        'integrations', -1
      );
    ELSE
      RETURN jsonb_build_object(
        'max_strategies', 1,
        'history_days', 7,
        'rate_limit_per_sec', 1,
        'rate_limit_per_day', 2000,
        'csv_export', false,
        'public_pages', false,
        'integrations', 0
      );
  END CASE;
END;
$$;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION public.increment_usage_counter(
    p_user_id uuid,
    p_strategy_id uuid,
    p_signals integer DEFAULT 1,
    p_invalid integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_counters (user_id, strategy_id, date, signals_received, invalid_requests)
  VALUES (p_user_id, p_strategy_id, CURRENT_DATE, p_signals, p_invalid)
  ON CONFLICT (user_id, strategy_id, date)
  DO UPDATE SET 
    signals_received = usage_counters.signals_received + p_signals,
    invalid_requests = usage_counters.invalid_requests + p_invalid,
    updated_at = now();
END;
$$;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_strategy_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_plan plan_type;
  v_limits jsonb;
  v_count integer;
  v_daily_count integer;
BEGIN
  -- Get strategy owner and plan
  SELECT s.user_id INTO v_user_id
  FROM public.strategies s
  WHERE s.id = p_strategy_id;
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT p.plan INTO v_plan
  FROM public.profiles p
  WHERE p.user_id = v_user_id;
  
  v_limits := public.get_plan_limits(COALESCE(v_plan, 'FREE'));
  
  -- Check per-second rate (last 1 second)
  SELECT COUNT(*) INTO v_count
  FROM public.signals
  WHERE strategy_id = p_strategy_id
  AND created_at > now() - interval '1 second';
  
  IF v_count >= (v_limits->>'rate_limit_per_sec')::integer THEN
    RETURN false;
  END IF;
  
  -- Check daily limit
  SELECT COALESCE(signals_received, 0) INTO v_daily_count
  FROM public.usage_counters
  WHERE strategy_id = p_strategy_id
  AND date = CURRENT_DATE;
  
  IF v_daily_count >= (v_limits->>'rate_limit_per_day')::integer THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to update strategy stats
CREATE OR REPLACE FUNCTION public.update_strategy_stats(p_strategy_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_signals integer;
  v_total_trades integer;
  v_winning integer;
  v_losing integer;
  v_total_pnl numeric;
  v_avg_win numeric;
  v_avg_loss numeric;
  v_last_signal timestamptz;
BEGIN
  -- Count signals
  SELECT COUNT(*), MAX(signal_time) INTO v_total_signals, v_last_signal
  FROM public.signals
  WHERE strategy_id = p_strategy_id;
  
  -- Count trades
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE pnl > 0),
    COUNT(*) FILTER (WHERE pnl < 0),
    COALESCE(SUM(pnl), 0),
    AVG(pnl) FILTER (WHERE pnl > 0),
    AVG(pnl) FILTER (WHERE pnl < 0)
  INTO v_total_trades, v_winning, v_losing, v_total_pnl, v_avg_win, v_avg_loss
  FROM public.trades
  WHERE strategy_id = p_strategy_id AND status = 'closed';
  
  -- Upsert stats
  INSERT INTO public.strategy_stats (
    strategy_id, total_signals, total_trades, winning_trades, losing_trades,
    win_rate, total_pnl, avg_win, avg_loss, profit_factor, last_signal_at, updated_at
  )
  VALUES (
    p_strategy_id, v_total_signals, v_total_trades, v_winning, v_losing,
    CASE WHEN v_total_trades > 0 THEN (v_winning::numeric / v_total_trades * 100) ELSE 0 END,
    v_total_pnl, v_avg_win, ABS(v_avg_loss),
    CASE WHEN v_avg_loss IS NOT NULL AND v_avg_loss != 0 THEN ABS(v_avg_win / v_avg_loss) ELSE NULL END,
    v_last_signal, now()
  )
  ON CONFLICT (strategy_id)
  DO UPDATE SET
    total_signals = EXCLUDED.total_signals,
    total_trades = EXCLUDED.total_trades,
    winning_trades = EXCLUDED.winning_trades,
    losing_trades = EXCLUDED.losing_trades,
    win_rate = EXCLUDED.win_rate,
    total_pnl = EXCLUDED.total_pnl,
    avg_win = EXCLUDED.avg_win,
    avg_loss = EXCLUDED.avg_loss,
    profit_factor = EXCLUDED.profit_factor,
    last_signal_at = EXCLUDED.last_signal_at,
    updated_at = now();
END;
$$;

-- Trigger to update stats on new signal
CREATE OR REPLACE FUNCTION public.handle_new_signal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.update_strategy_stats(NEW.strategy_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_signal_created
AFTER INSERT ON public.signals
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_signal();