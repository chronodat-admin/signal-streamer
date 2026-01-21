# Troubleshooting Webhook Issues

## Common Issues and Solutions

### Issue: Request Hangs or Shows "Sending request..." Forever

This usually means one of these problems:

#### 1. **Missing Environment Variables in Vercel**

The `/api/tradingview` endpoint requires these environment variables:

- `SUPABASE_EDGE_FUNCTION_URL` - Full URL to your Supabase Edge Function
- `VERCEL_PROXY_SECRET` - Secret for proxy authentication

**Check:**
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Verify both variables are set for your environment (Production, Preview, Development)

**Expected Error Response:**
```json
{
  "error": "Server configuration error",
  "message": "SUPABASE_EDGE_FUNCTION_URL is not configured"
}
```
or
```json
{
  "error": "Server configuration error",
  "message": "VERCEL_PROXY_SECRET is not configured"
}
```

#### 2. **Incorrect Supabase Edge Function URL**

The `SUPABASE_EDGE_FUNCTION_URL` should be:
```
https://<your-project-ref>.supabase.co/functions/v1/tradingview-webhook
```

**To find your project ref:**
1. Go to Supabase Dashboard
2. Project Settings → API
3. Your project URL will be: `https://<project-ref>.supabase.co`

**Verify the Edge Function exists:**
1. Go to Supabase Dashboard
2. Edge Functions → Check if `tradingview-webhook` is deployed

#### 3. **Missing VERCEL_PROXY_SECRET in Supabase**

The Supabase Edge Function also needs `VERCEL_PROXY_SECRET`:

1. Go to Supabase Dashboard
2. Edge Functions → Secrets
3. Add `VERCEL_PROXY_SECRET` with the same value as in Vercel

**Expected Error Response:**
```json
{
  "error": "Unauthorized",
  "message": "Request must come through Vercel proxy"
}
```

#### 4. **Invalid Strategy Token**

The token in your request must match the strategy's `secret_token` in the database.

**Expected Error Response:**
```json
{
  "error": "Invalid token"
}
```

**Fix:**
1. Go to your app: `/dashboard/strategies/:id`
2. Click "Setup" tab
3. Copy the exact token from the JSON template

#### 5. **Strategy Not Found**

The `strategyId` must be a valid UUID that exists in your database.

**Expected Error Response:**
```json
{
  "error": "Strategy not found"
}
```

#### 6. **Strategy Deleted**

The strategy might be soft-deleted.

**Expected Error Response:**
```json
{
  "error": "Strategy has been deleted"
}
```

## How to Debug

### Step 1: Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Your Project → Functions → `/api/tradingview`
3. Check the logs for errors

Look for:
- `SUPABASE_EDGE_FUNCTION_URL environment variable is not set`
- `VERCEL_PROXY_SECRET environment variable is not set`
- `Error parsing request body`
- `Supabase returned error`

### Step 2: Check Supabase Edge Function Logs

1. Go to Supabase Dashboard
2. Edge Functions → `tradingview-webhook` → Logs
3. Check for errors

Look for:
- `Request rejected: Missing or invalid x-vercel-proxy-secret header`
- `Strategy not found`
- `Invalid token for strategy`

### Step 3: Test with cURL and Verbose Output

Use `-v` flag to see detailed request/response:

**Windows cmd.exe:**
```cmd
curl -v -X POST https://trademoq.com/api/tradingview -H "Content-Type: application/json" -d @test-payload.json
```

**PowerShell/Bash:**
```bash
curl -v -X POST https://trademoq.com/api/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "token": "86675b5056c776ec0f5bbec0ab75bc0701db80f4e4f3d5745b1900f65800006b",
    "strategyId": "6fa876bc-cd7e-4d88-8780-00bbd979fb16",
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 192.34,
    "time": "2026-01-08T20:48:30.608Z",
    "interval": "5",
    "source": "trendspider"
  }'
```

The `-v` flag will show:
- HTTP status code
- Response headers
- Response body
- Connection details

### Step 4: Verify Request Format

Your JSON must include all required fields:
- ✅ `token` (string)
- ✅ `strategyId` (UUID string)
- ✅ `signal` (string: "BUY", "SELL", "LONG", "SHORT")
- ✅ `symbol` (string)
- ✅ `price` (number)
- ✅ `time` (ISO 8601 string)
- ⚪ `interval` (optional string)
- ⚪ `alertId` (optional string)
- ⚪ `source` (optional string: "trendspider", "tradingview", "api", "manual", "other")

## Quick Checklist

- [ ] `SUPABASE_EDGE_FUNCTION_URL` is set in Vercel
- [ ] `VERCEL_PROXY_SECRET` is set in Vercel
- [ ] `VERCEL_PROXY_SECRET` is set in Supabase Edge Function secrets
- [ ] Supabase Edge Function `tradingview-webhook` is deployed
- [ ] The token matches your strategy's `secret_token`
- [ ] The `strategyId` is a valid UUID that exists
- [ ] The strategy is not deleted (`is_deleted = false`)
- [ ] Request has `Content-Type: application/json` header
- [ ] JSON body is valid and includes all required fields

## Test URLs

Make sure you're using the correct URL:

- **Custom Domain:** `https://trademoq.com/api/tradingview`
- **Custom Domain:** `https://trademoq.com/api/tradingview`

Both should work if configured correctly.





