# Quick Start: Stripe Configuration for Checkout

The error "Payment processing is not yet configured" means the Edge Function is missing Stripe secrets. Follow these steps:

## Step 1: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Make sure you're in **Test mode** (toggle in top right)
3. Copy your **Secret key** (starts with `sk_test_...`)

## Step 2: Create Products & Prices in Stripe

1. Go to [Stripe Products](https://dashboard.stripe.com/test/products)
2. Click **"+ Add product"**

### Create PRO Plan:
- **Name**: SignalPulse Pro
- **Description**: Pro plan subscription
- **Pricing**: 
  - **Price**: $19.00
  - **Billing period**: Monthly (recurring)
- Click **Save**
- **Copy the Price ID** (starts with `price_...`)

### Create ELITE Plan:
- **Name**: SignalPulse Elite  
- **Description**: Elite plan subscription
- **Pricing**:
  - **Price**: $49.00
  - **Billing period**: Monthly (recurring)
- Click **Save**
- **Copy the Price ID** (starts with `price_...`)

## Step 3: Add Secrets to Supabase Edge Function

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** → **Secrets**
4. Click **"Add a new secret"** for each:

### Secret 1: STRIPE_SECRET_KEY
- **Name**: `STRIPE_SECRET_KEY`
- **Value**: `sk_test_...` (your Stripe secret key from Step 1)

### Secret 2: STRIPE_PRO_PRICE_ID
- **Name**: `STRIPE_PRO_PRICE_ID`
- **Value**: `price_...` (PRO plan price ID from Step 2)

### Secret 3: STRIPE_ELITE_PRICE_ID
- **Name**: `STRIPE_ELITE_PRICE_ID`
- **Value**: `price_...` (ELITE plan price ID from Step 2)

## Step 4: Verify Edge Function is Deployed

1. Go to **Edge Functions** in Supabase Dashboard
2. Make sure `create-checkout` function exists and shows as **"Active"**
3. If not deployed, run:
   ```bash
   npx supabase functions deploy create-checkout
   ```

## Step 5: Test Again

1. Go back to your billing page
2. Try clicking "Upgrade" again
3. You should now be redirected to Stripe Checkout

## Troubleshooting

### Still getting the error?

1. **Check Edge Function Logs**:
   - Supabase Dashboard → Edge Functions → `create-checkout` → Logs
   - Look for error messages about missing environment variables

2. **Verify Secrets are Set**:
   - Edge Functions → Secrets
   - Make sure all three secrets are listed (STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID, STRIPE_ELITE_PRICE_ID)

3. **Check Secret Names**:
   - Names must be **exactly**: `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_ELITE_PRICE_ID`
   - Case-sensitive!

4. **Redeploy Function** (if you added secrets after deployment):
   ```bash
   npx supabase functions deploy create-checkout
   ```

## Test Cards (Stripe Test Mode)

Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0000 0000 3220`

Use any future expiry date and any 3-digit CVC.

## Next Steps

Once checkout works, you'll also need to:
1. Set up the Stripe webhook (see `BILLING_SETUP.md`)
2. Add `STRIPE_WEBHOOK_SECRET` to Edge Function secrets
3. Configure webhook endpoint in Stripe Dashboard




