/**
 * Shared Utilities Index
 * 
 * Usage:
 * ```ts
 * import { 
 *   corsHeaders, 
 *   handleCors, 
 *   jsonResponse,
 *   getClientIP, 
 *   getGeoLocation,
 *   getUserLocationData,
 *   createAuditLogger 
 * } from "../_shared/index.ts";
 * ```
 */

// CORS utilities
export { 
  corsHeaders, 
  handleCors, 
  jsonResponse, 
  errorResponse 
} from "./cors.ts";

// Geolocation utilities
export {
  getClientIP,
  getGeoLocation,
  getUserLocationData,
  getUserAgent,
  getClientMetadata,
  formatLocation,
  createLocationSummary,
  type GeoLocationData,
  type GeoLocationResult,
} from "./geolocation.ts";

// Audit logging with geolocation
export {
  createAuditLogger,
  type AuditEventType,
  type AuditLogOptions,
  type AuditLogResult,
} from "./audit-logger.ts";

