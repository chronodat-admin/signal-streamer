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
async function sendDiscordAlert(
  webhookUrl: string, 
  payload: AlertPayload,
  supabase: any,
  logData: { userId: string; strategyId: string; signalId: string; integrationId: string }
): Promise<{ success: boolean; error?: string; responseStatus?: number; responseBody?: string }> {
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

  // Log the attempt
  let logEntry: any = null;
  try {
    const { data, error } = await supabase
      .from("alert_logs")
      .insert({
        user_id: logData.userId,
        strategy_id: logData.strategyId,
        signal_id: logData.signalId,
        integration_id: logData.integrationId,
        integration_type: "discord",
        status: "pending",
        message: `Sending Discord alert for ${payload.signal_type} ${payload.symbol}`,
        webhook_url: webhookUrl.substring(0, 100), // Truncate for storage
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating log entry:", error);
    } else {
      logEntry = data;
      console.log("Created log entry:", logEntry?.id);
    }
  } catch (logError) {
    console.error("Exception creating log entry:", logError);
  }

  try {
    console.log(`Sending Discord webhook to: ${webhookUrl.substring(0, 50)}...`);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    
    const responseBody = await response.text();
    
    if (!response.ok) {
      console.error(`Discord webhook failed: ${response.status} ${response.statusText} - ${responseBody}`);
      
      // Update log with error
      if (logEntry?.id) {
        await supabase
          .from("alert_logs")
          .update({
            status: "error",
            error_message: `HTTP ${response.status}: ${responseBody.substring(0, 500)}`,
            response_status: response.status,
            response_body: responseBody.substring(0, 1000),
          })
          .eq("id", logEntry.id);
      }
      
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${responseBody.substring(0, 200)}`,
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 1000)
      };
    }
    
    console.log("Discord alert sent successfully");
    
    // Update log with success
    if (logEntry?.id) {
      await supabase
        .from("alert_logs")
        .update({
          status: "success",
          message: "Discord alert sent successfully",
          response_status: response.status,
        })
        .eq("id", logEntry.id);
    }
    
    return { success: true, responseStatus: response.status };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Discord alert error:", error);
    
    // Update log with error
    if (logEntry?.id) {
      await supabase
        .from("alert_logs")
        .update({
          status: "error",
          error_message: errorMessage.substring(0, 500),
        })
        .eq("id", logEntry.id);
    }
    
    return { success: false, error: errorMessage };
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

// Email alert (using SMTP or email API service)
async function sendEmailAlert(
  config: { 
    smtp_host?: string; 
    smtp_port?: number; 
    smtp_user?: string; 
    smtp_password?: string; 
    from_email?: string; 
    to_email?: string;
    api_key?: string; // For services like Resend, SendGrid
    api_service?: string; // 'resend', 'sendgrid', 'smtp'
  }, 
  payload: AlertPayload,
  supabase: any,
  logData: { userId: string; strategyId: string; signalId: string; integrationId: string }
): Promise<{ success: boolean; error?: string }> {
  const emoji = payload.signal_type.toUpperCase() === "BUY" || payload.signal_type.toUpperCase() === "LONG" 
    ? "🟢" 
    : "🔴";

  const subject = `${emoji} ${payload.signal_type.toUpperCase()} Signal: ${payload.symbol}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${payload.signal_type.toUpperCase() === "BUY" || payload.signal_type.toUpperCase() === "LONG" ? "#22c55e" : "#ef4444"};">
        ${emoji} ${payload.signal_type.toUpperCase()} Signal: ${payload.symbol}
      </h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Strategy:</strong> ${payload.strategy_name}</p>
        <p><strong>Symbol:</strong> ${payload.symbol}</p>
        <p><strong>Price:</strong> $${payload.price.toFixed(2)}</p>
        <p><strong>Time:</strong> ${new Date(payload.signal_time).toLocaleString()}</p>
      </div>
      <p style="color: #666; font-size: 12px;">SignalPulse Trading Signals</p>
    </div>
  `;
  const textBody = `${payload.signal_type.toUpperCase()} Signal: ${payload.symbol}\n\nStrategy: ${payload.strategy_name}\nPrice: $${payload.price.toFixed(2)}\nTime: ${new Date(payload.signal_time).toLocaleString()}`;

  // Log the attempt
  let logEntry: any = null;
  try {
    const { data, error } = await supabase
      .from("alert_logs")
      .insert({
        user_id: logData.userId,
        strategy_id: logData.strategyId,
        signal_id: logData.signalId,
        integration_id: logData.integrationId,
        integration_type: "email",
        status: "pending",
        message: `Sending email alert for ${payload.signal_type} ${payload.symbol}`,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating log entry:", error);
    } else {
      logEntry = data;
    }
  } catch (logError) {
    console.error("Exception creating log entry:", logError);
  }

  try {
    const toEmail = config.to_email;
    if (!toEmail) {
      throw new Error("No recipient email address configured");
    }

    // Try Resend API first (if api_key and api_service is 'resend')
    if (config.api_key && config.api_service === 'resend') {
      console.log("Sending email via Resend API");
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.api_key}`,
        },
        body: JSON.stringify({
          from: config.from_email || "alerts@signalpulse.com",
          to: toEmail,
          subject: subject,
          html: htmlBody,
          text: textBody,
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(`Resend API error: ${response.status} - ${JSON.stringify(responseData)}`);
      }

      if (logEntry?.id) {
        await supabase
          .from("alert_logs")
          .update({
            status: "success",
            message: "Email sent successfully via Resend",
            response_status: response.status,
          })
          .eq("id", logEntry.id);
      }

      return { success: true };
    }

    // Try SendGrid API (if api_key and api_service is 'sendgrid')
    if (config.api_key && config.api_service === 'sendgrid') {
      console.log("Sending email via SendGrid API");
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.api_key}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: config.from_email || "alerts@signalpulse.com" },
          subject: subject,
          content: [
            { type: "text/plain", value: textBody },
            { type: "text/html", value: htmlBody },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
      }

      if (logEntry?.id) {
        await supabase
          .from("alert_logs")
          .update({
            status: "success",
            message: "Email sent successfully via SendGrid",
            response_status: response.status,
          })
          .eq("id", logEntry.id);
      }

      return { success: true };
    }

    // Fallback: Use webhook URL if provided (for services like Zapier, IFTTT, etc.)
    if (config.api_key && !config.api_service) {
      // Assume it's a generic webhook-based email service
      console.log("Sending email via webhook");
      const response = await fetch(config.api_key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: toEmail,
          subject: subject,
          html: htmlBody,
          text: textBody,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Email webhook error: ${response.status} - ${errorText}`);
      }

      if (logEntry?.id) {
        await supabase
          .from("alert_logs")
          .update({
            status: "success",
            message: "Email sent successfully via webhook",
            response_status: response.status,
          })
          .eq("id", logEntry.id);
      }

      return { success: true };
    }

    // If no API service configured, return error
    throw new Error("No email service configured. Please configure Resend, SendGrid, or a webhook URL.");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Email alert error:", errorMessage);
    
    if (logEntry?.id) {
      await supabase
        .from("alert_logs")
        .update({
          status: "error",
          error_message: errorMessage.substring(0, 500),
        })
        .eq("id", logEntry.id);
    }
    
    return { success: false, error: errorMessage };
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

    console.log("send-alerts function called");

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { signal_id, strategy_id } = await req.json();
    console.log("Received request:", { signal_id, strategy_id });

    if (!signal_id || !strategy_id) {
      console.error("Missing signal_id or strategy_id");
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

    // Get active integrations for this strategy (or user-level if strategy_id is null)
    // First get the user_id from the strategy
    const { data: strategyData } = await supabase
      .from("strategies")
      .select("user_id")
      .eq("id", strategy_id)
      .single();

    const userId = strategyData?.user_id;

    if (!userId) {
      console.error(`Strategy ${strategy_id} not found or has no user_id`);
      return new Response(JSON.stringify({ error: "Strategy not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get strategy-specific integrations
    const { data: strategyIntegrations, error: strategyError } = await supabase
      .from("integrations")
      .select("*")
      .eq("strategy_id", strategy_id)
      .eq("enabled", true)
      .eq("status", "active");

    // Get user-level integrations (strategy_id IS NULL)
    const { data: userIntegrations, error: userError } = await supabase
      .from("integrations")
      .select("*")
      .is("strategy_id", null)
      .eq("user_id", userId)
      .eq("enabled", true)
      .eq("status", "active");

    if (strategyError) {
      console.error("Error fetching strategy integrations:", strategyError);
    }
    if (userError) {
      console.error("Error fetching user integrations:", userError);
    }

    // Combine both types of integrations
    const filteredIntegrations = [
      ...(strategyIntegrations || []),
      ...(userIntegrations || [])
    ];

    console.log(`Found ${filteredIntegrations.length} active integrations for strategy ${strategy_id} (${strategyIntegrations?.length || 0} strategy-specific, ${userIntegrations?.length || 0} user-level)`);

    // Log if no integrations found
    if (filteredIntegrations.length === 0) {
      console.log(`No active integrations found for strategy ${strategy_id}, user ${userId}`);
      console.log(`Strategy integrations: ${strategyIntegrations?.length || 0}, User integrations: ${userIntegrations?.length || 0}`);
      
      // Create a log entry even when no integrations are found
      try {
        const { error: logError } = await supabase
          .from("alert_logs")
          .insert({
            user_id: userId,
            strategy_id: strategy_id,
            signal_id: signal_id,
            integration_id: null,
            integration_type: "none",
            status: "error",
            message: `No active integrations found for strategy ${strategy_id}`,
            error_message: "No integrations configured or enabled",
          });
        
        if (logError) {
          console.error("Error creating log entry:", logError);
        } else {
          console.log("Created log entry for no integrations found");
        }
      } catch (logError) {
        console.error("Exception creating log entry:", logError);
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No active integrations found",
        results: [],
        sent: 0,
        total: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    for (const integration of filteredIntegrations) {
      let success = false;
      try {
        // Handle both old schema (type) and new schema (integration_type)
        const integrationType = integration.integration_type || integration.type;
        
        if (!integrationType) {
          console.error(`Integration ${integration.id} has no type specified`);
          continue;
        }

        // Get webhook_url - could be in column or config
        const webhookUrl = integration.webhook_url || integration.config?.webhook_url;
        
        if (!webhookUrl && (integrationType === 'discord' || integrationType === 'slack')) {
          console.error(`Integration ${integration.id} (${integrationType}) has no webhook_url. Integration data:`, JSON.stringify(integration));
          await supabase
            .from("integrations")
            .update({
              status: "error",
              error_message: "Missing webhook_url",
            })
            .eq("id", integration.id);
          continue;
        }

        console.log(`Sending ${integrationType} alert to integration ${integration.id} (${integration.name})`);

        switch (integrationType) {
          case "discord":
            const discordResult = await sendDiscordAlert(
              webhookUrl, 
              payload, 
              supabase,
              {
                userId: userId,
                strategyId: strategy_id,
                signalId: signal_id,
                integrationId: integration.id
              }
            );
            success = discordResult.success;
            break;
          case "slack":
            success = await sendSlackAlert(webhookUrl, payload);
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
          case "email":
            const emailConfig = integration.config as { 
              smtp_host?: string; 
              smtp_port?: number; 
              smtp_user?: string; 
              smtp_password?: string; 
              from_email?: string; 
              to_email?: string;
              api_key?: string;
              api_service?: string;
            };
            if (emailConfig.to_email || emailConfig.api_key) {
              const emailResult = await sendEmailAlert(
                emailConfig,
                payload,
                supabase,
                {
                  userId: userId,
                  strategyId: strategy_id,
                  signalId: signal_id,
                  integrationId: integration.id
                }
              );
              success = emailResult.success;
            } else {
              console.error(`Email integration ${integration.id} has no recipient email or API key configured`);
              success = false;
            }
            break;
        }

        // Update integration status
        const updateData: any = {
          last_used_at: new Date().toISOString(),
          status: success ? "active" : "error",
        };
        
        if (!success) {
          updateData.error_message = "Failed to send alert";
        } else {
          updateData.error_message = null;
        }
        
        await supabase
          .from("integrations")
          .update(updateData)
          .eq("id", integration.id);

        console.log(`${integrationType} alert ${success ? 'sent successfully' : 'failed'} for integration ${integration.id}`);

        results.push({
          integration_id: integration.id,
          integration_type: integrationType,
          success,
        });
      } catch (error) {
        console.error(`Error sending ${integrationType} alert:`, error);
        await supabase
          .from("integrations")
          .update({
            status: "error",
            error_message: error instanceof Error ? error.message : String(error),
          })
          .eq("id", integration.id);
        results.push({
          integration_id: integration.id,
          integration_type: integrationType,
          success: false,
          error: error instanceof Error ? error.message : String(error),
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

