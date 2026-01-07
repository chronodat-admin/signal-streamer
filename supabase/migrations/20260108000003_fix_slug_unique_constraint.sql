-- Fix slug unique constraint to allow reuse after soft deletion
-- Remove the old unique constraint
ALTER TABLE public.strategies DROP CONSTRAINT IF EXISTS strategies_slug_key;

-- Create a partial unique index that only enforces uniqueness for non-deleted strategies
-- This allows the same slug to be reused after a strategy is soft-deleted
CREATE UNIQUE INDEX IF NOT EXISTS strategies_slug_unique_active 
  ON public.strategies(slug) 
  WHERE slug IS NOT NULL AND is_deleted = false;

-- Also update the slug generation function to handle conflicts better
-- If a slug exists (even for deleted strategies), append a number
CREATE OR REPLACE FUNCTION public.generate_unique_slug(p_name TEXT, p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_slug TEXT;
  v_slug TEXT;
  v_counter INTEGER := 0;
  v_exists BOOLEAN;
BEGIN
  -- Generate base slug from name
  v_base_slug := lower(regexp_replace(p_name, '[^a-z0-9]+', '-', 'g'));
  v_base_slug := regexp_replace(v_base_slug, '^-|-$', '', 'g');
  
  -- Start with base slug
  v_slug := v_base_slug;
  
  -- Check if slug exists for active (non-deleted) strategies
  LOOP
    SELECT EXISTS (
      SELECT 1 
      FROM public.strategies 
      WHERE slug = v_slug 
        AND is_deleted = false
        AND user_id = p_user_id
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
    
    -- If exists, append counter
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter;
  END LOOP;
  
  RETURN v_slug;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.generate_unique_slug(TEXT, UUID) TO authenticated;

