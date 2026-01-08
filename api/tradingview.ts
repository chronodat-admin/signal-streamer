import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Secure proxy endpoint for TradingView webhooks
 * 
 * This endpoint:
 * 1. Forwards the request to Supabase Edge Function with proxy secret header
 * 2. Returns the Supabase response to TradingView
 * 
 * Security: The endpoint is protected by:
 * - Proxy secret header validation (VERCEL_PROXY_SECRET)
 * - Strategy token validation (in Supabase)
 * - Rate limiting (in Supabase)
 * - User isolation (RLS policies)
 * 
 * Environment Variables Required:
 * - SUPABASE_EDGE_FUNCTION_URL: Full URL to Supabase Edge Function
 * - VERCEL_PROXY_SECRET: Secret for x-vercel-proxy-secret header
 */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_EDGE_FUNCTION_URL;
    const proxySecret = process.env.VERCEL_PROXY_SECRET;

    // Validate environment variables
    if (!supabaseUrl) {
      console.error('SUPABASE_EDGE_FUNCTION_URL environment variable is not set');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'SUPABASE_EDGE_FUNCTION_URL is not configured'
      });
    }

    if (!proxySecret) {
      console.error('VERCEL_PROXY_SECRET environment variable is not set');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'VERCEL_PROXY_SECRET is not configured'
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

    // Forward the entire body (no secret validation needed)
    const forwardBody = body;

    // Forward request to Supabase Edge Function
    console.log(`Forwarding request to Supabase: ${supabaseUrl}`);
    
    const supabaseResponse = await fetch(supabaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-proxy-secret': proxySecret,
      },
      body: JSON.stringify(forwardBody),
    });

    // Get response body
    const responseText = await supabaseResponse.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // Log response for debugging
    console.log(`Supabase response status: ${supabaseResponse.status}`);
    if (!supabaseResponse.ok) {
      console.error('Supabase returned error:', responseData);
    }

    // Return Supabase response to TradingView (status + body)
    return res.status(supabaseResponse.status).json(responseData);

  } catch (error) {
    console.error('Error in tradingview proxy:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

