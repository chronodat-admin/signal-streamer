/**
 * Error Logger for Supabase Edge Functions
 * 
 * Usage:
 * ```ts
 * import { createErrorLogger } from "../_shared/error-logger.ts";
 * 
 * const errorLogger = createErrorLogger(supabaseClient);
 * 
 * try {
 *   // ... code that might error
 * } catch (error) {
 *   await errorLogger.log({
 *     req,
 *     userId: user?.id,
 *     errorType: 'edge_function',
 *     severity: 'error',
 *     source: 'tradingview-webhook',
 *     message: 'Failed to process webhook',
 *     error: error,
 *   });
 * }
 * ```
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientIP, getUserAgent } from "./geolocation.ts";

export type ErrorType = 'api' | 'edge_function' | 'frontend' | 'webhook' | 'database';
export type ErrorSeverity = 'error' | 'warning' | 'critical';

export interface ErrorLogOptions {
  req?: Request;
  userId?: string | null;
  errorType: ErrorType;
  severity?: ErrorSeverity;
  source?: string;
  message: string;
  error?: Error | unknown;
  requestUrl?: string;
  requestMethod?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseStatus?: number;
  responseBody?: unknown;
  metadata?: Record<string, unknown>;
}

export interface ErrorLogResult {
  success: boolean;
  logId?: string;
  error?: string;
}

/**
 * Create an error logger instance
 */
export function createErrorLogger(supabase: SupabaseClient) {
  return {
    /**
     * Log an error to the error_logs table
     */
    async log(options: ErrorLogOptions): Promise<ErrorLogResult> {
      const {
        req,
        userId,
        errorType,
        severity = 'error',
        source,
        message,
        error,
        requestUrl,
        requestMethod,
        requestHeaders,
        requestBody,
        responseStatus,
        responseBody,
        metadata = {},
      } = options;

      try {
        // Extract error details
        const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
        const stackTrace = error instanceof Error ? error.stack : undefined;

        // Get request details from req if not provided
        const url = requestUrl || (req ? new URL(req.url).toString() : undefined);
        const method = requestMethod || (req ? req.method : undefined);
        const ip = req ? getClientIP(req) : undefined;
        const userAgent = req ? getUserAgent(req) : undefined;

        // Prepare headers (sanitize sensitive data)
        let headersJson: Record<string, string> | null = null;
        if (requestHeaders) {
          headersJson = { ...requestHeaders };
        } else if (req) {
          const headers: Record<string, string> = {};
          req.headers.forEach((value, key) => {
            // Sanitize sensitive headers
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('authorization') || lowerKey.includes('cookie') || lowerKey.includes('secret')) {
              headers[key] = '[REDACTED]';
            } else {
              headers[key] = value;
            }
          });
          headersJson = headers;
        }

        // Prepare request body (limit size and sanitize)
        let bodyJson: unknown = null;
        if (requestBody) {
          const bodyStr = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
          // Limit body size to 10KB
          bodyJson = bodyStr.length > 10000 ? bodyStr.substring(0, 10000) + '...[truncated]' : requestBody;
        }

        // Prepare response body (limit size)
        let responseBodyStr: string | null = null;
        if (responseBody) {
          const bodyStr = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody);
          responseBodyStr = bodyStr.length > 10000 ? bodyStr.substring(0, 10000) + '...[truncated]' : bodyStr;
        }

        // Call the log_error function
        const { data, error: rpcError } = await supabase.rpc('log_error', {
          p_user_id: userId || null,
          p_error_type: errorType,
          p_severity: severity,
          p_source: source || null,
          p_message: message,
          p_error_message: errorMessage,
          p_stack_trace: stackTrace || null,
          p_request_url: url || null,
          p_request_method: method || null,
          p_request_headers: headersJson ? headersJson as unknown as Record<string, unknown> : null,
          p_request_body: bodyJson as unknown as Record<string, unknown> | null,
          p_response_status: responseStatus || null,
          p_response_body: responseBodyStr || null,
          p_metadata: metadata as Record<string, unknown>,
          p_ip_address: ip || null,
          p_user_agent: userAgent || null,
        });

        if (rpcError) {
          console.error("[ERROR-LOG] Failed to log error:", rpcError);
          return { success: false, error: rpcError.message };
        }

        console.log(`[ERROR-LOG] Logged ${severity} error: ${message} (ID: ${data})`);
        
        return {
          success: true,
          logId: data as string | undefined,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("[ERROR-LOG] Unexpected error while logging:", errorMessage);
        return { success: false, error: errorMessage };
      }
    },

    /**
     * Quick log without waiting for result (fire and forget)
     */
    logAsync(options: ErrorLogOptions): void {
      this.log(options).catch((error) => {
        console.error("[ERROR-LOG] Async log failed:", error);
      });
    },
  };
}
