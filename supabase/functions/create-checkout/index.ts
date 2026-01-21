import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { 
  corsHeaders, 
  handleCors, 
  getClientIP, 
  getGeoLocation, 
  createLocationSummary,
  createAuditLogger 
} from "../_shared/index.ts";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCors();
  }

  try {
    logStep("Function started");

    // Get client IP and location early for logging
    const clientIP = getClientIP(req);
    logStep("Client IP detected", { ip: clientIP });

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

    // Get user's geolocation (non-blocking, we'll log it after checkout creation)
    const geoPromise = getGeoLocation(clientIP);

    const body = await req.json();
    let priceId: string;
    
    // Support both priceId (new) and plan (legacy)
    if (body.priceId) {
      priceId = body.priceId;
    } else if (body.plan) {
      // Map plan to price ID using environment variables
      const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
      const elitePriceId = Deno.env.get("STRIPE_ELITE_PRICE_ID");
      
      if (body.plan === "PRO" && proPriceId) {
        priceId = proPriceId;
      } else if (body.plan === "ELITE" && elitePriceId) {
        priceId = elitePriceId;
      } else {
        throw new Error(`Price ID not configured for plan: ${body.plan}`);
      }
    } else {
      throw new Error("Either priceId or plan is required");
    }
    
    logStep("Price ID determined", { priceId, plan: body.plan });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://trademoq.com";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard/billing?success=true`,
      cancel_url: `${origin}/dashboard/billing?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Log the checkout attempt with geolocation (async, don't block response)
    geoPromise.then(async (geoResult) => {
      const locationSummary = createLocationSummary(geoResult.data);
      logStep("User location", locationSummary);
      
      // Log audit event with location
      const auditLogger = createAuditLogger(supabaseClient);
      await auditLogger.log({
        req,
        userId: user.id,
        eventType: "SUBSCRIPTION_CREATED",
        metadata: {
          checkout_session_id: session.id,
          price_id: priceId,
          location: locationSummary,
        },
        includeLocation: false, // Already have it
      });
    }).catch((err) => {
      console.error("[CREATE-CHECKOUT] Geolocation/audit logging failed:", err);
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
