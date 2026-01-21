-- =====================================================
-- STRATEGY MARKETPLACE & PERFORMANCE TRACKING
-- =====================================================
-- This migration adds:
-- 1. Strategy performance stats (cached metrics)
-- 2. Strategy subscriptions (follow/copy trading)
-- 3. Creator earnings tracking
-- 4. Leaderboard support
-- =====================================================

-- First, drop the old strategy_stats table if it exists with incompatible schema
-- and recreate with the new schema
DROP TABLE IF EXISTS public.strategy_stats CASCADE;

-- Strategy stats table (cached performance metrics)
CREATE TABLE public.strategy_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Trade counts
  total_trades INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  losing_trades INTEGER NOT NULL DEFAULT 0,
  open_trades INTEGER NOT NULL DEFAULT 0,
  
  -- Performance metrics
  win_rate NUMERIC(5, 2) DEFAULT 0,           -- Percentage (0-100)
  total_pnl NUMERIC(18, 2) DEFAULT 0,         -- Cumulative P&L
  total_pnl_percent NUMERIC(10, 2) DEFAULT 0, -- Cumulative P&L %
  avg_pnl_percent NUMERIC(10, 2) DEFAULT 0,   -- Average P&L per trade
  best_trade_pnl NUMERIC(18, 2) DEFAULT 0,    -- Best single trade
  worst_trade_pnl NUMERIC(18, 2) DEFAULT 0,   -- Worst single trade
  
  -- Risk metrics
  max_drawdown NUMERIC(10, 2) DEFAULT 0,      -- Maximum drawdown %
  sharpe_ratio NUMERIC(6, 3) DEFAULT 0,       -- Risk-adjusted return
  profit_factor NUMERIC(8, 3) DEFAULT 0,      -- Gross profit / Gross loss
  
  -- Streaks
  current_streak INTEGER DEFAULT 0,           -- Current win/loss streak (positive=wins)
  longest_win_streak INTEGER DEFAULT 0,
  longest_loss_streak INTEGER DEFAULT 0,
  
  -- Activity
  first_trade_at TIMESTAMPTZ,
  last_trade_at TIMESTAMPTZ,
  avg_trade_duration INTERVAL,
  
  -- Followers/subscribers
  follower_count INTEGER NOT NULL DEFAULT 0,
  subscriber_count INTEGER NOT NULL DEFAULT 0,
  
  -- Ranking score (composite metric for leaderboard)
  ranking_score NUMERIC(10, 2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Strategy subscription tiers (for paid strategies)
CREATE TABLE IF NOT EXISTS public.strategy_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,                          -- e.g., "Basic", "Premium"
  description TEXT,
  price_monthly NUMERIC(10, 2) NOT NULL,       -- Monthly price in USD
  price_yearly NUMERIC(10, 2),                 -- Optional yearly price
  
  -- Features included in this tier
  features JSONB DEFAULT '[]'::jsonb,          -- ["real-time alerts", "entry/exit prices", etc.]
  
  -- Limits
  signal_delay_minutes INTEGER DEFAULT 0,      -- Delay before follower sees signal (0 = real-time)
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Strategy subscriptions (users following/subscribing to strategies)
CREATE TABLE IF NOT EXISTS public.strategy_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES public.strategy_tiers(id) ON DELETE SET NULL,
  
  -- Subscription type
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('free', 'paid')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  
  -- Stripe integration
  stripe_subscription_id TEXT,
  
  -- Billing
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Notifications
  notify_discord BOOLEAN DEFAULT false,
  notify_telegram BOOLEAN DEFAULT false,
  notify_email BOOLEAN DEFAULT true,
  notify_push BOOLEAN DEFAULT true,
  
  -- Timestamps
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one subscription per user per strategy
  UNIQUE(user_id, strategy_id)
);

