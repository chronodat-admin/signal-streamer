import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";

serve(async (req) => {
  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!stripeSecretKey || !webhookSecret) {
      console.error("Stripe environment variables not configured");
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No stripe-signature header");
      return new Response(
        JSON.stringify({ error: "No signature" }),
        { status: 400 }
      );
    }

    // Get raw body
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400 }
      );
    }

    console.log(`Received Stripe event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan as "PRO" | "ELITE";

        if (userId && plan) {
          console.log(`Checkout completed for user ${userId}, plan ${plan}`);

          // Update user's plan
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              plan,
              stripe_subscription_id: session.subscription as string,
            })
            .eq("user_id", userId);

          if (updateError) {
            console.error("Error updating profile:", updateError);
          } else {
            console.log(`User ${userId} upgraded to ${plan}`);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`Subscription ${event.type} for customer ${customerId}`);

        // Get user by Stripe customer ID
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profileError || !profile) {
          console.error("Profile not found for customer:", customerId);
          break;
        }

        // Get plan from subscription metadata or price
        let plan: "PRO" | "ELITE" | null = subscription.metadata?.plan as "PRO" | "ELITE" | null;

        // If no plan in metadata, determine from price
        if (!plan && subscription.items.data.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
          const elitePriceId = Deno.env.get("STRIPE_ELITE_PRICE_ID");
          
          if (priceId === proPriceId) plan = "PRO";
          else if (priceId === elitePriceId) plan = "ELITE";
        }

        // Update plan and expiry
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        const status = subscription.status;

        if (status === "active" || status === "trialing") {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              plan: plan || undefined,
              stripe_subscription_id: subscription.id,
              plan_expires_at: periodEnd,
            })
            .eq("user_id", profile.user_id);

          if (updateError) {
            console.error("Error updating subscription:", updateError);
          } else {
            console.log(`Updated subscription for user ${profile.user_id}, expires ${periodEnd}`);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`Subscription deleted for customer ${customerId}`);

        // Get user by Stripe customer ID
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profileError || !profile) {
          console.error("Profile not found for customer:", customerId);
          break;
        }

        // Downgrade to FREE
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            plan: "FREE",
            stripe_subscription_id: null,
            plan_expires_at: null,
          })
          .eq("user_id", profile.user_id);

        if (updateError) {
          console.error("Error downgrading user:", updateError);
        } else {
          console.log(`User ${profile.user_id} downgraded to FREE`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        // Could send a thank you email here
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(`Payment failed for invoice ${invoice.id}, customer ${customerId}`);

        // Get user by Stripe customer ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          // Could send a payment failed notification here
          console.log(`Payment failed for user ${profile.user_id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Webhook handler failed" }),
      { status: 500 }
    );
  }
});

