-- ============================================================================
-- FIX: Infinite recursion in RLS policies for user_roles
-- ============================================================================
-- 
-- PROBLEM: The "Admins can manage roles" policy on user_roles calls has_role(),
-- which queries user_roles, which triggers the policy again → infinite loop.
--
-- SOLUTION: 
-- 1. Drop ALL problematic policies on user_roles
-- 2. Create has_role() with SECURITY DEFINER + explicit RLS bypass
-- 3. Only allow simple, non-recursive policies on user_roles
-- ============================================================================

-- Step 1: Drop ALL policies on user_roles to start fresh
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Step 2: Create a helper function that bypasses RLS completely
-- This uses a direct query with RLS disabled for the function execution
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off  -- This explicitly disables RLS for this function
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

-- Step 3: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- Step 4: Recreate ONLY the simple, non-recursive policy on user_roles
-- Users can only see their own roles - this doesn't cause recursion
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- NOTE: Admins should use the service_role key for managing user_roles
-- We intentionally do NOT add an admin policy on user_roles to avoid recursion

-- ============================================================================
-- Admin policies for profiles table (these are safe - no recursion)
-- ============================================================================

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Add RLS policy to allow admins to view all profiles
-- This is safe because has_role() now bypasses RLS on user_roles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy to allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));
