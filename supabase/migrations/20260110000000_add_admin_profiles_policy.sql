-- Fix infinite recursion in RLS policies
-- The issue: has_role() queries user_roles, but user_roles policy uses has_role(), creating recursion
-- Solution: Temporarily disable RLS on user_roles for the function, or use a different approach

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Update has_role() function
-- SECURITY DEFINER functions should bypass RLS when owned by postgres
-- In Supabase, functions are owned by postgres by default, which should bypass RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- SECURITY DEFINER functions run with the privileges of the function owner (postgres)
  -- This should bypass RLS policies on user_roles
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Ensure the function is owned by postgres (should be default, but explicit is better)
-- This ensures SECURITY DEFINER functions run with postgres privileges, bypassing RLS
DO $$
BEGIN
  -- Change function owner to postgres if not already
  ALTER FUNCTION public.has_role(uuid, app_role) OWNER TO postgres;
EXCEPTION
  WHEN OTHERS THEN
    -- Function might not exist or already owned by postgres, continue
    NULL;
END $$;

-- Recreate the user_roles admin policy
-- SECURITY DEFINER functions owned by postgres should bypass RLS
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Add RLS policy to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy to allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));
