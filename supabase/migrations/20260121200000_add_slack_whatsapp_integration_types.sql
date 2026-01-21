-- Add missing integration_type enum values for slack and whatsapp
-- These were expected by the app but may not have been added to the database enum

DO $$ 
BEGIN
  -- Add 'slack' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'slack' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'integration_type')
  ) THEN
    ALTER TYPE public.integration_type ADD VALUE 'slack';
  END IF;

  -- Add 'whatsapp' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'whatsapp' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'integration_type')
  ) THEN
    ALTER TYPE public.integration_type ADD VALUE 'whatsapp';
  END IF;
END $$;
