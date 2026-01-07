import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertPayload {
  signal_type: string;
  symbol: string;
  price: number;
  signal_time: string;
  strategy_name: string;
  strategy_id: string;
}

// Discord webhook format
async function sendDiscordAlert(webhookUrl: string, payload: AlertPayload): Promise<boolean> {
  const color = payload.signal_type.toUpperCase() === "BUY" || payload.signal_type.toUpperCase() === "LONG" 
    ? 0x22c55e // Green
    : 0xef4444; // Red

  const embed = {
    title: `${payload.signal_type.toUpperCase()} Signal: ${payload.symbol}`,
    description: `**Strategy:** ${payload.strategy_name}\n**Price:** $${payload.price.toFixed(2)}\n**Time:** ${new Date(payload.signal_time).toLocaleString()}`,
    color: color,
    timestamp: payload.signal_time,
    footer: {
      text: "SignalPulse Trading Signals",
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    return response.ok;
  } catch (error) {
    console.error("Discord alert error:", error);
    return false;
  }
}

// Slack webhook format
async function sendSlackAlert(webhookUrl: string, payload: AlertPayload): Promise<boolean> {
  const color = payload.signal_type.toUpperCase() === "BUY" || payload.signal_type.toUpperCase() === "LONG" 
    ? "good" // Green
    : "danger"; // Red

  const message = {
    attachments: [
      {
        color: color,
        title: `${payload.signal_type.toUpperCase()} Signal: ${payload.symbol}`,
        fields: [
          {
            title: "Strategy",
            value: payload.strategy_name,
            short: true,
          },
          {
            title: "Price",
            value: `$${payload.price.toFixed(2)}`,
            short: true,
          },
          {
            title: "Time",
            value: new Date(payload.signal_time).toLocaleString(),
            short: false,
          },
        ],
        footer: "SignalPulse",
        ts: Math.floor(new Date(payload.signal_time).getTime() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    return response.ok;
  } catch (error) {
    console.error("Slack alert error:", error);
    return false;
  }
}

// Telegram bot API
async function sendTelegramAlert(config: { bot_token: string; chat_id: string }, payload: AlertPayload): Promise<boolean> {
  const emoji = payload.signal_type.toUpperCase() === "BUY" || payload.signal_type.toUpperCase() === "LONG" 
    ? "🟢" 
    : "🔴";

  const message = `${emoji} *${payload.signal_type.toUpperCase()} Signal: ${payload.symbol}*\n\n` +
    `📊 *Strategy:* ${payload.strategy_name}\n` +
    `💰 *Price:* $${payload.price.toFixed(2)}\n` +
    `🕐 *Time:* ${new Date(payload.signal_time).toLocaleString()}`;

  const url = `https://api.telegram.org/bot${config.bot_token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chat_id,
        text: message,
        parse_mode: "Markdown",
      }),
    });
    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error("Telegram alert error:", error);
    return false;
  }
}

// WhatsApp (using Twilio API or similar)
async function sendWhatsAppAlert(config: { api_key: string; phone_number: string; from_number?: string }, payload: AlertPayload): Promise<boolean> {
  // Using Twilio API format - adjust based on your WhatsApp provider
  const emoji = payload.signal_type.toUpperCase() === "BUY" || payload.signal_type.toUpperCase() === "LONG" 
    ? "🟢" 
    : "🔴";

  const message = `${emoji} ${payload.signal_type.toUpperCase()} Signal: ${payload.symbol}\n\n` +
    `Strategy: ${payload.strategy_name}\n` +
    `Price: $${payload.price.toFixed(2)}\n` +
    `Time: ${new Date(payload.signal_time).toLocaleString()}`;

  // Example using Twilio API
  const accountSid = config.api_key;
  const authToken = config.api_key; // Adjust based on your provider
  const from = config.from_number || "whatsapp:+14155238886"; // Twilio sandbox number

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      },
      body: new URLSearchParams({
        From: from,
        To: `whatsapp:${config.phone_number}`,
        Body: message,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("WhatsApp alert error:", error);
    return false;
  }
}

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

    const { signal_id, strategy_id } = await req.json();

    if (!signal_id || !strategy_id) {
      return new Response(JSON.stringify({ error: "Missing signal_id or strategy_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get signal details
    const { data: signal, error: signalError } = await supabase
      .from("signals")
      .select("*, strategies(name)")
      .eq("id", signal_id)
      .single();

    if (signalError || !signal) {
      return new Response(JSON.stringify({ error: "Signal not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active integrations for this strategy
    const { data: integrations, error: integrationsError } = await supabase
      .from("integrations")
      .select("*")
      .eq("strategy_id", strategy_id)
      .eq("enabled", true)
      .eq("status", "active");

    if (integrationsError) {
      console.error("Error fetching integrations:", integrationsError);
    }

    const payload: AlertPayload = {
      signal_type: signal.signal_type,
      symbol: signal.symbol,
      price: signal.price,
      signal_time: signal.signal_time,
      strategy_name: signal.strategies?.name || "Unknown",
      strategy_id: strategy_id,
    };

    const results = [];

    // Send alerts to all integrations
    for (const integration of integrations || []) {
      let success = false;
      try {
        switch (integration.integration_type) {
          case "discord":
            success = await sendDiscordAlert(integration.webhook_url, payload);
            break;
          case "slack":
            success = await sendSlackAlert(integration.webhook_url, payload);
            break;
          case "telegram":
            const telegramConfig = integration.config as { bot_token?: string; chat_id?: string };
            if (telegramConfig.bot_token && telegramConfig.chat_id) {
              success = await sendTelegramAlert(
                { bot_token: telegramConfig.bot_token, chat_id: telegramConfig.chat_id },
                payload
              );
            }
            break;
          case "whatsapp":
            const whatsappConfig = integration.config as { api_key?: string; phone_number?: string; from_number?: string };
            if (whatsappConfig.api_key && whatsappConfig.phone_number) {
              success = await sendWhatsAppAlert(whatsappConfig, payload);
            }
            break;
        }

        // Update integration status
        await supabase
          .from("integrations")
          .update({
            last_used_at: new Date().toISOString(),
            status: success ? "active" : "error",
            error_message: success ? null : "Failed to send alert",
          })
          .eq("id", integration.id);

        results.push({
          integration_id: integration.id,
          integration_type: integration.integration_type,
          success,
        });
      } catch (error) {
        console.error(`Error sending ${integration.integration_type} alert:`, error);
        results.push({
          integration_id: integration.id,
          integration_type: integration.integration_type,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        sent: results.filter((r) => r.success).length,
        total: results.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Alert sending error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

