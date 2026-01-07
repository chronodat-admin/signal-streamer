-- Create integrations table for Discord, Slack, Telegram, WhatsApp
DO $$ BEGIN
  CREATE TYPE public.integration_type AS ENUM ('discord', 'slack', 'telegram', 'whatsapp');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.integration_status AS ENUM ('active', 'inactive', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Check if table exists and migrate schema if needed
DO $$ 
BEGIN
  -- If table exists, add missing columns
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'integrations'
  ) THEN
    -- Add integration_type column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'integrations' 
      AND column_name = 'integration_type'
    ) THEN
      -- If old 'type' column exists, migrate it
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'integrations' 
        AND column_name = 'type'
      ) THEN
        ALTER TABLE public.integrations 
          ADD COLUMN integration_type public.integration_type;
        
        -- Migrate data
        UPDATE public.integrations 
        SET integration_type = type::text::public.integration_type
        WHERE integration_type IS NULL;
        
        ALTER TABLE public.integrations 
          ALTER COLUMN integration_type SET NOT NULL,
          DROP COLUMN IF EXISTS type;
      ELSE
        -- No type column, just add integration_type
        ALTER TABLE public.integrations 
          ADD COLUMN integration_type public.integration_type NOT NULL DEFAULT 'discord';
      END IF;
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'integrations' 
      AND column_name = 'status'
    ) THEN
      ALTER TABLE public.integrations 
        ADD COLUMN status public.integration_status DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'integrations' 
      AND column_name = 'config'
    ) THEN
      ALTER TABLE public.integrations 
        ADD COLUMN config JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'integrations' 
      AND column_name = 'last_used_at'
    ) THEN
      ALTER TABLE public.integrations 
        ADD COLUMN last_used_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'integrations' 
      AND column_name = 'error_message'
    ) THEN
      ALTER TABLE public.integrations 
        ADD COLUMN error_message TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'integrations' 
      AND column_name = 'enabled'
    ) THEN
      ALTER TABLE public.integrations 
        ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    -- Make strategy_id nullable if it's not already
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'integrations' 
      AND column_name = 'strategy_id'
      AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE public.integrations 
        ALTER COLUMN strategy_id DROP NOT NULL;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE,
  integration_type public.integration_type NOT NULL,
  name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  status public.integration_status NOT NULL DEFAULT 'active',
  enabled BOOLEAN NOT NULL DEFAULT true,
  -- Configuration options (JSONB for flexibility)
  config JSONB DEFAULT '{}'::jsonb,
  -- For Telegram: bot_token and chat_id
  -- For WhatsApp: phone_number, api_key
  -- For Discord/Slack: webhook_url is sufficient
  last_used_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes (only create if columns exist)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'integrations' 
    AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'integrations' 
    AND column_name = 'strategy_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_integrations_strategy_id ON public.integrations(strategy_id);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'integrations' 
    AND column_name = 'integration_type'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_integrations_type ON public.integrations(integration_type);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'integrations' 
    AND column_name = 'enabled'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_integrations_enabled ON public.integrations(enabled) WHERE enabled = true;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
CREATE POLICY "Users can view their own integrations"
  ON public.integrations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own integrations" ON public.integrations;
CREATE POLICY "Users can insert their own integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own integrations" ON public.integrations;
CREATE POLICY "Users can update their own integrations"
  ON public.integrations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.integrations;
CREATE POLICY "Users can delete their own integrations"
  ON public.integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Function to send alerts to integrations
CREATE OR REPLACE FUNCTION public.send_signal_alerts(
  p_signal_id UUID,
  p_strategy_id UUID,
  p_signal_type TEXT,
  p_symbol TEXT,
  p_price NUMERIC,
  p_signal_time TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_integration RECORD;
  v_result JSONB := '[]'::jsonb;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
BEGIN
  -- Get all active integrations for this strategy (or user-level if strategy_id is null)
  FOR v_integration IN
    SELECT i.*, s.name as strategy_name
    FROM public.integrations i
    LEFT JOIN public.strategies s ON s.id = i.strategy_id
    WHERE i.enabled = true
      AND i.status = 'active'
      AND (i.strategy_id = p_strategy_id OR (i.strategy_id IS NULL AND i.user_id = (SELECT user_id FROM public.strategies WHERE id = p_strategy_id)))
  LOOP
    -- This function will be called by the Edge Function to actually send the alert
    -- For now, we just log it - the actual sending happens in the Edge Function
    v_result := v_result || jsonb_build_object(
      'integration_id', v_integration.id,
      'integration_type', v_integration.integration_type,
      'status', 'queued'
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'total', jsonb_array_length(v_result),
    'integrations', v_result
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.send_signal_alerts(UUID, UUID, TEXT, TEXT, NUMERIC, TIMESTAMPTZ) TO authenticated;

-- Trigger to update updated_at
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

