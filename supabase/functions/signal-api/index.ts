import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PayloadMapping {
  signal?: string;
  symbol?: string;
  price?: string;
  time?: string;
  interval?: string;
  alertId?: string;
}

interface DefaultValues {
  signal?: string;
  symbol?: string;
  interval?: string;
}

/**
 * Extract a value from a payload using dot notation or simple key
 * Supports: "field", "data.field", "data.nested.field"
 */
function extractValue(payload: Record<string, any>, path: string): any {
  if (!path) return undefined;
  
  // Handle direct field access
  if (payload[path] !== undefined) {
    return payload[path];
  }
  
  // Handle dot notation for nested fields
  const parts = path.split('.');
  let value = payload;
  
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = value[part];
  }
  
  return value;
}

/**
 * Transform an incoming payload using the mapping configuration
 */
function transformPayload(
  payload: Record<string, any>,
  mapping: PayloadMapping,
  defaults: DefaultValues
): {
  signal?: string;
  symbol?: string;
  price?: number;
  time?: string;
  interval?: string;
  alertId?: string;
} {
  return {
    signal: extractValue(payload, mapping.signal || 'signal') || defaults.signal,
    symbol: extractValue(payload, mapping.symbol || 'symbol') || defaults.symbol,
    price: parseFloat(extractValue(payload, mapping.price || 'price')) || undefined,
    time: extractValue(payload, mapping.time || 'time') || new Date().toISOString(),
    interval: extractValue(payload, mapping.interval || 'interval') || defaults.interval,
    alertId: extractValue(payload, mapping.alertId || 'alertId'),
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Only allow POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ 
          error: "Method not allowed",
          message: "Use POST to submit signals",
          docs: "https://docs.signalstreamer.com/api"
        }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract API key from header or query param
    const apiKey = req.headers.get("x-api-key") || 
                   req.headers.get("authorization")?.replace("Bearer ", "") ||
                   new URL(req.url).searchParams.get("api_key");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized",
          message: "API key required. Provide via x-api-key header, Authorization: Bearer <key>, or api_key query param"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Lookup API key
    const { data: apiKeyData, error: keyError } = await supabase
      .from("api_keys")
      .select(`
        id,
        user_id,
        strategy_id,
        name,
        payload_mapping,
        default_values,
        rate_limit_per_minute,
        is_active,
        last_used_at,
        request_count
      `)
      .eq("api_key", apiKey)
      .single();

    if (keyError || !apiKeyData) {
      console.log("Invalid API key:", apiKey.substring(0, 10) + "...");
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apiKeyData.is_active) {
      return new Response(
        JSON.stringify({ error: "API key is disabled" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting check
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: recentRequests } = await supabase
      .from("signals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", apiKeyData.user_id)
      .gte("created_at", oneMinuteAgo);

    if ((recentRequests || 0) >= apiKeyData.rate_limit_per_minute) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          message: `Maximum ${apiKeyData.rate_limit_per_minute} requests per minute`,
          retry_after: 60
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse incoming payload
    const contentType = req.headers.get("content-type") || "";
    let rawPayload: Record<string, any>;

    if (contentType.includes("application/json")) {
      rawPayload = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      rawPayload = Object.fromEntries(formData);
    } else if (contentType.includes("text/plain")) {
      // Try to parse as JSON anyway (some clients don't set correct content type)
      try {
        rawPayload = JSON.parse(await req.text());
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid payload format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ 
          error: "Unsupported content type",
          message: "Use application/json, application/x-www-form-urlencoded, or text/plain"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Received API payload:", JSON.stringify(rawPayload));
    console.log("Using mapping:", JSON.stringify(apiKeyData.payload_mapping));

    // Transform payload using mapping
    const mapping = apiKeyData.payload_mapping || {};
    const defaults = apiKeyData.default_values || {};
    const transformedPayload = transformPayload(rawPayload, mapping, defaults);

    console.log("Transformed payload:", JSON.stringify(transformedPayload));

    // Validate required fields
    const missingFields = [];
    if (!transformedPayload.signal) missingFields.push("signal");
    if (!transformedPayload.symbol) missingFields.push("symbol");
    if (!transformedPayload.price || isNaN(transformedPayload.price)) missingFields.push("price");

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields",
          missing: missingFields,
          message: `Could not extract: ${missingFields.join(", ")}. Check your payload_mapping configuration.`,
          received_payload: rawPayload,
          current_mapping: mapping
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get strategy (use configured strategy_id or find user's default/first strategy)
    let strategyId = apiKeyData.strategy_id;
    
    if (!strategyId) {
      // Find user's first active strategy
      const { data: firstStrategy } = await supabase
        .from("strategies")
        .select("id")
        .eq("user_id", apiKeyData.user_id)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (firstStrategy) {
        strategyId = firstStrategy.id;
      } else {
        return new Response(
          JSON.stringify({ 
            error: "No active strategy found",
            message: "Create a strategy first or link this API key to a specific strategy"
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check for duplicate signals (same symbol, same type, within 5 minutes)
    const signalTypeUpper = transformedPayload.signal!.toUpperCase();
    const isBuyOrLong = signalTypeUpper === "BUY" || signalTypeUpper === "LONG";
    const isSellOrShort = signalTypeUpper === "SELL" || signalTypeUpper === "SHORT";

    if (isBuyOrLong || isSellOrShort) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentSignals } = await supabase
        .from("signals")
        .select("id, signal_type, created_at")
        .eq("strategy_id", strategyId)
        .eq("symbol", transformedPayload.symbol!.toUpperCase())
        .gte("created_at", fiveMinutesAgo);

      if (recentSignals && recentSignals.length > 0) {
        const duplicate = recentSignals.find((s) => {
          const sType = s.signal_type.toUpperCase();
          return (isBuyOrLong && (sType === "BUY" || sType === "LONG")) ||
                 (isSellOrShort && (sType === "SELL" || sType === "SHORT"));
        });

        if (duplicate) {
          return new Response(
            JSON.stringify({ 
              success: true,
              message: `Duplicate ${signalTypeUpper} signal ignored (similar signal exists within 5 minutes)`,
              duplicate_of: duplicate.id
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Insert signal
    const { data: insertedSignal, error: insertError } = await supabase
      .from("signals")
      .insert({
        user_id: apiKeyData.user_id,
        strategy_id: strategyId,
        signal_type: signalTypeUpper,
        symbol: transformedPayload.symbol!.toUpperCase(),
        price: transformedPayload.price,
        signal_time: transformedPayload.time ? new Date(transformedPayload.time).toISOString() : new Date().toISOString(),
        interval: transformedPayload.interval || null,
        raw_payload: rawPayload,
        alert_id: transformedPayload.alertId || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting signal:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store signal" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update API key usage stats
    await supabase
      .from("api_keys")
      .update({
        last_used_at: new Date().toISOString(),
        request_count: (apiKeyData.request_count || 0) + 1
      })
      .eq("id", apiKeyData.id);

    // Trigger alerts asynchronously
    if (insertedSignal?.id) {
      const alertUrl = `${supabaseUrl}/functions/v1/send-alerts`;
      fetch(alertUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          signal_id: insertedSignal.id,
          strategy_id: strategyId,
        }),
      }).catch((error) => {
        console.error("Error triggering alerts:", error);
      });
    }

    console.log("Signal stored successfully via API key:", apiKeyData.name);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Signal received",
        signal_id: insertedSignal?.id,
        processed: {
          signal: signalTypeUpper,
          symbol: transformedPayload.symbol!.toUpperCase(),
          price: transformedPayload.price,
          time: transformedPayload.time
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Signal API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

