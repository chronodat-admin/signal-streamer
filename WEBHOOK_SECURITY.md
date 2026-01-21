# Secure Webhook Proxy Setup

This document explains how to use the secure Vercel proxy for TradingView webhooks instead of exposing your Supabase Edge Function URL directly.

## Overview

Instead of calling the Supabase Edge Function directly:
```
❌ https://<project-ref>.supabase.co/functions/v1/tradingview-webhook
```

TradingView should now call the secure Vercel proxy:
```
✅ https://<your-vercel-domain>/api/tradingview
```

## Architecture

```
TradingView → Vercel API Route (/api/tradingview) → Supabase Edge Function
                ↓                                        ↓
         Forwards request                    Validates proxy secret & strategy token
```

## Environment Variables

### Vercel Environment Variables

Add these in your Vercel project settings (Settings → Environment Variables):

1. **SUPABASE_EDGE_FUNCTION_URL**
   - Description: Full URL to your Supabase Edge Function
   - Example: `https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/tradingview-webhook`
   - Used by: Vercel API route to forward requests

2. **VERCEL_PROXY_SECRET**
   - Description: Secret for the proxy header authentication
   - Example: `vercel-proxy-secret-abc123`
   - Used by: Both Vercel API route (to send) and Supabase Edge Function (to validate)

### Supabase Edge Function Secrets

Add this in your Supabase project (Settings → Edge Functions → Secrets):

1. **VERCEL_PROXY_SECRET**
   - Description: Must match the value in Vercel
   - Example: `vercel-proxy-secret-abc123`
   - Used by: Supabase Edge Function to validate requests from Vercel proxy

## TradingView Alert Configuration

### Getting Your Strategy Token

The strategy `token` is required in your TradingView alert JSON. You can get it from:

1. **From the UI (Recommended)**
   - Go to any Strategy Detail page (`/dashboard/strategies/:id`)
   - Click on the "Setup" tab
   - Copy the JSON template - it includes your strategy token

### Webhook URL

Use your Vercel domain:
```
https://<your-vercel-domain>/api/tradingview
```

### Alert Message (JSON)

Your TradingView alert must include the `secret` field:

```json
{
  "token": "{{strategy.secret_token}}",
  "strategyId": "{{strategy.id}}",
  "signal": "{{strategy.order.action}}",
  "symbol": "{{ticker}}",
  "price": "{{close}}",
  "time": "{{timenow}}",
  "interval": "{{interval}}",
  "alertId": "{{alert.id}}",
  "source": "trendspider"
}
```

**Important Fields:**
- `token`: Your strategy's secret token (automatically populated in the UI template)
- `strategyId`: Your strategy ID (UUID)
- `signal`: Trading action (BUY, SELL, LONG, SHORT)
- `symbol`: Trading symbol (e.g., AAPL, BTCUSD)
- `price`: Current price
- `time`: Timestamp (ISO format recommended)
- `source`: Source of the signal (e.g., "trendspider", "tradingview", "api", "manual", "other")

### TradingView Alert Setup Steps

1. **Create Alert in TradingView**
   - Go to your TradingView chart
   - Click "Alert" button
   - Configure your alert conditions

2. **Configure Webhook**
   - Check "Webhook URL"
   - Enter: `https://<your-vercel-domain>/api/tradingview`
   - In the message field, use the JSON template above
   - The template is available on the Strategy Detail page (`/dashboard/strategies/:id`) in the "Setup" tab

3. **Test the Alert**
   - Save the alert
   - Trigger it manually or wait for conditions to be met
   - Check the Alert Logs page (`/dashboard/logs`) to verify delivery

## Security Features

1. **Proxy Secret Header**
   - Vercel adds `x-vercel-proxy-secret` header when forwarding to Supabase
   - Supabase Edge Function validates this header
   - Prevents direct access to Supabase endpoint (when `VERCEL_PROXY_SECRET` is set)

2. **Strategy Token Validation**
   - Supabase Edge Function validates the strategy token
   - Ensures requests are for valid strategies
   - Rejects requests with invalid tokens

3. **Rate Limiting**
   - Prevents abuse with plan-based rate limits
   - FREE: 1 request/second per strategy
   - PRO: 5 requests/second per strategy
   - ELITE: 20 requests/second per strategy

4. **User Isolation**
   - Row-Level Security (RLS) policies ensure users can only access their own data
   - Signals are isolated by user_id

5. **Project Reference Hidden**
   - Supabase project reference ID is no longer exposed to TradingView
   - Only your Vercel domain is visible

## Testing

### Test with cURL

```bash
curl -X POST https://<your-vercel-domain>/api/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-strategy-secret-token",
    "strategyId": "your-strategy-uuid",
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 192.34,
    "time": "2026-01-08T12:00:00Z",
    "interval": "5",
    "source": "trendspider"
  }'
```

### Expected Response

**Success:**
```json
{
  "success": true,
  "message": "Signal received"
}
```

**Error (Invalid Token):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing token"
}
```

## Troubleshooting

### Issue: Authentication Required Page (Vercel Deployment Protection)

**Cause:** Vercel deployment protection is enabled, blocking webhook access
**Symptoms:** You see an "Authentication Required" page when accessing `/api/tradingview`
**Fix:** 
1. Go to Vercel Dashboard → Your Project → Settings → Deployment Protection
2. Disable deployment protection for Production deployments
3. The endpoint is still secured by `TRADINGVIEW_SECRET` validation
4. See [VERCEL_DEPLOYMENT_PROTECTION.md](./VERCEL_DEPLOYMENT_PROTECTION.md) for detailed instructions

### Issue: 401 Unauthorized from Supabase

**Cause:** Invalid or missing `token` in request body
**Fix:** Ensure `body.token` matches your strategy's secret token (found in Strategy Detail page)

### Issue: 401 Unauthorized from Supabase

**Cause:** Missing or invalid `x-vercel-proxy-secret` header
**Fix:** 
- Ensure `VERCEL_PROXY_SECRET` is set in both Vercel and Supabase
- Values must match exactly

### Issue: 500 Server Error

**Cause:** Missing environment variables
**Fix:** Verify all required environment variables are set in Vercel

### Issue: No invocations in Supabase

**Cause:** Vercel proxy might not be forwarding requests
**Fix:** 
- Check Vercel function logs
- Verify `SUPABASE_EDGE_FUNCTION_URL` is correct
- Check network connectivity

## Migration from Direct Supabase URL

If you're currently using the direct Supabase URL:

1. **Update TradingView Alerts**
   - Change webhook URL from Supabase to Vercel
   - Add `secret` field to alert message JSON

2. **Set Environment Variables**
   - Add all required variables in Vercel
   - Add `VERCEL_PROXY_SECRET` in Supabase

3. **Test**
   - Send a test webhook
   - Verify it works through the proxy

4. **Optional: Enforce Proxy**
   - Once verified, the Supabase Edge Function will reject direct requests (when `VERCEL_PROXY_SECRET` is set)
   - This ensures all requests go through the secure proxy

## Backward Compatibility

The Supabase Edge Function supports both:
- **Direct access** (when `VERCEL_PROXY_SECRET` is not set) - for backward compatibility
- **Proxy access** (when `VERCEL_PROXY_SECRET` is set) - requires `x-vercel-proxy-secret` header

This allows gradual migration without breaking existing integrations.

