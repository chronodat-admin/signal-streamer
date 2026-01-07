-- Add webhook_url column to integrations table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'integrations' 
    AND column_name = 'webhook_url'
  ) THEN
    ALTER TABLE public.integrations 
      ADD COLUMN webhook_url TEXT;
    
    -- Set a default value for existing rows (can be updated later)
    UPDATE public.integrations 
    SET webhook_url = COALESCE(
      config->>'webhook_url',
      config->>'url',
      ''
    )
    WHERE webhook_url IS NULL;
    
    -- Make it NOT NULL after setting defaults
    ALTER TABLE public.integrations 
      ALTER COLUMN webhook_url SET NOT NULL;
  END IF;
END $$;

