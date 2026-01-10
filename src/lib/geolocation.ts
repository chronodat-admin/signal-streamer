/**
 * Client-side Geolocation Utility
 * 
 * Uses free IP geolocation APIs to get user location data.
 * This is called on login to track user location.
 */

export interface GeoLocationData {
  ip: string;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  lat: number | null;
  lon: number | null;
}

/**
 * Fetch user's geolocation data based on their IP address
 * Uses ip-api.com (free, no API key required, 45 req/min limit)
 */
export async function fetchUserLocation(): Promise<GeoLocationData | null> {
  try {
    // ip-api.com automatically detects the client's IP
    const response = await fetch(
      'http://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,query',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[GEOLOCATION] HTTP error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status === 'fail') {
      console.error('[GEOLOCATION] API error:', data.message);
      return null;
    }

    return {
      ip: data.query || 'unknown',
      country: data.country || null,
      countryCode: data.countryCode || null,
      region: data.regionName || null,
      city: data.city || null,
      timezone: data.timezone || null,
      lat: data.lat || null,
      lon: data.lon || null,
    };
  } catch (error) {
    console.error('[GEOLOCATION] Error fetching location:', error);
    return null;
  }
}

/**
 * Alternative: Use ipapi.co (HTTPS, 30K/month free)
 * Uncomment if you need HTTPS support
 */
export async function fetchUserLocationHttps(): Promise<GeoLocationData | null> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[GEOLOCATION] HTTP error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.error('[GEOLOCATION] API error:', data.reason);
      return null;
    }

    return {
      ip: data.ip || 'unknown',
      country: data.country_name || null,
      countryCode: data.country_code || null,
      region: data.region || null,
      city: data.city || null,
      timezone: data.timezone || null,
      lat: data.latitude || null,
      lon: data.longitude || null,
    };
  } catch (error) {
    console.error('[GEOLOCATION] Error fetching location:', error);
    return null;
  }
}