-- Creator earnings tracking
CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.strategy_subscriptions(id) ON DELETE SET NULL,
  
  -- Earnings
  amount NUMERIC(10, 2) NOT NULL,
  platform_fee NUMERIC(10, 2) NOT NULL,        -- Platform takes 20%
  net_amount NUMERIC(10, 2) NOT NULL,          -- Amount after fee
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Source
  source TEXT NOT NULL CHECK (source IN ('subscription', 'tip', 'bonus')),
  
  -- Payout
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
  payout_id TEXT,
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add marketplace fields to strategies table
ALTER TABLE public.strategies 
  ADD COLUMN IF NOT EXISTS is_monetized BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_subscription_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS allow_free_follow BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Add creator fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS creator_bio TEXT,
  ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT,
  ADD COLUMN IF NOT EXISTS payout_enabled BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_strategy_stats_ranking ON public.strategy_stats(ranking_score DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_stats_win_rate ON public.strategy_stats(win_rate DESC) WHERE win_rate > 0;
CREATE INDEX IF NOT EXISTS idx_strategy_stats_total_pnl ON public.strategy_stats(total_pnl_percent DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_stats_followers ON public.strategy_stats(follower_count DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_subscriptions_user ON public.strategy_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_subscriptions_strategy ON public.strategy_subscriptions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_subscriptions_active ON public.strategy_subscriptions(strategy_id, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_creator_earnings_user ON public.creator_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_pending ON public.creator_earnings(user_id, payout_status) WHERE payout_status = 'pending';

-- Enable RLS
ALTER TABLE public.strategy_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

-- Strategy stats policies (public read for public strategies)
DROP POLICY IF EXISTS "Anyone can view stats for public strategies" ON public.strategy_stats;
CREATE POLICY "Anyone can view stats for public strategies"
  ON public.strategy_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.strategies s
      WHERE s.id = strategy_id
      AND s.is_public = true
      AND s.is_deleted = false
    )
  );

DROP POLICY IF EXISTS "Users can view their own strategy stats" ON public.strategy_stats;
CREATE POLICY "Users can view their own strategy stats"
  ON public.strategy_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.strategies s
      WHERE s.id = strategy_id
      AND s.user_id = auth.uid()
    )
  );

-- Strategy tiers policies
DROP POLICY IF EXISTS "Anyone can view active tiers for public strategies" ON public.strategy_tiers;
CREATE POLICY "Anyone can view active tiers for public strategies"
  ON public.strategy_tiers FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.strategies s
      WHERE s.id = strategy_id
      AND s.is_public = true
      AND s.is_deleted = false
    )
  );

DROP POLICY IF EXISTS "Owners can manage their strategy tiers" ON public.strategy_tiers;
CREATE POLICY "Owners can manage their strategy tiers"
  ON public.strategy_tiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.strategies s
      WHERE s.id = strategy_id
      AND s.user_id = auth.uid()
    )
  );

-- Strategy subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.strategy_subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON public.strategy_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Strategy owners can view subscriptions to their strategies" ON public.strategy_subscriptions;
CREATE POLICY "Strategy owners can view subscriptions to their strategies"
  ON public.strategy_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.strategies s
      WHERE s.id = strategy_id
      AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create subscriptions" ON public.strategy_subscriptions;
CREATE POLICY "Users can create subscriptions"
  ON public.strategy_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.strategy_subscriptions;
CREATE POLICY "Users can update their own subscriptions"
  ON public.strategy_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Creator earnings policies
DROP POLICY IF EXISTS "Users can view their own earnings" ON public.creator_earnings;
CREATE POLICY "Users can view their own earnings"
  ON public.creator_earnings FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate and update strategy stats
