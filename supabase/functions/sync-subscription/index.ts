import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
    const elitePriceId = Deno.env.get("STRIPE_ELITE_PRICE_ID");

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id, plan")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no customer ID, nothing to sync
    if (!profile.stripe_customer_id) {
      return new Response(
        JSON.stringify({ 
          message: "No Stripe customer found",
          plan: profile.plan 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription - check if we should downgrade
      if (profile.plan !== "FREE") {
        // Use RPC to update
        await supabase.rpc("update_user_plan", {
          p_user_id: user.id,
          p_plan: "FREE",
          p_stripe_subscription_id: null,
          p_plan_expires_at: null,
        });
      }

      return new Response(
        JSON.stringify({ 
          message: "No active subscription found",
          plan: "FREE",
          updated: profile.plan !== "FREE"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subscription = subscriptions.data[0];
    
    // Determine plan from subscription
    let plan: "PRO" | "ELITE" | null = subscription.metadata?.plan as "PRO" | "ELITE" | null;

    if (!plan && subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id;
      if (priceId === proPriceId) plan = "PRO";
      else if (priceId === elitePriceId) plan = "ELITE";
    }

    if (!plan) {
      // Try to get from price details
      try {
        if (subscription.items.data.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          const price = await stripe.prices.retrieve(priceId);
          if (price.metadata?.plan) {
            plan = price.metadata.plan as "PRO" | "ELITE";
          }
        }
      } catch (error) {
        console.error("Error retrieving price:", error);
      }
    }

    if (!plan) {
      return new Response(
        JSON.stringify({ 
          error: "Could not determine plan from subscription",
          subscription_id: subscription.id,
          current_plan: profile.plan
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update plan
    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const { error: updateError } = await supabase.rpc("update_user_plan", {
      p_user_id: user.id,
      p_plan: plan,
      p_stripe_subscription_id: subscription.id,
      p_plan_expires_at: periodEnd,
    });

    if (updateError) {
      console.error("Error updating plan:", updateError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to update plan",
          details: updateError.message
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: "Subscription synced successfully",
        plan,
        subscription_id: subscription.id,
        expires_at: periodEnd,
        updated: true
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to sync subscription" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

