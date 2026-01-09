# Troubleshooting: Plan Not Updating After Stripe Upgrade

## Problem
Plans are getting active in Stripe, but the plan is not updating in the billing page.

## Quick Checks

### 1. Verify Webhook is Receiving Events

**Check Supabase Edge Function Logs:**
1. Go to Supabase Dashboard → Edge Functions → `stripe-webhook` → Logs
2. Look for events like:
   - `Received Stripe event: checkout.session.completed`
   - `Received Stripe event: customer.subscription.created`
   - `Received Stripe event: customer.subscription.updated`

**If no events appear:**
- The webhook URL might not be configured in Stripe
- See "Configure Stripe Webhook" section below

### 2. Check for Errors in Webhook Logs

Look for these error messages:
- `Error updating profile after checkout`
- `Error updating subscription via RPC`
- `Profile not found for customer`
- `Could not determine plan for subscription`

### 3. Verify Environment Variables

The webhook needs these environment variables in Supabase:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret from Stripe
- `STRIPE_PRO_PRICE_ID` - Price ID for PRO plan
- `STRIPE_ELITE_PRICE_ID` - Price ID for ELITE plan

**To check:**
1. Supabase Dashboard → Edge Functions → `stripe-webhook` → Settings → Secrets
2. Verify all variables are set

## Common Issues and Fixes

### Issue 1: Webhook Not Configured in Stripe

**Symptoms:**
- No events in Supabase logs
- Plans active in Stripe but never update

**Fix:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint" or edit existing endpoint
3. Endpoint URL: `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the "Signing secret" and add it to Supabase as `STRIPE_WEBHOOK_SECRET`

### Issue 2: Plan Cannot Be Determined

**Symptoms:**
- Logs show: `Could not determine plan for subscription`
- Subscription info updates but plan stays FREE

**Causes:**
- Price IDs don't match between checkout and webhook
- Subscription metadata doesn't include plan
- Environment variables `STRIPE_PRO_PRICE_ID` or `STRIPE_ELITE_PRICE_ID` are incorrect

**Fix:**
1. Check that price IDs in Supabase match Stripe:
   - Stripe Dashboard → Products → Check Price IDs
   - Compare with `STRIPE_PRO_PRICE_ID` and `STRIPE_ELITE_PRICE_ID` in Supabase
2. Verify checkout session includes plan in metadata (already configured in `create-checkout` function)
3. Check webhook logs for: `Determining plan from price ID: ...`

### Issue 3: RLS Blocking Updates

**Symptoms:**
- Logs show: `Error updating profile after checkout` with permission error
- RPC function errors

**Fix:**
- The webhook now uses `update_user_plan` RPC function which bypasses RLS
- If still failing, check that migration `20260109040000_create_update_plan_function.sql` has been applied
- Verify function exists: Run in Supabase SQL Editor:
  ```sql
  SELECT proname FROM pg_proc WHERE proname = 'update_user_plan';
  ```

### Issue 4: Database Migration Not Applied

**Symptoms:**
- RPC function errors: `function update_user_plan does not exist`

**Fix:**
1. Apply the migration:
   ```sql
   -- Run in Supabase SQL Editor
   -- Copy contents from supabase/migrations/20260109040000_create_update_plan_function.sql
   ```
2. Or use Supabase CLI:
   ```bash
   npx supabase db push
   ```

## Manual Plan Update (Emergency Fix)

If webhook is not working, you can manually update a user's plan:

**Using Supabase SQL Editor:**
```sql
-- Update plan for a specific user
SELECT public.update_user_plan(
  'user-uuid-here'::uuid,
  'PRO'::plan_type,
  'sub_stripe_subscription_id'::text,
  '2025-02-01T00:00:00Z'::timestamptz
);
```

**Or direct update (bypasses RLS with service role):**
```sql
UPDATE public.profiles
SET 
  plan = 'PRO',
  stripe_subscription_id = 'sub_xxx',
  plan_expires_at = '2025-02-01T00:00:00Z',
  updated_at = now()