CREATE OR REPLACE FUNCTION public.update_strategy_stats(p_strategy_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_trades INTEGER;
  v_winning_trades INTEGER;
  v_losing_trades INTEGER;
  v_open_trades INTEGER;
  v_total_pnl NUMERIC;
  v_total_pnl_percent NUMERIC;
  v_avg_pnl_percent NUMERIC;
  v_best_trade NUMERIC;
  v_worst_trade NUMERIC;
  v_gross_profit NUMERIC;
  v_gross_loss NUMERIC;
  v_profit_factor NUMERIC;
  v_win_rate NUMERIC;
  v_first_trade TIMESTAMPTZ;
  v_last_trade TIMESTAMPTZ;
  v_follower_count INTEGER;
  v_subscriber_count INTEGER;
  v_ranking_score NUMERIC;
BEGIN
  -- Get trade statistics
  SELECT 
    COUNT(*) FILTER (WHERE status = 'closed'),
    COUNT(*) FILTER (WHERE status = 'closed' AND pnl > 0),
    COUNT(*) FILTER (WHERE status = 'closed' AND pnl <= 0),
    COUNT(*) FILTER (WHERE status = 'open'),
    COALESCE(SUM(pnl) FILTER (WHERE status = 'closed'), 0),
    COALESCE(SUM(pnl_percent) FILTER (WHERE status = 'closed'), 0),
    COALESCE(AVG(pnl_percent) FILTER (WHERE status = 'closed'), 0),
    COALESCE(MAX(pnl) FILTER (WHERE status = 'closed'), 0),
    COALESCE(MIN(pnl) FILTER (WHERE status = 'closed'), 0),
    COALESCE(SUM(pnl) FILTER (WHERE status = 'closed' AND pnl > 0), 0),
    ABS(COALESCE(SUM(pnl) FILTER (WHERE status = 'closed' AND pnl < 0), 0)),
    MIN(entry_time) FILTER (WHERE status = 'closed'),
    MAX(exit_time) FILTER (WHERE status = 'closed')
  INTO 
    v_total_trades, v_winning_trades, v_losing_trades, v_open_trades,
    v_total_pnl, v_total_pnl_percent, v_avg_pnl_percent,
    v_best_trade, v_worst_trade,
    v_gross_profit, v_gross_loss,
    v_first_trade, v_last_trade
  FROM public.trades
  WHERE strategy_id = p_strategy_id;
  
  -- Calculate win rate
  IF v_total_trades > 0 THEN
    v_win_rate := (v_winning_trades::NUMERIC / v_total_trades) * 100;
  ELSE
    v_win_rate := 0;
  END IF;
  
  -- Calculate profit factor
  IF v_gross_loss > 0 THEN
    v_profit_factor := v_gross_profit / v_gross_loss;
  ELSE
    v_profit_factor := CASE WHEN v_gross_profit > 0 THEN 999 ELSE 0 END;
  END IF;
  
  -- Get follower/subscriber counts
  SELECT 
    COUNT(*) FILTER (WHERE subscription_type = 'free' AND status = 'active'),
    COUNT(*) FILTER (WHERE subscription_type = 'paid' AND status = 'active')
  INTO v_follower_count, v_subscriber_count
  FROM public.strategy_subscriptions
  WHERE strategy_id = p_strategy_id;
  
  -- Calculate ranking score (weighted composite)
  -- Formula: (win_rate * 0.3) + (profit_factor * 10) + (total_trades * 0.5) + (followers * 2)
  v_ranking_score := 
    (LEAST(v_win_rate, 100) * 0.3) + 
    (LEAST(v_profit_factor, 10) * 10) + 
    (LEAST(v_total_trades, 1000) * 0.5) + 
    ((v_follower_count + v_subscriber_count * 3) * 2);
  
  -- Upsert strategy stats
  INSERT INTO public.strategy_stats (
    strategy_id,
    total_trades,
    winning_trades,
    losing_trades,
    open_trades,
    win_rate,
    total_pnl,
    total_pnl_percent,
    avg_pnl_percent,
    best_trade_pnl,
    worst_trade_pnl,
    profit_factor,
    first_trade_at,
    last_trade_at,
    follower_count,
    subscriber_count,
    ranking_score,
    updated_at
  )
  VALUES (
    p_strategy_id,
    v_total_trades,
    v_winning_trades,
    v_losing_trades,
    v_open_trades,
    v_win_rate,
    v_total_pnl,
    v_total_pnl_percent,
    v_avg_pnl_percent,
    v_best_trade,
    v_worst_trade,
    v_profit_factor,
    v_first_trade,
    v_last_trade,
    v_follower_count,
    v_subscriber_count,
    v_ranking_score,
    now()
  )
  ON CONFLICT (strategy_id) DO UPDATE SET
    total_trades = EXCLUDED.total_trades,
    winning_trades = EXCLUDED.winning_trades,
    losing_trades = EXCLUDED.losing_trades,
    open_trades = EXCLUDED.open_trades,
    win_rate = EXCLUDED.win_rate,
    total_pnl = EXCLUDED.total_pnl,
    total_pnl_percent = EXCLUDED.total_pnl_percent,
    avg_pnl_percent = EXCLUDED.avg_pnl_percent,
    best_trade_pnl = EXCLUDED.best_trade_pnl,
    worst_trade_pnl = EXCLUDED.worst_trade_pnl,
    profit_factor = EXCLUDED.profit_factor,
    first_trade_at = EXCLUDED.first_trade_at,
    last_trade_at = EXCLUDED.last_trade_at,
    follower_count = EXCLUDED.follower_count,
    subscriber_count = EXCLUDED.subscriber_count,
    ranking_score = EXCLUDED.ranking_score,
    updated_at = now();
END;
$$;

-- Trigger to update stats when a trade is closed
CREATE OR REPLACE FUNCTION public.on_trade_update_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update stats for the strategy
  PERFORM public.update_strategy_stats(NEW.strategy_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_trade_closed_update_stats ON public.trades;
CREATE TRIGGER on_trade_closed_update_stats
  AFTER INSERT OR UPDATE ON public.trades
  FOR EACH ROW
  WHEN (NEW.status = 'closed')
  EXECUTE FUNCTION public.on_trade_update_stats();

-- Function to follow a strategy (free)
CREATE OR REPLACE FUNCTION public.follow_strategy(p_strategy_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if strategy exists and is public
  IF NOT EXISTS (
    SELECT 1 FROM public.strategies 
    WHERE id = p_strategy_id 
    AND is_public = true 
    AND is_deleted = false
  ) THEN
    RAISE EXCEPTION 'Strategy not found or not public';
  END IF;
  
  -- Check if already following
  SELECT id INTO v_subscription_id
  FROM public.strategy_subscriptions
  WHERE user_id = v_user_id AND strategy_id = p_strategy_id;
  
  IF v_subscription_id IS NOT NULL THEN
    -- Reactivate if cancelled
    UPDATE public.strategy_subscriptions
    SET status = 'active', cancelled_at = NULL, updated_at = now()
    WHERE id = v_subscription_id AND status != 'active';
    
    RETURN v_subscription_id;
  END IF;
  
  -- Create new subscription
  INSERT INTO public.strategy_subscriptions (
    user_id, strategy_id, subscription_type, status
  )
  VALUES (
    v_user_id, p_strategy_id, 'free', 'active'
  )
  RETURNING id INTO v_subscription_id;
  
  -- Update follower count
  PERFORM public.update_strategy_stats(p_strategy_id);
  
  RETURN v_subscription_id;
END;
$$;

-- Function to unfollow a strategy
CREATE OR REPLACE FUNCTION public.unfollow_strategy(p_strategy_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  UPDATE public.strategy_subscriptions
  SET status = 'cancelled', cancelled_at = now(), updated_at = now()
  WHERE user_id = v_user_id 
    AND strategy_id = p_strategy_id 
    AND status = 'active';
  
  -- Update follower count
  PERFORM public.update_strategy_stats(p_strategy_id);
END;
$$;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION public.get_strategy_leaderboard(
  p_limit INTEGER DEFAULT 50,
  p_min_trades INTEGER DEFAULT 10,
  p_sort_by TEXT DEFAULT 'ranking_score'
)
RETURNS TABLE (
  strategy_id UUID,
  strategy_name TEXT,
  strategy_slug TEXT,
  strategy_description TEXT,
  strategy_exchange TEXT,
  strategy_timeframe TEXT,
  owner_name TEXT,
  owner_avatar TEXT,
  total_trades INTEGER,
  win_rate NUMERIC,
  total_pnl_percent NUMERIC,
  profit_factor NUMERIC,
  follower_count INTEGER,
  subscriber_count INTEGER,
  ranking_score NUMERIC,
  first_trade_at TIMESTAMPTZ,
  last_trade_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as strategy_id,
    s.name as strategy_name,
    s.slug as strategy_slug,
    s.description as strategy_description,
    s.exchange as strategy_exchange,
    s.timeframe as strategy_timeframe,
    p.full_name as owner_name,
    p.avatar_url as owner_avatar,
    ss.total_trades,
    ss.win_rate,
    ss.total_pnl_percent,
    ss.profit_factor,
    ss.follower_count,
    ss.subscriber_count,
    ss.ranking_score,
    ss.first_trade_at,
    ss.last_trade_at
  FROM public.strategy_stats ss
  JOIN public.strategies s ON s.id = ss.strategy_id
  LEFT JOIN public.profiles p ON p.user_id = s.user_id
  WHERE s.is_public = true
    AND s.is_deleted = false
    AND ss.total_trades >= p_min_trades
  ORDER BY 
    CASE p_sort_by
      WHEN 'ranking_score' THEN ss.ranking_score
      WHEN 'win_rate' THEN ss.win_rate
      WHEN 'pnl' THEN ss.total_pnl_percent
      WHEN 'profit_factor' THEN ss.profit_factor
      WHEN 'followers' THEN ss.follower_count::NUMERIC
      ELSE ss.ranking_score
    END DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_strategy_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.follow_strategy(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unfollow_strategy(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_strategy_leaderboard(INTEGER, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_strategy_leaderboard(INTEGER, INTEGER, TEXT) TO anon;

-- Initialize stats for existing strategies with trades
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT DISTINCT strategy_id 
    FROM public.trades 
    WHERE status = 'closed'
  ) LOOP
    PERFORM public.update_strategy_stats(r.strategy_id);
  END LOOP;
END $$;
