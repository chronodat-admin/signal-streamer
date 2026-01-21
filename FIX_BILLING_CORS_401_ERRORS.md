# Fixing Billing CORS and 401 Errors

## Understanding the Errors

### 1. CORS Error for `check-subscription`
```
Access to fetch at 'https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/check-subscription' 
from origin 'https://trademoq.com' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status.
```

**Root Cause**: The OPTIONS preflight request was returning a 204 (No Content) status instead of 200 (OK), and the CORS headers were missing `Access-Control-Allow-Methods`.

### 2. 401 Error for `create-checkout`
```
Failed to load resource: the server responded with a status of 401
```

**Root Cause**: The `create-checkout` function was using `SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY` for authentication. When verifying JWT tokens from the client, you need the service role key to properly authenticate users.

## Fixes Applied

### 1. Fixed CORS Headers (All Functions)
- Added `Access-Control-Allow-Methods: "GET, POST, OPTIONS"` to CORS headers
- Changed OPTIONS response status from 204 to 200

**Files Updated:**
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/customer-portal/index.ts`

### 2. Fixed Authentication in `create-checkout`
- Changed from using `SUPABASE_ANON_KEY` to `SUPABASE_SERVICE_ROLE_KEY`
- Added `{ auth: { persistSession: false } }` option to match other functions

**Before:**
```typescript
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || ...
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  supabaseAnonKey
);
```

**After:**
```typescript
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);
```

## Next Steps: Deploy the Functions

The functions need to be deployed to Supabase for the fixes to take effect:

### Option 1: Deploy via Supabase CLI
```bash
# Deploy all functions
supabase functions deploy check-subscription
supabase functions deploy create-checkout
supabase functions deploy customer-portal
```

### Option 2: Deploy via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Edge Functions
3. Deploy each function:
   - `check-subscription`
   - `create-checkout`
   - `customer-portal`

### Option 3: Deploy All at Once
```bash
supabase functions deploy
```

## Verify Environment Variables

Make sure these environment variables are set in your Supabase project:

1. **STRIPE_SECRET_KEY** - Your Stripe secret key
2. **SUPABASE_SERVICE_ROLE_KEY** - Your Supabase service role key (auto-provided)
3. **SUPABASE_URL** - Your Supabase project URL (auto-provided)

## Testing After Deployment

1. **Test CORS**: The preflight OPTIONS request should now return 200
2. **Test Authentication**: The 401 errors should be resolved
3. **Test Checkout Flow**:
   - Click "Upgrade to Pro" or "Upgrade to Elite"
   - Should redirect to Stripe checkout without errors
4. **Test Subscription Check**:
   - The billing page should load without CORS errors
   - Subscription status should refresh properly

## Common Issues

### If CORS errors persist:
- Check that the functions are actually deployed (not just saved locally)
- Verify the origin URL matches your Vercel deployment
- Check Supabase function logs for errors

### If 401 errors persist:
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Supabase secrets
- Check that the Authorization header is being sent from the client
- Verify the JWT token is valid and not expired

### If functions don't exist:
- The functions need to be created and deployed first
- Use `supabase functions new <function-name>` to create them
- Then deploy with `supabase functions deploy <function-name>`

## Summary

The errors were caused by:
1. **CORS**: Missing methods header and wrong status code for OPTIONS
2. **Authentication**: Using wrong Supabase key (anon instead of service role)

Both issues have been fixed in the code. You just need to **deploy the updated functions** to Supabase.

