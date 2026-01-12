# How to Grant Admin Role for Testing

There are several ways to grant admin role to your current user for testing:

## Method 1: Using the SQL Function (Recommended)

1. **Run the migration** (if not already applied):
   ```bash
   npm run db:push
   ```

2. **Open Supabase SQL Editor**:
   - Go to your Supabase Dashboard: https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor**

3. **Run the grant function** with your email:
   ```sql
   SELECT public.grant_admin_role('your-email@example.com');
   ```
   Replace `your-email@example.com` with your actual email address.

## Method 2: Direct SQL Insert (via Supabase Dashboard)

1. **Get your User ID**:
   - Go to **Authentication** > **Users** in Supabase Dashboard
   - Find your user and copy the **UUID** (user ID)

2. **Open SQL Editor** and run:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('your-user-id-here', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```
   Replace `your-user-id-here` with your actual user UUID.

## Method 3: Using Supabase Dashboard Table Editor

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `user_roles` table
3. Click **Insert** > **Insert row**
4. Fill in:
   - `user_id`: Your user UUID (from Authentication > Users)
   - `role`: `admin`
5. Click **Save**

## Method 4: Temporary Bypass RLS (For Development Only)

If you need to bypass RLS temporarily for testing, you can run this in SQL Editor:

```sql
-- Temporarily disable RLS (DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION)
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Insert admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

## Verify Admin Role

After granting the role, you can verify it by:

1. **Check in SQL Editor**:
   ```sql
   SELECT u.email, ur.role
   FROM auth.users u
   JOIN public.user_roles ur ON u.id = ur.user_id
   WHERE u.email = 'your-email@example.com';
   ```

2. **Or check in your app**:
   - Log out and log back in
   - Navigate to `/admin` - you should now have access

## Remove Admin Role

To remove admin role (for testing):
```sql
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com')
AND role = 'admin';
```

## Notes

- The `grant_admin_role` function uses `SECURITY DEFINER` to bypass RLS, making it safe to use
- The function handles duplicate entries gracefully with `ON CONFLICT DO NOTHING`
- After granting the role, you may need to refresh your session or log out/in for the changes to take effect
- Admin role grants access to `/admin` and `/admin/users` routes





