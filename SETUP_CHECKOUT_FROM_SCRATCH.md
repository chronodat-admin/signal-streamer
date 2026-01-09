# Setup Checkout From Scratch - Complete Guide

## Step 1: Add ANON_KEY to Edge Function Secrets

The Edge Function needs the anon key to validate user tokens. Add it as a secret:

1. Go to **Supabase Dashboard** → **Edge Functions** → **Secrets**
2. Click **"Add a new secret"**
3. **Name**: `ANON_KEY` (Note: Cannot use `SUPABASE_` prefix)
4. **Value**: Your Supabase anon key (same as `VITE_SUPABASE_PUBLISHABLE_KEY` in your frontend)
   - Find it in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
5. Click **"Add secret"**

## Step 2: Verify All Required Secrets Are Set

Make sure these secrets exist in **Edge Functions → Secrets**:

- ✅ `ANON_KEY` - Your Supabase anon key (NEW - required for token validation)
- ✅ `STRIPE_SECRET_KEY` - Your Stripe secret key (`sk_test_...`)
- ✅ `STRIPE_PRO_PRICE_ID` - PRO plan price ID (`price_...`)
- ✅ `STRIPE_ELITE_PRICE_ID` - ELITE plan price ID (`price_...`)

**Note**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided.

## Step 3: Deploy the Edge Function

```bash
npx supabase functions deploy create-checkout
```

## Step 4: Test

1. Make sure you're signed in
2. Go to the billing page
3. Click "Upgrade to Pro" or "Upgrade to Elite"
4. You should be redirected to Stripe Checkout

## Troubleshooting

### Still getting "Invalid JWT"?

1. **Check Edge Function logs**: Supabase Dashboard → Edge Functions → `create-checkout` → Logs
   - Look for "Auth error:" messages
   - Check if it says "No anon key available"

2. **Verify ANON_KEY is set**:
   - Edge Functions → Secrets
   - Make sure `ANON_KEY` exists and has the correct value

3. **Try signing out and back in**:
   - This will give you a fresh token
   - Then try checkout again

4. **Check frontend environment variables**:
   - Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set
   - These should match your Supabase project

### Getting "Stripe not configured"?

- Make sure `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, and `STRIPE_ELITE_PRICE_ID` are all set in Edge Function secrets

## How It Works

1. Frontend sends request with:
   - `Authorization: Bearer <user_token>` (user's JWT)
   - `apikey: <anon_key>` (Supabase anon key)

2. Edge Function:
   - Uses anon key to validate the user token
   - Creates Stripe checkout session
   - Returns checkout URL

3. Frontend redirects user to Stripe Checkout

This is the standard Supabase pattern for Edge Functions with user authentication.

