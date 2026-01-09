# Fix Checkout Error: "Failed to send a request to the Edge Function"

If you're seeing the error "Failed to send a request to the Edge Function" when trying to upgrade, follow these steps:

## Step 1: Verify Edge Function is Deployed

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions**
4. Check if `create-checkout` function exists and is deployed

If it doesn't exist or isn't deployed, proceed to Step 2.

## Step 2: Deploy the Edge Function

### Option A: Using Supabase CLI

```bash
# Make sure you're logged in
npx supabase login

# Link your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
npx supabase functions deploy create-checkout
```

### Option B: Using Supabase Dashboard

1. Go to **Edge Functions** in Supabase Dashboard
2. Click **Create a new function**
3. Name it `create-checkout`
4. Copy the contents from `supabase/functions/create-checkout/index.ts`
5. Click **Deploy**

## Step 3: Set Environment Variables (Secrets)

The Edge Function needs these secrets to work:

1. Go to **Edge Functions** → **Secrets** in Supabase Dashboard
2. Add the following secrets:

```
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_ELITE_PRICE_ID=price_xxxxx
```

**Note:** The function automatically gets:
- `SUPABASE_URL` (auto-provided)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-provided)

## Step 4: Verify Function is Accessible

Test the function directly:

```bash
# Get your access token
npx supabase functions list

# Test the function (replace YOUR_ACCESS_TOKEN)
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-checkout' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"plan": "PRO"}'
```

## Step 5: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try to upgrade again
4. Look for detailed error messages
5. Check **Network** tab for the function request

## Common Issues

### Issue: Function returns 404
**Solution:** Function is not deployed. Deploy it using Step 2.

### Issue: Function returns 500
**Solution:** Check Edge Function logs in Supabase Dashboard and verify all secrets are set.

### Issue: "Unauthorized" error
**Solution:** Make sure you're logged in and the session is valid.

### Issue: "Stripe is not configured"
**Solution:** Add `STRIPE_SECRET_KEY` secret in Edge Functions.

### Issue: "Stripe price IDs not configured"
**Solution:** Add `STRIPE_PRO_PRICE_ID` and `STRIPE_ELITE_PRICE_ID` secrets.

## Step 6: Check Function Logs

1. Go to **Edge Functions** → `create-checkout` → **Logs**
2. Look for error messages
3. Common errors:
   - Missing environment variables
   - Stripe API errors
   - Database connection issues

## Quick Test

After deploying, test from the Pricing page:
1. Make sure you're logged in
2. Click "Upgrade" on Pro or Elite plan
3. You should be redirected to Stripe checkout

If it still fails, check the browser console for the exact error message.

## Alternative: Use Billing Page

If the Pricing page checkout doesn't work, you can also upgrade from:
- `/dashboard/billing` - This page has the same checkout functionality



