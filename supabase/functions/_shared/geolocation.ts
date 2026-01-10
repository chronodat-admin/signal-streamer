/**
 * Geolocation Utility for Supabase Edge Functions
 * 
 * Usage:
 * ```ts
 * import { getClientIP, getGeoLocation, getUserLocationData } from "../_shared/geolocation.ts";
 * 
 * // Get IP only
 * const ip = getClientIP(req);
 * 
 * // Get full location data
 * const locationData = await getUserLocationData(req);
 * ```
 */

export interface GeoLocationData {
  ip: string;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  regionCode: string | null;
  city: string | null;
  zip: string | null;
  lat: number | null;
  lon: number | null;
  timezone: string | null;
  isp: string | null;
  org: string | null;
  as: string | null;
  mobile: boolean | null;
  proxy: boolean | null;
  hosting: boolean | null;
}

export interface GeoLocationResult {
  success: boolean;
  data: GeoLocationData | null;
  error?: string;
}

/**
 * Extract client IP address from request headers
 * Handles various proxy configurations (Vercel, Cloudflare, nginx, etc.)
 */
export function getClientIP(req: Request): string {
  // Try various headers in order of preference
  const headers = [
    "cf-connecting-ip",      // Cloudflare
    "x-real-ip",             // nginx
    "x-forwarded-for",       // Standard proxy header
    "x-client-ip",           // Apache
    "x-cluster-client-ip",   // Rackspace
    "forwarded-for",         // RFC 7239
    "forwarded",             // RFC 7239
    "true-client-ip",        // Akamai
  ];

  for (const header of headers) {
    const value = req.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs: client, proxy1, proxy2...
      // The first one is the original client
      const ip = value.split(",")[0].trim();
      if (ip && isValidIP(ip)) {
        return ip;
      }
    }
  }

  return "unknown";
}

/**
 * Basic IP validation
 */
function isValidIP(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * Fetch geolocation data for an IP address
 * Uses ip-api.com (free, no API key required, 45 req/min limit)
 * 
 * Alternative free APIs (if you hit rate limits):
 * - ipapi.co: https://ipapi.co/{ip}/json/
 * - ipinfo.io: https://ipinfo.io/{ip}/json (requires token for full data)
 */
export async function getGeoLocation(ip: string): Promise<GeoLocationResult> {
  // Skip lookup for localhost/private IPs
  if (ip === "unknown" || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return {
      success: true,
      data: {
        ip,
        country: null,
        countryCode: null,
        region: null,
        regionCode: null,
        city: null,
        zip: null,
        lat: null,
        lon: null,
        timezone: null,
        isp: null,
        org: null,
        as: null,
        mobile: null,
        proxy: null,
        hosting: null,
      },
    };
  }

  try {
    // ip-api.com provides comprehensive data for free
    // Fields: status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === "fail") {
      return {
        success: false,
        data: null,
        error: data.message || "Geolocation lookup failed",
      };
    }

    return {
      success: true,
      data: {
        ip: data.query || ip,
        country: data.country || null,
        countryCode: data.countryCode || null,
        region: data.regionName || null,
        regionCode: data.region || null,
        city: data.city || null,
        zip: data.zip || null,
        lat: data.lat || null,
        lon: data.lon || null,
        timezone: data.timezone || null,
        isp: data.isp || null,
        org: data.org || null,
        as: data.as || null,
        mobile: data.mobile ?? null,
        proxy: data.proxy ?? null,
        hosting: data.hosting ?? null,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[GEOLOCATION] Error fetching location for IP ${ip}:`, errorMessage);
    
    return {
      success: false,
      data: null,
      error: errorMessage,
    };
  }
}

/**
 * Convenience function: Get full location data from a request
 */
export async function getUserLocationData(req: Request): Promise<GeoLocationResult> {
  const ip = getClientIP(req);
  return await getGeoLocation(ip);
}

/**
 * Get User-Agent from request
 */
export function getUserAgent(req: Request): string {
  return req.headers.get("user-agent") || "unknown";
}

/**
 * Get all client metadata useful for logging
 */
export async function getClientMetadata(req: Request): Promise<{
  ip: string;
  userAgent: string;
  location: GeoLocationData | null;
  referer: string | null;
  origin: string | null;
}> {
  const ip = getClientIP(req);
  const locationResult = await getGeoLocation(ip);
  
  return {
    ip,
    userAgent: getUserAgent(req),
    location: locationResult.data,
    referer: req.headers.get("referer"),
    origin: req.headers.get("origin"),
  };
}

/**
 * Format location as a human-readable string
 * Example: "New York, NY, United States"
 */
export function formatLocation(data: GeoLocationData | null): string {
  if (!data) return "Unknown location";
  
  const parts: string[] = [];
  if (data.city) parts.push(data.city);
  if (data.regionCode) parts.push(data.regionCode);
  if (data.country) parts.push(data.country);
  
  return parts.length > 0 ? parts.join(", ") : "Unknown location";
}

/**
 * Create a minimal location summary for database storage
 */
export function createLocationSummary(data: GeoLocationData | null): Record<string, unknown> {
  if (!data) return {};
  
  return {
    ip: data.ip,
    country: data.country,
    countryCode: data.countryCode,
    region: data.region,
    city: data.city,
    timezone: data.timezone,
    coordinates: data.lat && data.lon ? { lat: data.lat, lon: data.lon } : null,
  };
}

