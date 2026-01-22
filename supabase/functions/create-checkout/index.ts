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
import { createErrorLogger } from "../_shared/error-logger.ts";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCors();
  }

  // Store these for error logging
  let supabaseClient: ReturnType<typeof createClient> | null = null;
  let userId: string | undefined;
  let requestBody: unknown = null;

  try {
    logStep("Function started");

    // Get client IP and location early for logging
    const clientIP = getClientIP(req);
    logStep("Client IP detected", { ip: clientIP });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check for Authorization header (case-insensitive)
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader) {
      logStep("Missing authorization header", { 
        headers: Object.fromEntries(req.headers.entries())
      });
      throw new Error("No authorization header provided");
    }
    
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      logStep("Invalid authorization header format", { header: authHeader.substring(0, 20) + "..." });
      throw new Error("Invalid authorization header format");
    }
    
    // Validate token format (JWT should have 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      logStep("Invalid JWT format", { parts: tokenParts.length, tokenPreview: token.substring(0, 20) + "..." });
      throw new Error("Invalid JWT token format");
    }
    
    logStep("Verifying token", { tokenLength: token.length, tokenPreview: token.substring(0, 20) + "..." });
    
    // Try to get user with the token
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      logStep("Token verification failed", { 
        error: userError.message,
        errorName: userError.name,
        status: userError.status
      });
      
      // Provide more specific error messages
      if (userError.message.includes('JWT') || userError.message.includes('expired')) {
        throw new Error("Your session has expired. Please sign in again.");
      } else if (userError.message.includes('Invalid')) {
        throw new Error("Invalid authentication token. Please sign in again.");
      } else {
        throw new Error(`Authentication error: ${userError.message}`);
      }
    }
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    userId = user.id;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's geolocation (non-blocking, we'll log it after checkout creation)
    const geoPromise = getGeoLocation(clientIP);

    requestBody = await req.json();
    const body = requestBody as { priceId?: string; plan?: string };
    let priceId: string;
    let expectedPlan: 'PRO' | 'ELITE' | null = null;
    let productId: string | null = null;
    let productName: string | null = null;
    
    // Always use database as source of truth for price IDs
    if (body.plan) {
      // Plan provided - get price ID from database
      expectedPlan = body.plan as 'PRO' | 'ELITE';
      
      const { data: planData, error: planError } = await supabaseClient
        .from('subscription_plans')
        .select('stripe_price_id, stripe_product_id, name')
        .eq('plan_type', body.plan)
        .not('stripe_price_id', 'is', null)
        .single();
      
      if (planError || !planData?.stripe_price_id) {
        logStep("ERROR: Plan not found in database or missing price ID", { 
          plan: body.plan, 
          error: planError?.message,
          hasPriceId: !!planData?.stripe_price_id
        });
        throw new Error(`Price ID not found in database for plan: ${body.plan}. Please configure stripe_price_id in subscription_plans table.`);
      }
      
      priceId = planData.stripe_price_id;
      productId = planData.stripe_product_id;
      productName = planData.name;
      
      logStep("Using price ID from database", { 
        plan: body.plan, 
        priceId,
        productId,
        productName
      });
    } else if (body.priceId) {
      // Price ID provided - validate it against database
      priceId = body.priceId;
      
      const { data: plans, error: plansError } = await supabaseClient
        .from('subscription_plans')
        .select('plan_type, stripe_price_id, stripe_product_id, name')
        .in('plan_type', ['PRO', 'ELITE'])
        .not('stripe_price_id', 'is', null);
      
      if (!plansError && plans && plans.length > 0) {
        const matchingPlan = plans.find(p => p.stripe_price_id === priceId);
        if (matchingPlan) {
          expectedPlan = matchingPlan.plan_type as 'PRO' | 'ELITE';
          productId = matchingPlan.stripe_product_id;
          productName = matchingPlan.name;
          logStep("Price ID validated against database", { 
            priceId, 
            plan: expectedPlan,
            productId,
            productName
          });
        } else {
          logStep("WARNING: Price ID not found in database", { priceId });
          throw new Error(`Price ID ${priceId} not found in database. Please use a valid price ID from subscription_plans table.`);
        }
      } else {
        throw new Error("Unable to validate price ID. Database query failed.");
      }
    } else {
      throw new Error("Either priceId or plan is required");
    }
    
    logStep("Final price ID determined", { 
      priceId, 
      plan: expectedPlan || body.plan,
      productId,
      productName
    });

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
        plan: expectedPlan || body.plan || 'unknown',
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
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logStep("ERROR in create-checkout", { message: errorMessage, stack: errorStack });
    
    // Try to log the error to the database (non-blocking)
    if (supabaseClient) {
      try {
        const errorLogger = createErrorLogger(supabaseClient);
        
        errorLogger.logAsync({
          req,
          userId: userId || undefined,
          errorType: 'edge_function',
          severity: 'error',
          source: 'create-checkout',
          message: 'Failed to create checkout session',
          error: error instanceof Error ? error : new Error(errorMessage),
          requestBody: requestBody,
          responseStatus: 500,
          metadata: {
            error_message: errorMessage,
            error_stack: errorStack,
          },
        });
      } catch (logError) {
        console.error("[CREATE-CHECKOUT] Failed to log error to database:", logError);
      }
    }
    
    // Provide user-friendly error messages for common issues
    let userMessage = errorMessage;
    if (errorMessage.includes("STRIPE_SECRET_KEY is not set")) {
      userMessage = "Payment processing is not configured. Please contact support.";
    } else if (errorMessage.includes("Price ID not configured")) {
      userMessage = "The selected plan is not available. Please contact support.";
    } else if (errorMessage.includes("Authentication error") || errorMessage.includes("No authorization header")) {
      userMessage = "Please sign in to continue.";
    } else if (errorMessage.includes("No such price")) {
      userMessage = "Invalid pricing configuration. Please contact support.";
    }
    
    return new Response(JSON.stringify({ 
      error: userMessage,
      details: errorMessage, // Include original error for debugging
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
