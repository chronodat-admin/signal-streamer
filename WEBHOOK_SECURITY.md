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
         Validates secret                    Validates proxy secret
```

## Environment Variables

### Vercel Environment Variables

Add these in your Vercel project settings (Settings → Environment Variables):

1. **TRADINGVIEW_SECRET**
   - Description: Secret value that TradingView must include in the request body
   - Example: `my-super-secret-key-12345`
   - Used by: Vercel API route to validate TradingView requests

2. **SUPABASE_EDGE_FUNCTION_URL**
   - Description: Full URL to your Supabase Edge Function
   - Example: `https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/tradingview-webhook`
   - Used by: Vercel API route to forward requests

3. **VERCEL_PROXY_SECRET**
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

### Webhook URL

Use your Vercel domain:
```
https://<your-vercel-domain>/api/tradingview
```

### Alert Message (JSON)

Your TradingView alert must include the `secret` field:

```json
{
  "secret": "YOUR_TRADINGVIEW_SECRET",
  "token": "{{strategy.secret_token}}",
  "strategyId": "{{strategy.id}}",
  "signal": "{{strategy.order.action}}",
  "symbol": "{{ticker}}",
  "price": "{{close}}",
  "time": "{{timenow}}",
  "interval": "{{interval}}",
  "alertId": "{{alert.id}}"
}
```

**Important Fields:**
- `secret`: Must match `TRADINGVIEW_SECRET` in Vercel
- `token`: Your strategy's secret token (from the strategy detail page)
- `strategyId`: Your strategy ID (UUID)
- `signal`: Trading action (BUY, SELL, LONG, SHORT)
- `symbol`: Trading symbol (e.g., AAPL, BTCUSD)
- `price`: Current price
- `time`: Timestamp (ISO format recommended)

### TradingView Alert Setup Steps

1. **Create Alert in TradingView**
   - Go to your TradingView chart
   - Click "Alert" button
   - Configure your alert conditions

2. **Configure Webhook**
   - Check "Webhook URL"
   - Enter: `https://<your-vercel-domain>/api/tradingview`
   - In the message field, use the JSON template above
   - Replace `YOUR_TRADINGVIEW_SECRET` with your actual secret

3. **Test the Alert**
   - Save the alert
   - Trigger it manually or wait for conditions to be met
   - Check the Alert Logs page (`/dashboard/logs`) to verify delivery

## Security Features

1. **TradingView Secret Validation**
   - Vercel API route validates `body.secret` matches `TRADINGVIEW_SECRET`
   - Rejects requests with invalid or missing secret (401 Unauthorized)

2. **Proxy Secret Header**
   - Vercel adds `x-vercel-proxy-secret` header when forwarding to Supabase
   - Supabase Edge Function validates this header
   - Prevents direct access to Supabase endpoint (when `VERCEL_PROXY_SECRET` is set)

3. **Project Reference Hidden**
   - Supabase project reference ID is no longer exposed to TradingView
   - Only your Vercel domain is visible

## Testing

### Test with cURL

```bash
curl -X POST https://<your-vercel-domain>/api/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_TRADINGVIEW_SECRET",
    "token": "your-strategy-secret-token",
    "strategyId": "your-strategy-uuid",
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 192.34,
    "time": "2026-01-08T12:00:00Z",
    "interval": "5"
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

**Error (Invalid Secret):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid secret"
}
```

## Troubleshooting

### Issue: 401 Unauthorized from Vercel

**Cause:** Invalid or missing `secret` in request body
**Fix:** Ensure `body.secret` matches `TRADINGVIEW_SECRET` in Vercel

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

