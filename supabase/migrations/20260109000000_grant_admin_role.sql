-- Function to grant admin role to a user by email
-- This function uses SECURITY DEFINER to bypass RLS for initial admin setup
CREATE OR REPLACE FUNCTION public.grant_admin_role(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Insert admin role (ON CONFLICT handles if role already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Admin role granted to user: %', user_email;
END;
$$;

-- Example usage (uncomment and replace with your email):
-- SELECT public.grant_admin_role('your-email@example.com');




