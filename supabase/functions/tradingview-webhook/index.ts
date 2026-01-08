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

    // Check for duplicate buy/sell signals (same symbol, same type, within 5 minutes)
    const signalTypeUpper = signal.toUpperCase();
    const isBuyOrLong = signalTypeUpper === "BUY" || signalTypeUpper === "LONG";
    const isSellOrShort = signalTypeUpper === "SELL" || signalTypeUpper === "SHORT";
    
    if (isBuyOrLong || isSellOrShort) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentSignals } = await supabase
        .from("signals")
        .select("id, signal_type, created_at")
        .eq("strategy_id", strategyId)
        .eq("symbol", symbol.toUpperCase())
        .gte("created_at", fiveMinutesAgo)
        .order("created_at", { ascending: false });

      if (recentSignals && recentSignals.length > 0) {
        // Check if there's a recent signal of the same type
        const duplicate = recentSignals.find((s) => {
          const sType = s.signal_type.toUpperCase();
          if (isBuyOrLong) {
            return sType === "BUY" || sType === "LONG";
          } else {
            return sType === "SELL" || sType === "SHORT";
          }
        });

        if (duplicate) {
          console.log(`Duplicate ${signalTypeUpper} signal for ${symbol} within 5 minutes, ignoring`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `Duplicate ${signalTypeUpper} signal ignored (similar signal exists within 5 minutes)` 
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // Basic rate limiting: Check signals in last second
    const oneSecondAgo = new Date(Date.now() - 1000).toISOString();
    const { count: recentCount } = await supabase
      .from("signals")
      .select("*", { count: "exact", head: true })
      .eq("strategy_id", strategyId)
      .gte("created_at", oneSecondAgo);

    // Get user plan for rate limits
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", strategy.user_id)
      .single();

    const plan = profile?.plan || "FREE";
    const rateLimitPerSec = plan === "FREE" ? 1 : plan === "PRO" ? 5 : 20;

    if ((recentCount || 0) >= rateLimitPerSec) {
      console.log(`Rate limit exceeded for strategy ${strategyId}: ${recentCount} requests in last second`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please slow down your requests." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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

    // Get the inserted signal ID to trigger alerts
    const { data: insertedSignal, error: signalFetchError } = await supabase
      .from("signals")
      .select("id")
      .eq("strategy_id", strategyId)
      .eq("signal_type", signal.toUpperCase())
      .eq("symbol", symbol.toUpperCase())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (signalFetchError) {
      console.error("Error fetching inserted signal:", signalFetchError);
    }

    // Trigger alerts asynchronously (don't wait for response)
    if (insertedSignal && insertedSignal.id) {
      const alertUrl = `${supabaseUrl}/functions/v1/send-alerts`;
      console.log(`Triggering alerts for signal ${insertedSignal.id}, strategy ${strategyId}`);
      console.log(`Calling send-alerts at: ${alertUrl}`);
      
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
      })
      .then(async (response) => {
        const text = await response.text();
        console.log(`send-alerts response status: ${response.status}`);
        if (!response.ok) {
          console.error(`send-alerts function returned error: ${response.status} ${response.statusText} - ${text}`);
        } else {
          console.log(`send-alerts function called successfully: ${text.substring(0, 200)}`);
        }
      })
      .catch((error) => {
        console.error("Error triggering alerts:", error);
        console.error("Error details:", error.message, error.stack);
        // Don't fail the webhook if alerts fail
      });
    } else {
      console.warn("No signal ID found, cannot trigger alerts. insertedSignal:", insertedSignal);
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
