/**
 * Shared CORS headers for Supabase Edge Functions
 * 
 * Usage:
 * ```ts
 * import { corsHeaders, handleCors } from "../_shared/cors.ts";
 * 
 * // In your handler:
 * if (req.method === "OPTIONS") {
 *   return handleCors();
 * }
 * 
 * // In your response:
 * return new Response(JSON.stringify(data), {
 *   headers: { ...corsHeaders, "Content-Type": "application/json" },
 *   status: 200,
 * });
 * ```
 */

// Allow requests from your domain and localhost for development
const allowedOrigins = [
  "https://trademoq.com",
  "https://www.trademoq.com",
  "http://localhost:8080",
  "http://localhost:5173",
];

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-vercel-proxy-secret, x-api-key",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Legacy export for backward compatibility (webhook endpoints need to accept any origin)
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-vercel-proxy-secret, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

/**
 * Handle CORS preflight request
 */
export function handleCors(): Response {
  return new Response(null, {
    headers: corsHeaders,
    status: 200,
  });
}

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

/**
 * Create an error response with CORS headers
 */
export function errorResponse(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

