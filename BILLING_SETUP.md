# Billing Setup Guide (Stripe Integration)

## Overview

This guide walks you through setting up Stripe billing for the SignalPulse app.

### Current Status
- ✅ Database ready (`stripe_customer_id`, `stripe_subscription_id` in profiles)
- ✅ Plan types defined (FREE, PRO, ELITE)
- ✅ Pricing page created
- ✅ Billing page (placeholder)
- ❌ Stripe integration
- ❌ Checkout flow
- ❌ Webhook handling

## Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up or log in
3. Complete account setup (business details, bank account)
4. Get your API keys from Developers → API keys:
   - **Publishable key**: `pk_test_...` or `pk_live_...`
   - **Secret key**: `sk_test_...` or `sk_live_...`

## Step 2: Create Products & Prices in Stripe

In Stripe Dashboard → Products, create:

### Product 1: Pro Plan
- **Name**: SignalPulse Pro
- **Price**: $19.00 USD / month (recurring)
- **Price ID**: Copy this (e.g., `price_1234...`)

### Product 2: Elite Plan
- **Name**: SignalPulse Elite
- **Price**: $49.00 USD / month (recurring)
- **Price ID**: Copy this (e.g., `price_5678...`)

## Step 3: Set Environment Variables

### Vercel Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

```
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRO_PRICE_ID=price_1234...
STRIPE_ELITE_PRICE_ID=price_5678...
```

### Supabase Edge Function Secrets
Add in Supabase Dashboard → Edge Functions → Secrets:

```
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRO_PRICE_ID=price_1234...
STRIPE_ELITE_PRICE_ID=price_5678...
```

## Step 4: Create Stripe Checkout Edge Function

Create `supabase/functions/create-checkout/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID")!;
    const elitePriceId = Deno.env.get("STRIPE_ELITE_PRICE_ID")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan } = await req.json();

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);
    }

    // Get price ID based on plan
    const priceId = plan === "PRO" ? proPriceId : elitePriceId;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard/billing?success=true`,
      cancel_url: `${req.headers.get("origin")}/dashboard/billing?canceled=true`,
      metadata: { user_id: user.id, plan },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

## Step 5: Create Stripe Webhook Handler

Create `supabase/functions/stripe-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
  });
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const signature = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  console.log("Received event:", event.type);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan as "PRO" | "ELITE";

      if (userId && plan) {
        // Update user's plan
        await supabase
          .from("profiles")
          .update({
            plan,
            stripe_subscription_id: session.subscription as string,
            plan_expires_at: null, // Will be set by subscription webhook
          })
          .eq("user_id", userId);

        console.log(`User ${userId} upgraded to ${plan}`);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Get user by customer ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profile) {
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        await supabase
          .from("profiles")
          .update({ plan_expires_at: periodEnd })
          .eq("user_id", profile.user_id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Downgrade to FREE
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            plan: "FREE",
            stripe_subscription_id: null,
            plan_expires_at: null,
          })
          .eq("user_id", profile.user_id);

        console.log(`User ${profile.user_id} downgraded to FREE`);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // Handle failed payment - send email, etc.
      console.log("Payment failed for invoice:", invoice.id);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

## Step 6: Deploy Edge Functions

```bash
npx supabase functions deploy create-checkout
npx supabase functions deploy stripe-webhook
```

## Step 7: Configure Stripe Webhook Endpoint

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the webhook signing secret (`whsec_...`)
6. Add it as `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets

## Step 8: Update Frontend

### Update Pricing.tsx

Add checkout functionality:

```typescript
const handleCheckout = async (plan: 'PRO' | 'ELITE') => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Redirect to auth
    navigate('/auth');
    return;
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ plan }),
    }
  );

  const { url, error } = await response.json();
  
  if (error) {
    toast({ title: 'Error', description: error, variant: 'destructive' });
    return;
  }

  // Redirect to Stripe Checkout
  window.location.href = url;
};
```

### Update Billing.tsx

Add subscription management:

```typescript
const handleManageSubscription = async () => {
  // Create Stripe Customer Portal session
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    }
  );

  const { url } = await response.json();
  window.location.href = url;
};
```

## Step 9: Create Customer Portal Edge Function (Optional)

For managing subscriptions (cancel, update payment method):

```typescript
// supabase/functions/create-portal/index.ts
const session = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: `${req.headers.get("origin")}/dashboard/billing`,
});
```

## Testing Checklist

1. [ ] Create Stripe test account
2. [ ] Create test products and prices
3. [ ] Set all environment variables
4. [ ] Deploy edge functions
5. [ ] Configure webhook endpoint
6. [ ] Test checkout flow
7. [ ] Test subscription updates
8. [ ] Test cancellation
9. [ ] Switch to live keys for production

## Test Cards (Stripe Test Mode)

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 3220 | 3D Secure required |

Use any future expiry date and any 3-digit CVC.

## Summary

| Step | Status |
|------|--------|
| 1. Create Stripe Account | ⬜ |
| 2. Create Products/Prices | ⬜ |
| 3. Set Environment Variables | ⬜ |
| 4. Create Checkout Function | ⬜ |
| 5. Create Webhook Handler | ⬜ |
| 6. Deploy Edge Functions | ⬜ |
| 7. Configure Webhook in Stripe | ⬜ |
| 8. Update Frontend | ⬜ |
| 9. Test in Test Mode | ⬜ |
| 10. Switch to Live Keys | ⬜ |





