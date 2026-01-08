import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Secure proxy endpoint for third-party Signal API
 * 
 * This endpoint:
 * 1. Forwards requests to Supabase Edge Function (signal-api)
 * 2. Preserves API key authentication from x-api-key header
 * 3. Supports customizable payload formats
 * 
 * Security:
 * - API key validation (in Supabase)
 * - Rate limiting per API key (in Supabase)
 * - Proxy secret validation (VERCEL_PROXY_SECRET)
 * 
 * Usage:
 *   POST https://your-domain.com/api/signal
 *   Headers: x-api-key: sp_xxxxxxxxxxxx
 *   Body: { "signal": "BUY", "symbol": "AAPL", "price": 150.25 }
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: Your Supabase project URL (e.g., https://xxx.supabase.co)
 * - VERCEL_PROXY_SECRET: Secret for x-vercel-proxy-secret header
 */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers for browser-based clients
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed. Send your signal data as JSON in the request body.'
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const proxySecret = process.env.VERCEL_PROXY_SECRET;

    // Validate environment variables
    if (!supabaseUrl) {
      console.error('SUPABASE_URL environment variable is not set');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'SUPABASE_URL is not configured'
      });
    }

    // Build the signal-api function URL
    const signalApiUrl = `${supabaseUrl}/functions/v1/signal-api`;

    // Get API key from headers (preserve for forwarding)
    const apiKey = req.headers['x-api-key'] || 
                   (req.headers['authorization'] as string)?.replace('Bearer ', '') ||
                   (typeof req.query.api_key === 'string' ? req.query.api_key : undefined);

    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key required. Provide via x-api-key header, Authorization: Bearer <key>, or api_key query param'
      });
    }

    // Parse request body
    let body: any;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return res.status(400).json({ 
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON'
      });
    }

    // Build headers for forwarding
    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey as string,
    };

    // Add proxy secret if configured (for extra security)
    if (proxySecret) {
      forwardHeaders['x-vercel-proxy-secret'] = proxySecret;
    }

    // Forward request to Supabase Edge Function
    console.log(`Forwarding signal request to: ${signalApiUrl}`);
    
    const supabaseResponse = await fetch(signalApiUrl, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    // Get response body
    const responseText = await supabaseResponse.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    // Log response for debugging
    console.log(`Signal API response status: ${supabaseResponse.status}`);
    if (!supabaseResponse.ok) {
      console.error('Signal API returned error:', responseData);
    }

    // Return response
    return res.status(supabaseResponse.status).json(responseData);

  } catch (error) {
    console.error('Error in signal proxy:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


