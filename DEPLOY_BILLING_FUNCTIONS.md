# Deploy Billing Edge Functions - Fix CORS and 401 Errors

## Problem

You're seeing these errors because the new billing functions (`check-subscription` and `customer-portal`) haven't been deployed to Supabase yet:

- **CORS Error**: `Response to preflight request doesn't pass access control check`
- **401 Error**: `Edge Function returned a non-2xx status code`

## Solution: Deploy the Functions

The functions exist locally but need to be deployed to Supabase.

### Step 1: Login to Supabase CLI

```bash
npx supabase login
```

This will open a browser to authenticate. After login, you'll get an access token.

### Step 2: Link Your Project (if not already linked)

```bash
npx supabase link --project-ref ogcnilkuneeqkhmoamxi
```

Or if you have a config file:
```bash
npm run db:link
```

### Step 3: Deploy the New Functions

Deploy the three billing-related functions:

```bash
# Deploy check-subscription (NEW - needed for billing page)
npx supabase functions deploy check-subscription

# Deploy customer-portal (NEW - needed for subscription management)
npx supabase functions deploy customer-portal

# Deploy create-checkout (UPDATE - has fixes for 401 errors)
npx supabase functions deploy create-checkout
```

### Step 4: Verify Deployment

Check that the functions are deployed:

```bash
npx supabase functions list
```

You should see:
- ✅ `check-subscription`
- ✅ `customer-portal`
- ✅ `create-checkout`

### Step 5: Set Environment Variables (Secrets)

Make sure these secrets are set in Supabase Dashboard → Edge Functions → Secrets:

1. **STRIPE_SECRET_KEY** - Your Stripe secret key (`sk_test_...` or `sk_live_...`)
2. **STRIPE_PRO_PRICE_ID** - PRO plan price ID (optional, if using plan parameter)
3. **STRIPE_ELITE_PRICE_ID** - ELITE plan price ID (optional, if using plan parameter)

**Note**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase.

### Step 6: Test the Functions

After deployment, test in your browser:

1. Go to your billing page: `https://signal-streamer-ptpskk2ik-chronodat.vercel.app/dashboard/billing`
2. The page should load without CORS errors
3. Click "Upgrade to Pro" - should redirect to Stripe checkout without 401 errors

## Alternative: Deploy via Supabase Dashboard

If CLI doesn't work, deploy manually:

### For `check-subscription`:

1. Go to https://supabase.com/dashboard/project/ogcnilkuneeqkhmoamxi/functions
2. Click **"Create a new function"**
3. Name: `check-subscription`
4. Copy code from `supabase/functions/check-subscription/index.ts`
5. Paste and click **"Deploy"**

### For `customer-portal`:

1. Click **"Create a new function"**
2. Name: `customer-portal`
3. Copy code from `supabase/functions/customer-portal/index.ts`
4. Paste and click **"Deploy"**

### For `create-checkout` (Update existing):

1. Find `create-checkout` in the functions list
2. Click **"Edit"**
3. Replace code with content from `supabase/functions/create-checkout/index.ts`
4. Click **"Deploy"**

## Verify Function URLs

After deployment, these URLs should work:

- `https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/check-subscription`
- `https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/customer-portal`
- `https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/create-checkout`

## Troubleshooting

### Error: "Access token not provided"
```bash
npx supabase login
```

### Error: "Project not linked"
```bash
npx supabase link --project-ref ogcnilkuneeqkhmoamxi
```

### Error: "Function not found" after deployment
- Wait 1-2 minutes for deployment to propagate
- Check Supabase Dashboard → Edge Functions to confirm deployment
- Clear browser cache and try again

### Still getting CORS errors?
- Make sure you deployed the **updated** functions (with the CORS fixes)
- Check function logs in Supabase Dashboard for errors
- Verify the function is responding to OPTIONS requests

### Still getting 401 errors?
- Verify `SUPABASE_SERVICE_ROLE_KEY` is available (auto-provided)
- Check that the Authorization header is being sent from the frontend
- Look at function logs to see the exact error message

## Quick Test Commands

Test the functions directly:

```bash
# Test check-subscription (requires auth token)
curl -X OPTIONS https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/check-subscription \
  -H "Origin: https://signal-streamer-ptpskk2ik-chronodat.vercel.app"

# Should return 200 OK with CORS headers
```

## Summary

The errors occur because:
1. **`check-subscription`** doesn't exist on Supabase yet (NEW function)
2. **`customer-portal`** doesn't exist on Supabase yet (NEW function)  
3. **`create-checkout`** exists but needs the updated code deployed

**Fix**: Deploy all three functions to Supabase using the steps above.

