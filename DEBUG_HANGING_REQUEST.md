# Debugging Hanging Requests in Postman

When Postman shows "Sending request..." and the cancel button is grayed out, the request is likely timing out. Here's how to debug:

## Step 1: Check Vercel Function Logs (Most Important)

1. Go to **Vercel Dashboard**
2. Select your project: `signal-streamer`
3. Click **Functions** tab
4. Find `/api/tradingview` in the list
5. Click on it to view logs
6. **Send your request again** while watching the logs

**Look for:**
- ❌ `SUPABASE_EDGE_FUNCTION_URL environment variable is not set`
- ❌ `VERCEL_PROXY_SECRET environment variable is not set`
- ❌ `Error parsing request body`
- ❌ `Error in tradingview proxy: [error message]`
- ❌ `Supabase returned error: [error message]`

## Step 2: Check Supabase Edge Function Logs

1. Go to **Supabase Dashboard**
2. Click **Edge Functions** in the sidebar
3. Click on `tradingview-webhook`
4. Click **Logs** tab
5. **Send your request again** while watching the logs

**Look for:**
- ❌ `Request rejected: Missing or invalid x-vercel-proxy-secret header`
- ❌ `Strategy not found`
- ❌ `Invalid token for strategy`
- ❌ Any error messages

## Step 3: Test with cURL (More Verbose)

Use cURL with verbose output to see exactly what's happening:

**Windows cmd.exe:**
```cmd
curl -v -X POST https://signal-streamer.vercel.app/api/tradingview -H "Content-Type: application/json" -d @test-payload.json
```

**PowerShell:**
```powershell
curl -v -X POST https://signal-streamer.vercel.app/api/tradingview -H "Content-Type: application/json" -d @test-payload.json
```

The `-v` flag shows:
- Connection details
- Request headers sent
- Response headers received
- HTTP status code
- Response body
- Any errors

## Step 4: Test if Endpoint is Reachable

First, test if the endpoint responds at all:

```cmd
curl -v -X POST https://signal-streamer.vercel.app/api/tradingview -H "Content-Type: application/json" -d "{}"
```

Even with an empty body, you should get a response (likely an error about missing fields, but it should respond quickly).

## Step 5: Check Postman Settings

In Postman:
1. Go to **Settings** (gear icon)
2. Check **Request timeout** - set it to something reasonable like 30 seconds
3. Try the request again

## Step 6: Verify Environment Variables

### In Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these exist:
   - `SUPABASE_EDGE_FUNCTION_URL` = `https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/tradingview-webhook`
   - `VERCEL_PROXY_SECRET` = (any string value)

### In Supabase:
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Verify:
   - `VERCEL_PROXY_SECRET` exists and matches Vercel value

## Step 7: Check Network/Firewall

If you're behind a corporate firewall or VPN:
- Try disabling VPN
- Check if port 443 (HTTPS) is blocked
- Try from a different network

## Step 8: Test with Minimal Request

Try the simplest possible request to isolate the issue:

```json
{
  "token": "test",
  "strategyId": "00000000-0000-0000-0000-000000000000",
  "signal": "BUY",
  "symbol": "AAPL",
  "price": 100,
  "time": "2026-01-08T00:00:00.000Z"
}
```

This should at least get a response (even if it's an error about invalid token).

## Common Causes

1. **Missing Environment Variables** - Most common cause
   - Fix: Set `SUPABASE_EDGE_FUNCTION_URL` and `VERCEL_PROXY_SECRET` in Vercel
   - Then **redeploy** your Vercel project

2. **Incorrect Supabase URL**
   - Fix: Verify the URL is exactly: `https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/tradingview-webhook`

3. **Supabase Edge Function Not Deployed**
   - Fix: Deploy the `tradingview-webhook` function in Supabase

4. **VERCEL_PROXY_SECRET Mismatch**
   - Fix: Ensure the value in Vercel matches the value in Supabase Edge Function secrets

5. **Network Timeout**
   - Fix: Check your internet connection, try from a different network

## Quick Diagnostic Command

Run this to see if the endpoint is even responding:

```cmd
curl -X POST https://signal-streamer.vercel.app/api/tradingview -H "Content-Type: application/json" -d "{\"test\":\"test\"}" --max-time 10
```

The `--max-time 10` flag will timeout after 10 seconds, so you won't wait forever.

## What to Share for Help

If you need more help, share:
1. **Vercel Function Logs** - Copy/paste the error messages
2. **Supabase Edge Function Logs** - Copy/paste the error messages
3. **cURL verbose output** - The full output from `curl -v`
4. **Environment variables status** - Are they set? (don't share the actual values)



