import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateStrategyDescription } from "../_shared/openai.ts";

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
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    // Create authenticated client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "AI features are not configured. Please contact support." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      strategyName,
      totalTrades,
      winRate,
      profitFactor,
      avgPnlPercent,
      topSymbols,
      signalTypes,
      exchange,
      timeframe,
    } = body;

    // Validate required fields
    if (!strategyName || totalTrades === undefined || winRate === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: strategyName, totalTrades, winRate" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (totalTrades < 5) {
      return new Response(
        JSON.stringify({ error: "Need at least 5 trades to generate a description" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating AI description for strategy: ${strategyName}`);

    // Generate description using OpenAI
    const description = await generateStrategyDescription(
      {
        strategyName,
        exchange,
        timeframe,
        totalTrades,
        winRate,
        profitFactor: profitFactor || 0,
        avgPnlPercent: avgPnlPercent || 0,
        topSymbols: topSymbols || [],
        signalTypes: signalTypes || { buys: 0, sells: 0 },
      },
      openaiApiKey
    );

    if (!description) {
      return new Response(
        JSON.stringify({ error: "Failed to generate description. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`AI description generated successfully`);

    return new Response(
      JSON.stringify({ description }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI generation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
