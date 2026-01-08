import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  integration_type: 'discord' | 'slack' | 'telegram' | 'whatsapp' | 'email' | 'webhook' | 'pushover' | 'ntfy' | 'zapier' | 'ifttt' | 'microsoft-teams' | 'google-chat';
  strategy_name: string;
  signal_type: string;
  symbol: string;
  price: number;
  signal_time: string;
  timestamp: string;
}

// Discord webhook format
function formatDiscordMessage(payload: NotificationPayload) {
  const isBuy = ['BUY', 'LONG'].includes(payload.signal_type.toUpperCase());
  const color = isBuy ? 0x22c55e : 0xef4444; // Green for buy, red for sell
  const emoji = isBuy ? '🟢' : '🔴';
  
  return {
    embeds: [{
      title: `${emoji} ${payload.signal_type} Signal`,
      description: `**Strategy:** ${payload.strategy_name}\n**Symbol:** ${payload.symbol}\n**Price:** $${payload.price.toFixed(2)}`,
      color: color,
      timestamp: payload.signal_time,
      footer: {
        text: 'SignalPulse',
      },
    }],
  };
}

// Slack webhook format
function formatSlackMessage(payload: NotificationPayload) {
  const isBuy = ['BUY', 'LONG'].includes(payload.signal_type.toUpperCase());
  const color = isBuy ? 'good' : 'danger';
  const emoji = isBuy ? '🟢' : '🔴';
  
  return {
    attachments: [{
      color: color,
      title: `${emoji} ${payload.signal_type} Signal - ${payload.symbol}`,
      fields: [
        {
          title: 'Strategy',
          value: payload.strategy_name,
          short: true,
        },
        {
          title: 'Price',
          value: `$${payload.price.toFixed(2)}`,
          short: true,
        },
        {
          title: 'Time',
          value: new Date(payload.signal_time).toLocaleString(),
          short: true,
        },
      ],
      footer: 'SignalPulse',
      ts: Math.floor(new Date(payload.signal_time).getTime() / 1000),
    }],
  };
}

// Telegram bot message format
function formatTelegramMessage(payload: NotificationPayload) {
  const isBuy = ['BUY', 'LONG'].includes(payload.signal_type.toUpperCase());
  const emoji = isBuy ? '🟢' : '🔴';
  
  return {
    text: `${emoji} *${payload.signal_type} Signal*\n\n` +
          `*Strategy:* ${payload.strategy_name}\n` +
          `*Symbol:* ${payload.symbol}\n` +
          `*Price:* $${payload.price.toFixed(2)}\n` +
          `*Time:* ${new Date(payload.signal_time).toLocaleString()}`,
    parse_mode: 'Markdown',
  };
}

// WhatsApp (via Twilio API) format
function formatWhatsAppMessage(payload: NotificationPayload) {
  const isBuy = ['BUY', 'LONG'].includes(payload.signal_type.toUpperCase());
  const emoji = isBuy ? '🟢' : '🔴';
  
  return {
    Body: `${emoji} ${payload.signal_type} Signal\n\n` +
          `Strategy: ${payload.strategy_name}\n` +
          `Symbol: ${payload.symbol}\n` +
          `Price: $${payload.price.toFixed(2)}\n` +
          `Time: ${new Date(payload.signal_time).toLocaleString()}`,
  };
}

async function sendDiscordNotification(webhookUrl: string, payload: NotificationPayload) {
  const message = formatDiscordMessage(payload);
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  return response.ok;
}

async function sendSlackNotification(webhookUrl: string, payload: NotificationPayload) {
  const message = formatSlackMessage(payload);
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  return response.ok;
}

async function sendTelegramNotification(webhookUrl: string, payload: NotificationPayload) {
  // Telegram webhook URL should be: https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>
  const message = formatTelegramMessage(payload);
  const url = new URL(webhookUrl);
  url.searchParams.set('text', message.text);
  url.searchParams.set('parse_mode', message.parse_mode);
  
  const response = await fetch(url.toString(), {
    method: 'POST',
  });
  return response.ok;
}

async function sendWhatsAppNotification(webhookUrl: string, payload: NotificationPayload, accountSid: string, authToken: string) {
  // WhatsApp via Twilio API
  const message = formatWhatsAppMessage(payload);
  // Extract phone number from webhook URL or payload
  const to = webhookUrl; // Should contain phone number
  const from = '+14155238886'; // Twilio Sandbox number (user should configure their own)
  
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: from,
      To: to,
      Body: message.Body,
    }),
  });
  return response.ok;
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

    const { queue_id } = await req.json();

    if (!queue_id) {
      return new Response(JSON.stringify({ error: "Missing queue_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get queued notification
    const { data: queueItem, error: queueError } = await supabase
      .from("webhook_queue")
      .select("*")
      .eq("id", queue_id)
      .eq("status", "pending")
      .single();

    if (queueError || !queueItem) {
      return new Response(JSON.stringify({ error: "Queue item not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = queueItem.payload as NotificationPayload;
    let success = false;

    // Send notification based on integration type
    switch (payload.integration_type) {
      case 'discord':
        success = await sendDiscordNotification(queueItem.webhook_url, payload);
        break;
      case 'slack':
        success = await sendSlackNotification(queueItem.webhook_url, payload);
        break;
      case 'telegram':
        success = await sendTelegramNotification(queueItem.webhook_url, payload);
        break;
      case 'whatsapp':
        // WhatsApp requires Twilio credentials
        const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
        if (twilioSid && twilioToken) {
          success = await sendWhatsAppNotification(queueItem.webhook_url, payload, twilioSid, twilioToken);
        } else {
          console.error("Twilio credentials not configured");
        }
        break;
    }

    // Update queue status
    if (success) {
      await supabase
        .from("webhook_queue")
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq("id", queue_id);
    } else {
      const retryCount = (queueItem.retry_count || 0) + 1;
      if (retryCount < 3) {
        await supabase
          .from("webhook_queue")
          .update({ retry_count: retryCount, status: 'pending' })
          .eq("id", queue_id);
      } else {
        await supabase
          .from("webhook_queue")
          .update({ status: 'failed', failed_at: new Date().toISOString() })
          .eq("id", queue_id);
      }
    }

    return new Response(JSON.stringify({ success }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

