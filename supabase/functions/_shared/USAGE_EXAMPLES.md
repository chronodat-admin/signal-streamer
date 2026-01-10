# Geolocation Utilities - Usage Examples

## Quick Start

### 1. Basic IP and Location Lookup

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getClientIP, getGeoLocation, formatLocation } from "../_shared/index.ts";

serve(async (req) => {
  // Get client IP
  const ip = getClientIP(req);
  console.log(`Request from IP: ${ip}`);

  // Get full location data
  const locationResult = await getGeoLocation(ip);
  
  if (locationResult.success && locationResult.data) {
    const loc = locationResult.data;
    console.log(`Location: ${formatLocation(loc)}`);
    console.log(`Country: ${loc.country} (${loc.countryCode})`);
    console.log(`City: ${loc.city}, ${loc.region}`);
    console.log(`Coordinates: ${loc.lat}, ${loc.lon}`);
    console.log(`Timezone: ${loc.timezone}`);
    console.log(`ISP: ${loc.isp}`);
  }

  return new Response("OK");
});
```

### 2. Using the Audit Logger

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAuditLogger, corsHeaders, handleCors } from "../_shared/index.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCors();
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const auditLogger = createAuditLogger(supabase);

  // Log a login event with location
  const result = await auditLogger.log({
    req,
    userId: "user-uuid-here",
    eventType: "LOGIN",
    metadata: { 
      method: "email",
      success: true 
    },
    includeLocation: true, // This is the default
  });

  if (result.success) {
    console.log(`Event logged with ID: ${result.eventId}`);
    console.log(`User location: ${result.location?.city}, ${result.location?.country}`);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

### 3. Fire-and-Forget Logging

```typescript
// Log without waiting (for non-critical events)
auditLogger.logAsync({
  req,
  userId: user.id,
  eventType: "WEBHOOK_RECEIVED",
  metadata: { strategyId: "abc123" },
});

// Continue processing immediately...
```

### 4. Get All Client Metadata at Once

```typescript
import { getClientMetadata } from "../_shared/index.ts";

const metadata = await getClientMetadata(req);
console.log({
  ip: metadata.ip,
  userAgent: metadata.userAgent,
  country: metadata.location?.country,
  city: metadata.location?.city,
  referer: metadata.referer,
  origin: metadata.origin,
});
```

### 5. Store Location Summary in Database

```typescript
import { getUserLocationData, createLocationSummary } from "../_shared/index.ts";

const locationResult = await getUserLocationData(req);
const locationSummary = createLocationSummary(locationResult.data);

// Insert into your table with location as JSON
await supabase.from("some_table").insert({
  user_id: userId,
  data: someData,
  location_metadata: locationSummary,
  // Results in: { ip, country, countryCode, region, city, timezone, coordinates }
});
```

## API Response Format

### GeoLocationData

```typescript
interface GeoLocationData {
  ip: string;
  country: string | null;      // "United States"
  countryCode: string | null;  // "US"
  region: string | null;       // "California"
  regionCode: string | null;   // "CA"
  city: string | null;         // "San Francisco"
  zip: string | null;          // "94102"
  lat: number | null;          // 37.7749
  lon: number | null;          // -122.4194
  timezone: string | null;     // "America/Los_Angeles"
  isp: string | null;          // "Comcast"
  org: string | null;          // "Comcast Cable"
  as: string | null;           // "AS7922 Comcast"
  mobile: boolean | null;      // false
  proxy: boolean | null;       // false (VPN/proxy detection)
  hosting: boolean | null;     // false (datacenter/hosting detection)
}
```

## Rate Limits

The default provider (ip-api.com) allows:
- **45 requests per minute** (free tier)
- No API key required

For higher limits, consider:
- **ipinfo.io**: 50K/month free with API key
- **ipapi.co**: 30K/month free
- **MaxMind GeoLite2**: Unlimited (local database, requires setup)

## Best Practices

1. **Cache results** for the same IP if you're making multiple calls
2. **Don't block** on geolocation for time-sensitive operations - use `logAsync()`
3. **Handle failures gracefully** - location lookup can fail
4. **Respect privacy** - inform users you collect location data

