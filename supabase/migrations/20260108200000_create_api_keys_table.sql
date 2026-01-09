-- Create API keys table for third-party applications
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES public.strategies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  api_key text NOT NULL UNIQUE,
  -- Payload mapping configuration (JSON)
  -- Maps incoming payload fields to our signal fields
  payload_mapping jsonb DEFAULT '{
    "signal": "signal",
    "symbol": "symbol", 
    "price": "price",
    "time": "time"
  }'::jsonb,
  -- Optional: default values if not in payload
  default_values jsonb DEFAULT '{}'::jsonb,
  -- Rate limiting
  rate_limit_per_minute integer DEFAULT 60,
  -- Status
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  request_count bigint DEFAULT 0,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for fast API key lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON public.api_keys(api_key) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Function to generate secure API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  key_prefix text := 'sp_';
  random_part text;
BEGIN
  -- Generate a secure random key: sp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
  random_part := encode(gen_random_bytes(24), 'base64');
  -- Make URL safe
  random_part := replace(replace(random_part, '+', '-'), '/', '_');
  random_part := rtrim(random_part, '=');
  RETURN key_prefix || random_part;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_api_keys_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_api_keys_updated_at();

-- Add comment explaining the payload_mapping structure
COMMENT ON COLUMN public.api_keys.payload_mapping IS 
'JSON object mapping incoming payload fields to signal fields.
Example: {
  "signal": "action",        -- incoming "action" field maps to "signal"
  "symbol": "ticker",        -- incoming "ticker" field maps to "symbol"
  "price": "entry_price",    -- incoming "entry_price" field maps to "price"
  "time": "timestamp"        -- incoming "timestamp" field maps to "time"
}
You can also use dot notation for nested fields: "data.ticker" or JSONPath expressions.';



