-- Add source column to signals table to track where signals come from
-- Possible values: 'tradingview', 'trendspider', 'api', 'manual', 'other'

ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'tradingview';

-- Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_signals_source ON public.signals(source);

-- Add comment explaining the column
COMMENT ON COLUMN public.signals.source IS 'Source of the signal: tradingview, trendspider, api (API Keys), manual, other';

-- Update existing signals to have default source
UPDATE public.signals SET source = 'tradingview' WHERE source IS NULL;

