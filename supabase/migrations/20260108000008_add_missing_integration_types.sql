-- Add missing integration_type enum values
-- The frontend supports more integration types than the database enum currently allows

DO $$ 
BEGIN
  -- Add 'email' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'email' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'integration_type')
  ) THEN
    ALTER TYPE public.integration_type ADD VALUE 'email';
  END IF;

  -- Add 'webhook' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'webhook' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'integration_type')
  ) THEN
    ALTER TYPE public.integration_type ADD VALUE 'webhook';
  END IF;

  -- Add 'pushover' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'pushover' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'integration_type')
  ) THEN
    ALTER TYPE public.integration_type ADD VALUE 'pushover';
  END IF;

  -- Add 'ntfy' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'ntfy' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'integration_type')
  ) THEN
    ALTER TYPE public.integration_type ADD VALUE 'ntfy';
  END IF;

  -- Add 'zapier' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'zapier' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'integration_type')
  ) THEN
    ALTER TYPE public.integration_type ADD VALUE 'zapier';
  END IF;

  -- Add 'ifttt' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'ifttt' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'integration_type')
  ) THEN
    ALTER TYPE public.integration_type ADD VALUE 'ifttt';
  END IF;

  -- Add 'microsoft-teams' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'microsoft-teams' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'integration_type')
  ) THEN
    ALTER TYPE public.integration_type ADD VALUE 'microsoft-teams';
  END IF;

  -- Add 'google-chat' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'google-chat' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'integration_type')
  ) THEN
    ALTER TYPE public.integration_type ADD VALUE 'google-chat';
  END IF;
END $$;


