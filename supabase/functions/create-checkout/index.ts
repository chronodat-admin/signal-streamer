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
    
    // Get anon key from request header (client sends it)
    // This is the correct way to validate user tokens
    const apikeyHeader = req.headers.get("apikey");
    const anonKey = apikeyHeader || Deno.env.get("SUPABASE_ANON_KEY") || supabaseServiceKey;
    
    console.log("Validating token with:", apikeyHeader ? "apikey header" : "env/service_role");
    
    // Create Supabase client with anon key for user token validation
    // Service role key can't properly validate user JWTs
    const authClient = createClient(supabaseUrl, anonKey);
    
    // Validate user token
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError) {
      console.error("Auth validation failed:", {
        message: userError.message,
        status: userError.status,
        name: userError.name,
      });
      
      // Provide helpful error message
      let errorMsg = "Invalid or expired token";
      if (userError.message?.includes("JWT")) {
        errorMsg = "Your session has expired. Please sign in again.";
      } else if (userError.message) {
        errorMsg = userError.message;
      }
      
      return new Response(
        JSON.stringify({ error: errorMsg, details: userError.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
