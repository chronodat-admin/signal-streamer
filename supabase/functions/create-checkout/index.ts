import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

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
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
    const elitePriceId = Deno.env.get("STRIPE_ELITE_PRICE_ID");

    // Check Stripe configuration
    if (!stripeSecretKey) {
      console.error("Missing STRIPE_SECRET_KEY");
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Please set STRIPE_SECRET_KEY in Edge Function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!proPriceId || !elitePriceId) {
      console.error("Missing price IDs");
      return new Response(
        JSON.stringify({ error: "Stripe price IDs not configured. Please set STRIPE_PRO_PRICE_ID and STRIPE_ELITE_PRICE_ID." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("[create-checkout] Token received, length:", token.length);
    
    // Create Supabase client with service role key
    // We can use service role key to validate user tokens by calling getUser
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("[create-checkout] Validating user token...");
    
    // Validate user token using service role client
    // This works because we're using getUser() which validates the JWT signature
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error("[create-checkout] Auth validation failed:", {
        message: userError.message,
        status: userError.status,
        name: userError.name,
        code: (userError as any).code,
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Invalid or expired token", 
          details: userError.message,
          code: (userError as any).code,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!user) {
      console.error("[create-checkout] No user returned from getUser");
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("[create-checkout] User authenticated:", user.id);

    // Parse request body
    const { plan } = await req.json();

    if (!plan || !["PRO", "ELITE"].includes(plan)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan. Must be PRO or ELITE." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Stripe client
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, plan")
      .eq("user_id", user.id)
      .single();

    if (profile?.plan === plan) {
      return new Response(
        JSON.stringify({ error: `You are already on the ${plan} plan.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Get price ID
    const priceId = plan === "PRO" ? proPriceId : elitePriceId;

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://signal-streamer.vercel.app";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/billing?canceled=true`,
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
      allow_promotion_codes: true,
    });

    console.log(`Created checkout session ${session.id} for user ${user.id}`);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create checkout session" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
