-- Add AI insights preference column to profiles table
-- This allows users to enable/disable AI-generated insights in their Discord/Slack alerts

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'ai_insights_enabled'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN ai_insights_enabled BOOLEAN NOT NULL DEFAULT true;
    
    COMMENT ON COLUMN public.profiles.ai_insights_enabled IS 'Whether to include AI-generated insights in alert notifications';
  END IF;
END $$;
