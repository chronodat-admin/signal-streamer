import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Test webhook endpoint - sends a test message to Discord/Slack webhooks
 * 
 * POST /api/test-webhook
 * Body: { webhook_url: string, type: 'discord' | 'slack' }
 */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { webhook_url, type } = req.body;

    if (!webhook_url || typeof webhook_url !== 'string') {
      return res.status(400).json({ 
        error: 'Missing webhook_url',
        message: 'Please provide a webhook_url in the request body'
      });
    }

    if (!type || (type !== 'discord' && type !== 'slack')) {
      return res.status(400).json({ 
        error: 'Invalid type',
        message: 'Type must be either "discord" or "slack"'
      });
    }

    // Validate Discord webhook URL format
    if (type === 'discord') {
      const discordPatterns = [
        /^https:\/\/discord\.com\/api\/webhooks\/\d+\/.+$/,
        /^https:\/\/discordapp\.com\/api\/webhooks\/\d+\/.+$/,
        /^https:\/\/ptb\.discord\.com\/api\/webhooks\/\d+\/.+$/,
        /^https:\/\/canary\.discord\.com\/api\/webhooks\/\d+\/.+$/,
      ];
      
      const isValid = discordPatterns.some(pattern => pattern.test(webhook_url));
      if (!isValid) {
        return res.status(400).json({ 
          error: 'Invalid Discord webhook URL',
          message: 'URL should be in format: https://discord.com/api/webhooks/...'
        });
      }
    }

    // Validate Slack webhook URL format
    if (type === 'slack') {
      const slackPattern = /^https:\/\/hooks\.slack\.com\/services\/.+$/;
      if (!slackPattern.test(webhook_url)) {
        return res.status(400).json({ 
          error: 'Invalid Slack webhook URL',
          message: 'URL should be in format: https://hooks.slack.com/services/...'
        });
      }
    }

    // Build test payload
    const color = 0x22c55e; // Green
    const testPayload = type === 'discord' ? {
      embeds: [{
        title: `🧪 Test Signal: AAPL`,
        description: `**Strategy:** Test Strategy\n**Price:** $150.00\n**Time:** ${new Date().toLocaleString()}\n\n✅ **This is a test message from TradeMoq!**\n\nIf you see this message, your Discord integration is working correctly.`,
        color: color,
        timestamp: new Date().toISOString(),
        footer: {
          text: "TradeMoq - Test Message",
        },
      }],
    } : {
      // Slack format
      attachments: [{
        color: "good",
        title: "🧪 Test Signal: AAPL",
        fields: [
          { title: "Strategy", value: "Test Strategy", short: true },
          { title: "Price", value: "$150.00", short: true },
          { title: "Status", value: "✅ Integration working!", short: false },
        ],
        footer: "TradeMoq - Test Message",
        ts: Math.floor(Date.now() / 1000),
      }],
    };

    console.log(`Testing ${type} webhook:`, webhook_url.substring(0, 60) + '...');

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'TradeMoq-Webhook-Test/1.0'
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();
    console.log(`Test response: ${response.status} - ${responseText.substring(0, 200)}`);

    if (response.ok) {
      return res.status(200).json({ 
        success: true, 
        message: `Test message sent successfully to ${type}!`,
        status: response.status
      });
    } else {
      let errorMessage = `HTTP ${response.status}`;
      
      if (response.status === 404) {
        errorMessage = 'Webhook not found. The webhook URL may have been deleted or is invalid.';
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = 'Unauthorized. Check if the webhook URL is correct and not expired.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limited. Please wait a moment before testing again.';
      } else if (responseText) {
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${responseText.substring(0, 200)}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${responseText.substring(0, 200)}`;
        }
      }

      return res.status(response.status).json({ 
        success: false, 
        error: errorMessage,
        status: response.status,
        details: responseText.substring(0, 500)
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Test webhook error:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: errorMessage,
      message: 'Failed to send test message'
    });
  }
}
