# Fix Webhook 500 Error

The `stripe-webhook` function is returning a 500 error. Here's how to fix it:

## Step 1: Check Edge Function Logs

1. Go to Supabase Dashboard → Edge Functions → `stripe-webhook` → Logs
2. Look for error messages that will tell you exactly what's missing

## Step 2: Verify Required Secrets

The webhook function needs these secrets in Supabase:

### Required:
- ✅ `STRIPE_SECRET_KEY` - Your Stripe API secret key (`sk_test_...` or `sk_live_...`)
- ✅ `STRIPE_WEBHOOK_SECRET` - Webhook signing secret from Stripe (`whsec_...`)

### Recommended (for plan detection):
- `STRIPE_PRO_PRICE_ID` - Price ID for PRO plan
- `STRIPE_ELITE_PRICE_ID` - Price ID for ELITE plan

## Step 3: Get Webhook Signing Secret from Stripe

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Find your webhook endpoint (or create one):
   - **Endpoint URL**: `https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/stripe-webhook`
3. Click on the webhook endpoint
4. In the "Signing secret" section, click **"Reveal"** or **"Click to reveal"**
5. Copy the secret (starts with `whsec_...`)

## Step 4: Add Secret to Supabase

1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Click **"Add a new secret"**
3. **Name**: `STRIPE_WEBHOOK_SECRET`
4. **Value**: `whsec_...` (the signing secret from Step 3)
5. Click **"Add secret"**

## Step 5: Redeploy Webhook Function

After adding secrets, redeploy the function:

```bash
npx supabase functions deploy stripe-webhook
```

Or use the Supabase Dashboard:
1. Go to Edge Functions → `stripe-webhook`
2. Click **"Redeploy"** or make a small change and save

## Step 6: Test the Webhook

1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select an event type (e.g., `checkout.session.completed`)
5. Check Supabase logs to see if it processes successfully

## Common Issues

### Issue: "Missing STRIPE_WEBHOOK_SECRET"

**Solution**: Add the webhook signing secret from Stripe Dashboard → Webhooks → Your endpoint → Signing secret

### Issue: "Webhook signature verification failed"

**Causes**:
- Wrong webhook secret (make sure you're using the signing secret, not the API key)
- Webhook endpoint URL mismatch
- Body was modified before verification

**Solution**:
1. Verify the webhook secret matches what's in Stripe
2. Make sure the webhook URL in Stripe matches: `https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/stripe-webhook`
3. Don't modify the request body before signature verification

### Issue: "Stripe not configured"

**Solution**: Make sure both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set in Supabase Edge Function secrets

## Verify It's Working

After fixing, check the logs:
1. Supabase Dashboard → Edge Functions → `stripe-webhook` → Logs
2. You should see: `[stripe-webhook] Environment check: { hasStripeKey: true, hasWebhookSecret: true, ... }`
3. When Stripe sends events, you should see: `Received Stripe event: checkout.session.completed`





