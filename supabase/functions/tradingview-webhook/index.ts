import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload));

    const { token, strategyId, signal, symbol, price, time, interval, alertId } = payload;

    if (!token || !strategyId || !signal || !symbol || !price || !time) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: token, strategyId, signal, symbol, price, time" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify strategy and token
    const { data: strategy, error: strategyError } = await supabase
      .from("strategies")
      .select("id, user_id, name, is_deleted, secret_token")
      .eq("id", strategyId)
      .single();

    if (strategyError || !strategy) {
      console.log("Strategy not found:", strategyId);
      return new Response(JSON.stringify({ error: "Strategy not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (strategy.secret_token !== token) {
      console.log("Invalid token for strategy:", strategyId);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (strategy.is_deleted) {
      return new Response(JSON.stringify({ error: "Strategy has been deleted" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for duplicate if alertId provided
    if (alertId) {
      const { data: existing } = await supabase
        .from("signals")
        .select("id")
        .eq("strategy_id", strategyId)
        .eq("alert_id", alertId)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ success: true, message: "Duplicate signal ignored" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Insert signal
    const { error: insertError } = await supabase.from("signals").insert({
      user_id: strategy.user_id,
      strategy_id: strategyId,
      signal_type: signal.toUpperCase(),
      symbol: symbol.toUpperCase(),
      price: parseFloat(price),
      signal_time: new Date(time).toISOString(),
      interval: interval || null,
      raw_payload: payload,
      alert_id: alertId || null,
    });

    if (insertError) {
      console.error("Error inserting signal:", insertError);
      return new Response(JSON.stringify({ error: "Failed to store signal" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Signal stored successfully for strategy:", strategy.name);

    return new Response(JSON.stringify({ success: true, message: "Signal received" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
