# Vercel Deployment Protection Issue

## Problem

The `/api/tradingview` endpoint is protected by Vercel's deployment protection, which requires authentication. This prevents TradingView webhooks from accessing the endpoint.

## Solutions

### Option 1: Disable Deployment Protection (Recommended for Production)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Deployment Protection**
3. Disable deployment protection for your production deployments
4. Keep it enabled for preview deployments if needed

**Note:** The endpoint is still secured by the `TRADINGVIEW_SECRET` validation, so disabling deployment protection doesn't compromise security.

### Option 2: Use Production Domain Without Protection

If you have a custom domain:
1. Configure your custom domain in Vercel
2. Ensure deployment protection is disabled for the production domain
3. Use the custom domain for TradingView webhooks instead of the Vercel preview URL

### Option 3: Use Supabase Edge Function Directly (Fallback)

If you cannot disable deployment protection, you can use the Supabase Edge Function directly:

1. **Update TradingView alerts** to use:
   ```
   https://<your-supabase-project>.supabase.co/functions/v1/tradingview-webhook
   ```

2. **Remove the secret validation** from the Vercel proxy (since you're bypassing it)

3. **Note:** This exposes your Supabase project reference ID, but the endpoint is still secured by the proxy secret header validation.

### Option 4: Use Vercel Bypass Token (Not Recommended for Production)

You can generate a bypass token, but this is not practical for TradingView webhooks as:
- The token needs to be included in the URL
- It's meant for temporary access, not production use
- TradingView cannot dynamically add tokens to webhook URLs

## Recommended Solution

**Disable deployment protection** for your production environment. The `/api/tradingview` endpoint is already secured by:
- Secret validation (`TRADINGVIEW_SECRET`)
- POST-only method restriction
- JSON validation
- Proxy secret header to Supabase

These security measures are sufficient, and deployment protection adds unnecessary friction for webhook integrations.

## Steps to Fix

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `signal-streamer`
3. Go to **Settings** → **Deployment Protection**
4. Toggle off **"Enable Deployment Protection"** for Production
5. Save changes
6. Test the webhook endpoint:
   ```bash
   curl -X POST https://signal-streamer-btgso6013-chronodat.vercel.app/api/tradingview \
     -H "Content-Type: application/json" \
     -d '{
       "secret": "YOUR_TRADINGVIEW_SECRET",
       "token": "your-token",
       "strategyId": "your-strategy-id",
       "signal": "BUY",
       "symbol": "AAPL",
       "price": 192.34,
       "time": "2026-01-08T03:00:22.156Z",
       "interval": "5"
     }'
   ```

## Security Note

Even with deployment protection disabled, your endpoint remains secure because:
- ✅ TradingView secret validation (`TRADINGVIEW_SECRET`)
- ✅ Strategy token validation (in Supabase)
- ✅ Rate limiting (in Supabase)
- ✅ User isolation (RLS policies)
- ✅ Proxy secret header validation

Deployment protection is primarily for preventing unauthorized access to preview deployments, not for securing production API endpoints.



