# Applying Supabase Migrations

This project has 3 migration files that need to be applied to your Supabase database.

## Migration Files

1. `20260107015318_417df41d-c57b-4ecc-b558-79972f8008c8.sql` - Initial schema (profiles, strategies, signals)
2. `20260107023107_aae71d11-a587-4ba1-b688-f77f15c7e8c5.sql` - Enhancements (Stripe, roles, analytics, etc.)
3. `20260107023117_55a763a3-582c-4303-aa0e-a2003eae39f0.sql` - Security fixes (RLS policies)

## Method 1: Using Access Token (Recommended)

1. **Get your access token:**
   ```bash
   npx supabase login
   ```
   This will open your browser to authenticate and get an access token.

2. **Add to .env file:**
   ```env
   SUPABASE_ACCESS_TOKEN=your_access_token_here
   ```

3. **Apply migrations:**
   ```bash
   node apply-migrations.js
   ```
   Or manually:
   ```bash
   npm run db:link
   npm run db:push
   ```

## Method 2: Using Database Password

1. **Get your database password:**
   - Go to your Supabase Dashboard: https://supabase.com/dashboard
   - Select your project
   - Go to Settings > Database
   - Copy the database password (or reset it if needed)

2. **Add to .env file:**
   ```env
   SUPABASE_DB_PASSWORD=your_database_password_here
   ```

3. **Apply migrations:**
   ```bash
   node apply-migrations.js
   ```

## Method 3: Manual Application via Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy and paste each migration file content in order
5. Execute each migration

## Current Configuration

- **Project ID:** `ogcnilkuneeqkhmoamxi` (from .env)
- **Supabase URL:** `https://ogcnilkuneeqkhmoamxi.supabase.co`
- **Config file:** `supabase/config.toml` (updated to match .env)

## Troubleshooting

If you encounter authentication errors:
- Make sure your `.env` file has the correct project ID
- Verify your access token is valid (run `npx supabase login` again)
- Check that your database password is correct

## Available Scripts

- `npm run db:push` - Push migrations to remote database
- `npm run db:status` - Check migration status
- `npm run db:link` - Link to Supabase project

