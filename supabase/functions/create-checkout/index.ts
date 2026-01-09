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
    console.log("[create-checkout] Starting request processing...");
    
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
    const elitePriceId = Deno.env.get("STRIPE_ELITE_PRICE_ID");

    console.log("[create-checkout] Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasStripeKey: !!stripeSecretKey,
      hasProPrice: !!proPriceId,
      hasElitePrice: !!elitePriceId,
    });

    // Validate environment variables
    if (!stripeSecretKey) {
      console.error("[create-checkout] Missing STRIPE_SECRET_KEY");
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Please set STRIPE_SECRET_KEY." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!proPriceId || !elitePriceId) {
      console.error("[create-checkout] Missing price IDs");
      return new Response(
        JSON.stringify({ error: "Stripe price IDs not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[create-checkout] Creating Supabase client...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("[create-checkout] Creating Stripe client...");
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    console.log("[create-checkout] Stripe client created successfully");

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    console.log("[create-checkout] Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("[create-checkout] No authorization header");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("[create-checkout] Validating user token...");
    console.log("[create-checkout] Token length:", token.length);
    console.log("[create-checkout] Token preview:", token.substring(0, 50) + "...");
    
    // Create a separate client with the anon key for auth validation
    // This is more reliable for validating user tokens
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    let authClient;
    if (supabaseAnonKey) {
      // Use anon key client for auth (more reliable for user token validation)
      authClient = createClient(supabaseUrl, supabaseAnonKey);
      console.log("[create-checkout] Using anon key for auth validation");
    } else {
      // Fallback to service role client
      authClient = supabase;
      console.log("[create-checkout] Using service role key for auth validation (anon key not set)");
    }
    
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError) {
      console.error("[create-checkout] Auth error details:", {
        message: userError.message,
        status: userError.status,
        name: userError.name,
        code: userError.code,
      });
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized", 
          details: userError.message,
          code: userError.code || userError.status,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!user) {
      console.error("[create-checkout] No user returned from getUser");
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "No user found for token" }),
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

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, plan")
      .eq("user_id", user.id)
      .single();

    // Check if already on this plan
    if (profile?.plan === plan) {
      return new Response(
        JSON.stringify({ error: `You are already on the ${plan} plan.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);

      console.log(`Created Stripe customer ${customerId} for user ${user.id}`);
    }

    // Get price ID based on plan
    const priceId = plan === "PRO" ? proPriceId : elitePriceId;

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://signal-streamer.vercel.app";
    
    // Use session_id in success URL so we can verify it later
    // This ensures we can sync even if query params are lost
    const successUrl = `${origin}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/dashboard/billing?canceled=true`;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
        },
      },
      allow_promotion_codes: true,
    });

    console.log(`Created checkout session ${session.id} for user ${user.id}, plan ${plan}`);

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

