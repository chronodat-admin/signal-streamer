# Testing TradingView Webhook with Postman

## Step 1: Get Your Strategy Token

You need your strategy's secret token. You can get it from:

1. **From Your App UI (Easiest)**
   - Go to any Strategy Detail page in your app (`/dashboard/strategies/:id`)
   - Click the "Setup" tab
   - Copy the JSON template - it includes your strategy token

## Step 2: Setup Postman Request

### Request Configuration

**Method:** `POST`

**URL:**
```
https://signal-streamer.vercel.app/api/tradingview
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "token": "YOUR_STRATEGY_TOKEN",
  "strategyId": "YOUR_STRATEGY_ID",
  "signal": "BUY",
  "symbol": "AAPL",
  "price": 192.34,
  "time": "2026-01-08T03:00:22.156Z",
  "interval": "5"
}
```
**Note:** Replace `YOUR_STRATEGY_TOKEN` and `YOUR_STRATEGY_ID` with values from your Strategy Detail page → Setup tab.

## Step 3: Postman Setup Details

1. **Create New Request**
   - Click "New" → "HTTP Request"
   - Name it: "TradingView Webhook Test"

2. **Set Method and URL**
   - Method: `POST`
   - URL: `https://signal-streamer.vercel.app/api/tradingview`

3. **Add Headers**
   - Go to "Headers" tab
   - Add:
     - Key: `Content-Type`
     - Value: `application/json`

4. **Add Body**
   - Go to "Body" tab
   - Select "raw"
   - Select "JSON" from dropdown
   - Paste the JSON from Step 2
   - **IMPORTANT:** Make sure you use your actual strategy token and strategyId

5. **Send Request**
   - Click "Send"
   - Check the response

## Expected Responses

### ✅ Success (200 OK)
```json
{
  "success": true,
  "message": "Signal received"
}
```

### ❌ Invalid Token (401 Unauthorized)
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing token"
}
```
**Fix:** Make sure the `token` value in your JSON body matches your strategy's secret token (found in Strategy Detail page).

### ❌ Missing Token (401 Unauthorized)
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing token"
}
```
**Fix:** Make sure you included the `token` field in your JSON body.

## Quick Test Command (cURL)

### For Windows cmd.exe (Command Prompt)

On Windows Command Prompt, you need to use double quotes and escape inner quotes:

```cmd
curl.exe -X POST "https://signal-streamer.vercel.app/api/tradingview" -H "Content-Type: application/json" -d "{\"token\": \"YOUR_STRATEGY_TOKEN\", \"strategyId\": \"YOUR_STRATEGY_ID\", \"signal\": \"BUY\", \"symbol\": \"AAPL\", \"price\": 192.34, \"time\": \"2026-01-08T20:48:30.608Z\", \"interval\": \"5\"}"
```

**Or use a JSON file** (recommended for Windows cmd.exe):

1. Create a file `test-payload.json` with your strategy's token and ID:
```json
{
  "token": "YOUR_STRATEGY_TOKEN",
  "strategyId": "YOUR_STRATEGY_ID",
  "signal": "BUY",
  "symbol": "AAPL",
  "price": 192.34,
  "time": "2026-01-08T20:48:30.608Z",
  "interval": "5"
}
```
**Note:** Get your token and strategyId from the Strategy Detail page → Setup tab.

2. Then run:
```cmd
curl.exe -X POST "https://signal-streamer.vercel.app/api/tradingview" -H "Content-Type: application/json" -d @test-payload.json
```

### For PowerShell (Windows)

PowerShell supports single quotes, so you can use:

```powershell
curl.exe -X POST "https://signal-streamer.vercel.app/api/tradingview" `
  -H "Content-Type: application/json" `
  -d '{
    "token": "YOUR_STRATEGY_TOKEN",
    "strategyId": "YOUR_STRATEGY_ID",
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 192.34,
    "time": "2026-01-08T20:48:30.608Z",
    "interval": "5"
  }'
```

### For Bash/Git Bash/Linux/Mac

```bash
curl -X POST https://signal-streamer.vercel.app/api/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_STRATEGY_TOKEN",
    "strategyId": "YOUR_STRATEGY_ID",
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 192.34,
    "time": "2026-01-08T20:48:30.608Z",
    "interval": "5"
  }'
```

## Troubleshooting

### Request Hangs or Never Completes

If your request shows "Sending request..." and never finishes:

1. **Check Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify these are set:
     - `SUPABASE_EDGE_FUNCTION_URL` (should be: `https://<project-ref>.supabase.co/functions/v1/tradingview-webhook`)
     - `VERCEL_PROXY_SECRET` (any secure random string)

2. **Check Supabase Edge Function:**
   - Go to Supabase Dashboard → Edge Functions
   - Verify `tradingview-webhook` is deployed
   - Go to Edge Functions → Secrets
   - Verify `VERCEL_PROXY_SECRET` is set (must match Vercel value)

3. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Your Project → Functions → `/api/tradingview`
   - Look for error messages in the logs

4. **Check Supabase Edge Function Logs:**
   - Go to Supabase Dashboard → Edge Functions → `tradingview-webhook` → Logs
   - Look for error messages

### Common Error Responses

1. **"Invalid token" error (401):**
   - Get your strategy token from the Strategy Detail page in your app (`/dashboard/strategies/:id` → Setup tab)
   - Make sure there are no extra spaces or quotes
   - The token must match exactly (case-sensitive)

2. **"Strategy not found" error (404):**
   - Verify the `strategyId` is a valid UUID
   - Make sure the strategy exists in your database

3. **"Server configuration error" (500):**
   - Missing `SUPABASE_EDGE_FUNCTION_URL` or `VERCEL_PROXY_SECRET` in Vercel
   - Check Vercel environment variables

4. **"Request must come through Vercel proxy" (401):**
   - `VERCEL_PROXY_SECRET` is set in Supabase but doesn't match Vercel
   - Or the header is missing (should be added automatically by Vercel)

### Still Not Working?

See `TROUBLESHOOTING_WEBHOOK.md` for detailed debugging steps.

