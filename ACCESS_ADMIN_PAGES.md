# How to Access Admin Pages

## Prerequisites

Before you can access admin pages, you need to:

1. **Be logged in** to your account
2. **Have admin role granted** to your user account

If you haven't granted admin role yet, see `GRANT_ADMIN_ROLE.md` for instructions.

## Admin Pages Available

The following admin pages are available:

1. **Admin Dashboard** - `/admin`
   - Overview and statistics
   - System status

2. **User Management** - `/admin/users`
   - View all users
   - User statistics (Total, Admin, Regular, Recent)
   - Join statistics (Today, This Week, This Month)
   - Search and filter users by role

## How to Access

### Method 1: Direct URL Navigation

1. **Make sure you're logged in** to your account
2. **Navigate directly to the admin URL**:
   - Admin Dashboard: `http://localhost:5173/admin` (or your app URL)
   - User Management: `http://localhost:5173/admin/users`

### Method 2: Through the Application

1. **Log in** to your account at `/auth`
2. **Navigate to** `/dashboard` (regular dashboard)
3. **Manually type** `/admin` in the address bar, or click a link if you add one

### Method 3: Add Admin Link to Dashboard (Optional)

You can add a link to the admin panel in your regular dashboard. The admin pages are protected and will automatically redirect non-admin users.

## What Happens When You Access

### If You Have Admin Role:
- ✅ You'll see the admin pages with the purple sidebar
- ✅ You can navigate between admin sections
- ✅ All admin features are accessible

### If You Don't Have Admin Role:
- ❌ You'll be automatically redirected to `/dashboard`
- ❌ You'll see a loading screen briefly, then redirect

## Troubleshooting

### Issue: Redirected to Dashboard

**Problem**: You're being redirected to `/dashboard` when trying to access `/admin`

**Solution**: 
1. Verify you have admin role:
   ```sql
   SELECT u.email, ur.role
   FROM auth.users u
   JOIN public.user_roles ur ON u.id = ur.user_id
   WHERE u.email = 'your-email@example.com';
   ```

2. If no admin role exists, grant it using `GRANT_ADMIN_ROLE.md`

3. **Important**: After granting admin role, you may need to:
   - Log out and log back in, OR
   - Refresh the page (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Loading Screen Stuck

**Problem**: Page shows loading spinner indefinitely

**Solution**:
1. Check browser console for errors
2. Verify your Supabase connection is working
3. Check that the `has_role` function exists in your database
4. Try logging out and back in

### Issue: 404 Not Found

**Problem**: Page shows "Not Found" error

**Solution**:
1. Make sure the routes are properly added in `src/App.tsx`
2. Restart your development server:
   ```bash
   npm run dev
   ```
3. Check that the admin page files exist:
   - `src/pages/admin/AdminDashboard.tsx`
   - `src/pages/admin/UserManagement.tsx`

## Quick Test

To quickly test if admin access is working:

1. **Grant admin role** (if not done):
   ```sql
   SELECT public.grant_admin_role('your-email@example.com');
   ```

2. **Log out and log back in** (important for session refresh)

3. **Navigate to**: `http://localhost:5173/admin/users`

4. **You should see**:
   - Purple sidebar with "Admin Panel" header
   - User statistics cards
   - User management table

## Admin Navigation

Once you're in the admin panel, you can navigate using the sidebar:

- **Dashboard** → `/admin` - Admin overview
- **User Management** → `/admin/users` - Manage users
- **← Back to Dashboard** - Returns to regular dashboard

## Development Server

If running locally, make sure your dev server is running:

```bash
npm run dev
```

Then access:
- `http://localhost:5173/admin`
- `http://localhost:5173/admin/users`





