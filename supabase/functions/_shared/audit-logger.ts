/**
 * Audit Logger with Geolocation Support
 * 
 * Usage:
 * ```ts
 * import { createAuditLogger } from "../_shared/audit-logger.ts";
 * 
 * const auditLogger = createAuditLogger(supabaseClient);
 * 
 * // Log an event with location
 * await auditLogger.log({
 *   req,
 *   userId: user.id,
 *   eventType: "LOGIN",
 *   metadata: { method: "email" },
 * });
 * ```
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getClientIP, 
  getUserAgent, 
  getGeoLocation, 
  createLocationSummary,
  type GeoLocationData 
} from "./geolocation.ts";

export type AuditEventType =
  | "LOGIN"
  | "LOGOUT"
  | "STRATEGY_CREATED"
  | "STRATEGY_UPDATED"
  | "STRATEGY_DELETED"
  | "TOKEN_ROTATED"
  | "PLAN_CHANGED"
  | "WEBHOOK_RECEIVED"
  | "WEBHOOK_FAILED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_CANCELLED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED";

export interface AuditLogOptions {
  req: Request;
  userId?: string | null;
  eventType: AuditEventType;
  metadata?: Record<string, unknown>;
  includeLocation?: boolean; // Default: true
}

export interface AuditLogResult {
  success: boolean;
  eventId?: string;
  location?: GeoLocationData | null;
  error?: string;
}

/**
 * Create an audit logger instance
 */
export function createAuditLogger(supabase: SupabaseClient) {
  return {
    /**
     * Log an audit event with optional geolocation
     */
    async log(options: AuditLogOptions): Promise<AuditLogResult> {
      const { req, userId, eventType, metadata = {}, includeLocation = true } = options;

      try {
        const ip = getClientIP(req);
        const userAgent = getUserAgent(req);

        // Get location data if requested
        let locationData: GeoLocationData | null = null;
        if (includeLocation) {
          const geoResult = await getGeoLocation(ip);
          locationData = geoResult.data;
        }

        // Merge location into metadata
        const enrichedMetadata = {
          ...metadata,
          ...(locationData ? { location: createLocationSummary(locationData) } : {}),
        };

        // Insert audit event
        const { data, error } = await supabase
          .from("audit_events")
          .insert({
            user_id: userId || null,
            event_type: eventType,
            ip_address: ip,
            user_agent: userAgent,
            metadata: enrichedMetadata,
          })
          .select("id")
          .single();

        if (error) {
          console.error("[AUDIT] Error logging event:", error);
          return { success: false, error: error.message };
        }

        console.log(`[AUDIT] Logged ${eventType} event for user ${userId || "anonymous"} from ${ip}`);
        
        return {
          success: true,
          eventId: data?.id,
          location: locationData,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[AUDIT] Unexpected error:", errorMessage);
        return { success: false, error: errorMessage };
      }
    },

    /**
     * Quick log without waiting for result (fire and forget)
     */
    logAsync(options: AuditLogOptions): void {
      this.log(options).catch((error) => {
        console.error("[AUDIT] Async log failed:", error);
      });
    },
  };
}

