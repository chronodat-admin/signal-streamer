/**
 * Error Logger for Vercel API Routes
 * 
 * Logs errors to Supabase error_logs table
 */

import { createClient } from '@supabase/supabase-js';

interface ErrorLogOptions {
  userId?: string | null;
  errorType: 'api' | 'edge_function' | 'frontend' | 'webhook' | 'database';
  severity?: 'error' | 'warning' | 'critical';
  source?: string;
  message: string;
  error?: Error | unknown;
  requestUrl?: string;
  requestMethod?: string;
  requestHeaders?: Record<string, string | string[] | undefined>;
  requestBody?: unknown;
  responseStatus?: number;
  responseBody?: unknown;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an error to Supabase
 */
export async function logError(options: ErrorLogOptions): Promise<string | null> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[ERROR-LOG] Missing Supabase credentials');
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract error details
    const errorMessage = options.error instanceof Error 
      ? options.error.message 
      : String(options.error || 'Unknown error');
    const stackTrace = options.error instanceof Error ? options.error.stack : undefined;

    // Sanitize headers (remove sensitive data)
    const sanitizedHeaders: Record<string, string> = {};
    if (options.requestHeaders) {
      Object.entries(options.requestHeaders).forEach(([key, value]) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('authorization') || lowerKey.includes('cookie') || lowerKey.includes('secret')) {
          sanitizedHeaders[key] = '[REDACTED]';
        } else {
          sanitizedHeaders[key] = Array.isArray(value) ? value.join(', ') : (value || '');
        }
      });
    }

    // Limit body size
    let bodyJson: unknown = null;
    if (options.requestBody) {
      const bodyStr = typeof options.requestBody === 'string' 
        ? options.requestBody 
        : JSON.stringify(options.requestBody);
      bodyJson = bodyStr.length > 10000 ? bodyStr.substring(0, 10000) + '...[truncated]' : options.requestBody;
    }

    let responseBodyStr: string | null = null;
    if (options.responseBody) {
      const bodyStr = typeof options.responseBody === 'string' 
        ? options.responseBody 
        : JSON.stringify(options.responseBody);
      responseBodyStr = bodyStr.length > 10000 ? bodyStr.substring(0, 10000) + '...[truncated]' : bodyStr;
    }

    // Call the log_error function
    const { data, error } = await supabase.rpc('log_error', {
      p_user_id: options.userId || null,
      p_error_type: options.errorType,
      p_severity: options.severity || 'error',
      p_source: options.source || null,
      p_message: options.message,
      p_error_message: errorMessage,
      p_stack_trace: stackTrace || null,
      p_request_url: options.requestUrl || null,
      p_request_method: options.requestMethod || null,
      p_request_headers: Object.keys(sanitizedHeaders).length > 0 ? sanitizedHeaders : null,
      p_request_body: bodyJson as Record<string, unknown> | null,
      p_response_status: options.responseStatus || null,
      p_response_body: responseBodyStr || null,
      p_metadata: options.metadata || {},
      p_ip_address: options.ipAddress || null,
      p_user_agent: options.userAgent || null,
    });

    if (error) {
      console.error('[ERROR-LOG] Failed to log error:', error);
      return null;
    }

    console.log(`[ERROR-LOG] Logged ${options.severity || 'error'} error: ${options.message} (ID: ${data})`);
    return data as string | null;
  } catch (err) {
    console.error('[ERROR-LOG] Unexpected error while logging:', err);
    return null;
  }
}

/**
 * Quick async log (fire and forget)
 */
export function logErrorAsync(options: ErrorLogOptions): void {
  logError(options).catch((error) => {
    console.error('[ERROR-LOG] Async log failed:', error);
  });
}
