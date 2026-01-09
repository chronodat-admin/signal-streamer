import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("ANON_KEY"); // Secret name: ANON_KEY (no SUPABASE_ prefix allowed)
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
    const elitePriceId = Deno.env.get("STRIPE_ELITE_PRICE_ID");

    // Validate Stripe config
    if (!stripeSecretKey || !proPriceId || !elitePriceId) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured. Please set STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID, and STRIPE_ELITE_PRICE_ID in Edge Function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Get anon key from header or env
    const apikeyFromHeader = req.headers.get("apikey");
    const anonKey = apikeyFromHeader || supabaseAnonKey;

    if (!anonKey) {
      // Fallback: try to validate with service role (less ideal but might work)
      console.log("No anon key available, using service role for validation");
    }

    // Create client with anon key for token validation (preferred)
    // If no anon key, use service role as fallback
    const authClient = createClient(
      supabaseUrl,
      anonKey || supabaseServiceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Validate user token
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ 
          error: "Authentication failed",
          message: authError?.message || "Invalid token"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let plan: string;
    try {
      const body = await req.json();
      plan = body.plan;
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!plan || !["PRO", "ELITE"].includes(plan)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan. Must be PRO or ELITE." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Get user profile
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

    // Get or create Stripe customer
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);
    }

    // Create checkout session
    const priceId = plan === "PRO" ? proPriceId : elitePriceId;
    const origin = req.headers.get("origin") || "https://signal-streamer.vercel.app";

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

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
