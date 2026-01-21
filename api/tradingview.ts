import type { VercelRequest, VercelResponse } from '@vercel/node';
import { logErrorAsync } from './error-logger';

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
      const error = new Error('SUPABASE_EDGE_FUNCTION_URL environment variable is not set');
      logErrorAsync({
        errorType: 'api',
        severity: 'critical',
        source: 'tradingview-proxy',
        message: 'Missing SUPABASE_EDGE_FUNCTION_URL configuration',
        error: error,
        requestUrl: req.url,
        requestMethod: req.method,
        requestHeaders: req.headers,
        responseStatus: 500,
      });
      console.error('SUPABASE_EDGE_FUNCTION_URL environment variable is not set');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'SUPABASE_EDGE_FUNCTION_URL is not configured'
      });
    }

    if (!proxySecret) {
      const error = new Error('VERCEL_PROXY_SECRET environment variable is not set');
      logErrorAsync({
        errorType: 'api',
        severity: 'critical',
        source: 'tradingview-proxy',
        message: 'Missing VERCEL_PROXY_SECRET configuration',
        error: error,
        requestUrl: req.url,
        requestMethod: req.method,
        requestHeaders: req.headers,
        responseStatus: 500,
      });
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
      const error = parseError instanceof Error ? parseError : new Error(String(parseError));
      logErrorAsync({
        errorType: 'api',
        severity: 'error',
        source: 'tradingview-proxy',
        message: 'Failed to parse request body',
        error: error,
        requestUrl: req.url,
        requestMethod: req.method,
        requestHeaders: req.headers,
        requestBody: req.body,
        responseStatus: 400,
      });
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
      logErrorAsync({
        errorType: 'api',
        severity: 'error',
        source: 'tradingview-proxy',
        message: 'Supabase edge function returned error',
        error: new Error(JSON.stringify(responseData)),
        requestUrl: req.url,
        requestMethod: req.method,
        requestHeaders: req.headers,
        requestBody: forwardBody,
        responseStatus: supabaseResponse.status,
        responseBody: responseData,
        metadata: { supabaseUrl },
      });
    }

    // Return Supabase response to TradingView (status + body)
    return res.status(supabaseResponse.status).json(responseData);

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logErrorAsync({
      errorType: 'api',
      severity: 'critical',
      source: 'tradingview-proxy',
      message: 'Unexpected error in tradingview proxy',
      error: err,
      requestUrl: req.url,
      requestMethod: req.method,
      requestHeaders: req.headers,
      requestBody: req.body,
      responseStatus: 500,
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
    console.error('Error in tradingview proxy:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

