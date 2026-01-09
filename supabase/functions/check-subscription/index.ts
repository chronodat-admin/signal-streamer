import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map Stripe product IDs to plan types
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_Tkzuk0NeshkOAM": "PRO",
  "prod_TkzvPzWPAd8jYf": "ELITE",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, user is on FREE plan");
      
      // Update profile to FREE
      await supabaseClient
        .from("profiles")
        .update({ 
          plan: "FREE", 
          stripe_customer_id: null,
          stripe_subscription_id: null,
          plan_expires_at: null 
        })
        .eq("user_id", user.id);
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: "FREE",
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found");
      
      // Update profile to FREE
      await supabaseClient
        .from("profiles")
        .update({ 
          plan: "FREE", 
          stripe_customer_id: customerId,
          stripe_subscription_id: null,
          plan_expires_at: null 
        })
        .eq("user_id", user.id);
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: "FREE",
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    logStep("Raw subscription data", { 
      id: subscription.id,
      current_period_end: subscription.current_period_end,
      items: subscription.items?.data?.length 
    });

    // Safely handle the subscription end date
    let subscriptionEnd: string | null = null;
    if (subscription.current_period_end) {
      try {
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      } catch (e) {
        logStep("Failed to parse subscription end date", { current_period_end: subscription.current_period_end });
      }
    }

    // Safely get product ID
    const priceItem = subscription.items?.data?.[0];
    const productId = (priceItem?.price?.product as string) || "";
    const plan = PRODUCT_TO_PLAN[productId] || "PRO";
    
    logStep("Active subscription found", { 
      subscriptionId: subscription.id, 
      productId,
      plan,
      endDate: subscriptionEnd 
    });

    // Update profile with subscription info
    await supabaseClient
      .from("profiles")
      .update({ 
        plan: plan,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        plan_expires_at: subscriptionEnd
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({
      subscribed: true,
      plan: plan,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

