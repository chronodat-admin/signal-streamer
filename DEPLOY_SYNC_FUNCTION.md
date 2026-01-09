# Deploy sync-subscription Function

## Quick Deploy via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/ogcnilkuneeqkhmoamxi/functions

2. **Create New Function:**
   - Click "Create Function" or "New Function"
   - Function name: `sync-subscription` (exactly this, lowercase with hyphen)

3. **Copy and Paste Code:**
   - Open the file: `supabase/functions/sync-subscription/index.ts`
   - Copy ALL the code (Ctrl+A, Ctrl+C)
   - Paste into the Supabase Dashboard editor

4. **Set Environment Variables (Secrets):**
   - Go to Edge Functions → Settings → Secrets
   - Make sure these are set:
     - `STRIPE_SECRET_KEY` - Your Stripe secret key
     - `STRIPE_PRO_PRICE_ID` - PRO plan price ID
     - `STRIPE_ELITE_PRICE_ID` - ELITE plan price ID
   - Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-provided

5. **Deploy:**
   - Click "Deploy" button
   - Function will be live in ~30 seconds

## Verify Deployment

After deployment, the function will be available at:
```
https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/sync-subscription
```

## Test the Function

You can test it from the billing page by clicking "Sync Subscription Status" button.

## Alternative: CLI Deployment (if you have access token)

If you have a Supabase access token:

```bash
# Set the access token
set SUPABASE_ACCESS_TOKEN=your_token_here

# Deploy
npx supabase functions deploy sync-subscription
```

## What This Function Does

- Checks Stripe for active subscriptions for the current user
- Updates the plan in the database if a subscription exists
- Works even if webhooks haven't fired yet
- Provides manual sync option when automatic updates fail