WHERE user_id = 'user-uuid-here';
```

## Testing the Webhook

### Test with Stripe CLI

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward events to local webhook:
   ```bash
   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
   ```
4. Trigger test event:
   ```bash
   stripe trigger checkout.session.completed
   ```

### Test with cURL

```bash
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook \
  -H "stripe-signature: <signature>" \
  -H "Content-Type: application/json" \
  -d '<stripe-event-json>'
```

## Debugging Steps

1. **Check Webhook Logs:**
   - Supabase Dashboard → Edge Functions → `stripe-webhook` → Logs
   - Look for detailed console.log messages

2. **Check Database:**
   ```sql
   -- Check user's current plan
   SELECT user_id, plan, stripe_customer_id, stripe_subscription_id, plan_expires_at
   FROM public.profiles
   WHERE user_id = 'user-uuid-here';
   ```

3. **Check Stripe Dashboard:**
   - Verify subscription is active
   - Check subscription metadata includes `plan` and `user_id`
   - Verify webhook events are being sent (Webhooks → Events)

4. **Check Frontend:**
   - Open browser console on billing page
   - Look for realtime subscription messages
   - Check for polling attempts in network tab

## Expected Flow

1. User completes checkout → Stripe sends `checkout.session.completed`
2. Webhook receives event → Updates plan via RPC function
3. Database updated → Realtime subscription triggers
4. Frontend receives update → Plan badge and billing page refresh

## Still Not Working?

1. **Check all logs** (Supabase Edge Functions, Stripe Dashboard, Browser Console)
2. **Verify migrations applied** (especially `20260109040000_create_update_plan_function.sql`)
3. **Test webhook manually** using Stripe CLI
4. **Check RLS policies** haven't changed
5. **Verify service role key** is correct in Supabase Edge Function secrets

## Quick Diagnostic Checklist

Run through this checklist in order:

### 1. Check if migrations are applied
```sql
-- Run in Supabase SQL Editor
SELECT proname FROM pg_proc WHERE proname LIKE 'update_user_plan%';
```
You should see:
- `update_user_plan`
- `update_user_plan_by_customer`

### 2. Check if webhook is registered in Stripe
1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Look for your endpoint URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
3. Check "Recent events" - you should see `checkout.session.completed` events

### 3. Check webhook signing secret
1. In Stripe Dashboard > Webhooks > Click your endpoint
2. Click "Reveal" next to "Signing secret"
3. Compare with `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets

### 4. Check Edge Function logs after a checkout
1. Complete a test checkout
2. Immediately go to Supabase Dashboard > Edge Functions > `stripe-webhook` > Logs
3. Look for:
   - `[checkout.session.completed] Processing:` - Webhook received
   - `Direct update succeeded` - Update worked
   - Any errors in red

### 5. Manual profile check
```sql
-- Check your profile after checkout
SELECT user_id, plan, stripe_customer_id, stripe_subscription_id, updated_at
FROM public.profiles
WHERE email = 'your-email@example.com';
```

## Common Root Causes (in order of likelihood)

1. **Webhook not registered** - Most common. Set up webhook in Stripe Dashboard.
2. **Wrong webhook secret** - Copy from Stripe Dashboard, not from Stripe CLI.
3. **Migrations not applied** - Run `npx supabase db push` or apply SQL manually.
4. **Environment variables missing** - Check all required vars are set in Supabase.

## Related Files

- Webhook handler: `supabase/functions/stripe-webhook/index.ts`
- Database function: `supabase/migrations/20260109040000_create_update_plan_function.sql`
- Permissions fix: `supabase/migrations/20260109050000_fix_update_plan_permissions.sql`
- Checkout creation: `supabase/functions/create-checkout/index.ts`
- Sync function: `supabase/functions/sync-subscription/index.ts`
- Billing page: `src/pages/Billing.tsx`

