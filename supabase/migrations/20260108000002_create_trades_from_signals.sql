-- Create function to automatically create/close trades from signals
-- This pairs BUY/SELL and LONG/SHORT signals for accurate trading simulation

CREATE OR REPLACE FUNCTION public.process_signal_to_trade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signal_type text;
  v_is_entry boolean;
  v_is_exit boolean;
  v_direction public.trade_direction;
  v_open_trade_id uuid;
  v_entry_price numeric;
  v_exit_price numeric;
  v_pnl numeric;
  v_pnl_percent numeric;
BEGIN
  v_signal_type := UPPER(NEW.signal_type);
  
  -- Determine if this is an entry or exit signal
  v_is_entry := v_signal_type IN ('BUY', 'LONG');
  v_is_exit := v_signal_type IN ('SELL', 'SHORT');
  
  -- Determine trade direction
  IF v_signal_type IN ('BUY', 'LONG') THEN
    v_direction := 'long';
  ELSIF v_signal_type IN ('SELL', 'SHORT') THEN
    v_direction := 'short';
  ELSE
    -- Unknown signal type, skip trade processing
    RETURN NEW;
  END IF;
  
  IF v_is_entry THEN
    -- Check if there's already an open trade for this symbol and strategy
    SELECT id, entry_price INTO v_open_trade_id, v_entry_price
    FROM public.trades
    WHERE strategy_id = NEW.strategy_id
      AND symbol = NEW.symbol
      AND status = 'open'
      AND direction = v_direction
    ORDER BY entry_time DESC
    LIMIT 1;
    
    IF v_open_trade_id IS NOT NULL THEN
      -- Close the existing open trade first (shouldn't happen with proper signal flow, but handle it)
      UPDATE public.trades
      SET status = 'cancelled',
          updated_at = now()
      WHERE id = v_open_trade_id;
    END IF;
    
    -- Create a new open trade
    INSERT INTO public.trades (
      user_id,
      strategy_id,
      symbol,
      direction,
      status,
      entry_signal_id,
      entry_price,
      entry_time,
      created_at,
      updated_at
    )
    VALUES (
      NEW.user_id,
      NEW.strategy_id,
      NEW.symbol,
      v_direction,
      'open',
      NEW.id,
      NEW.price,
      NEW.signal_time,
      now(),
      now()
    );
    
  ELSIF v_is_exit THEN
    -- Find the most recent open trade for this symbol and strategy
    -- For LONG: close with SELL
    -- For SHORT: close with BUY (reverse)
    SELECT id, entry_price, direction INTO v_open_trade_id, v_entry_price, v_direction
    FROM public.trades
    WHERE strategy_id = NEW.strategy_id
      AND symbol = NEW.symbol
      AND status = 'open'
    ORDER BY entry_time DESC
    LIMIT 1;
    
    IF v_open_trade_id IS NOT NULL THEN
      v_exit_price := NEW.price;
      
      -- Calculate P&L based on direction
      IF v_direction = 'long' THEN
        -- Long: profit when exit > entry
        v_pnl := v_exit_price - v_entry_price;
        v_pnl_percent := ((v_exit_price - v_entry_price) / v_entry_price) * 100;
      ELSE
        -- Short: profit when exit < entry
        v_pnl := v_entry_price - v_exit_price;
        v_pnl_percent := ((v_entry_price - v_exit_price) / v_entry_price) * 100;
      END IF;
      
      -- Close the trade
      UPDATE public.trades
      SET status = 'closed',
          exit_signal_id = NEW.id,
          exit_price = v_exit_price,
          exit_time = NEW.signal_time,
          pnl = v_pnl,
          pnl_percent = v_pnl_percent,
          updated_at = now()
      WHERE id = v_open_trade_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically process signals into trades
DROP TRIGGER IF EXISTS on_signal_processed_to_trade ON public.signals;
CREATE TRIGGER on_signal_processed_to_trade
  AFTER INSERT ON public.signals
  FOR EACH ROW
  EXECUTE FUNCTION public.process_signal_to_trade();

-- Add index for faster trade lookups
CREATE INDEX IF NOT EXISTS idx_trades_open_lookup 
  ON public.trades(strategy_id, symbol, status) 
  WHERE status = 'open';

-- Function to get unique trades for dashboard (removes duplicate signals)
CREATE OR REPLACE FUNCTION public.get_user_trades(
  p_user_id uuid,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  strategy_id uuid,
  strategy_name text,
  symbol text,
  direction public.trade_direction,
  status public.trade_status,
  entry_price numeric,
  exit_price numeric,
  entry_time timestamptz,
  exit_time timestamptz,
  pnl numeric,
  pnl_percent numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.strategy_id,
    s.name as strategy_name,
    t.symbol,
    t.direction,
    t.status,
    t.entry_price,
    t.exit_price,
    t.entry_time,
    t.exit_time,
    t.pnl,
    t.pnl_percent,
    t.created_at
  FROM public.trades t
  JOIN public.strategies s ON s.id = t.strategy_id
  WHERE t.user_id = p_user_id
    AND s.is_deleted = false
  ORDER BY t.entry_time DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_trades(uuid, integer) TO authenticated;



