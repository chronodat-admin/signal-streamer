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
https://signal-streamer-btgso6013-chronodat.vercel.app/api/tradingview
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "token": "86675b5056c776ec0f5bbec0ab75bc0701db80f4e4f3d5745b1900f65800006b",
  "strategyId": "6fa876bc-cd7e-4d88-8780-00bbd979fb16",
  "signal": "BUY",
  "symbol": "AAPL",
  "price": 192.34,
  "time": "2026-01-08T03:00:22.156Z",
  "interval": "5"
}
```

## Step 3: Postman Setup Details

1. **Create New Request**
   - Click "New" → "HTTP Request"
   - Name it: "TradingView Webhook Test"

2. **Set Method and URL**
   - Method: `POST`
   - URL: `https://signal-streamer-btgso6013-chronodat.vercel.app/api/tradingview`

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
curl -X POST https://signal-streamer-q4xlfsoyz-chronodat.vercel.app/api/tradingview -H "Content-Type: application/json" -d "{\"token\": \"86675b5056c776ec0f5bbec0ab75bc0701db80f4e4f3d5745b1900f65800006b\", \"strategyId\": \"6fa876bc-cd7e-4d88-8780-00bbd979fb16\", \"signal\": \"BUY\", \"symbol\": \"AAPL\", \"price\": 192.34, \"time\": \"2026-01-08T20:48:30.608Z\", \"interval\": \"5\"}"
```

**Or use a JSON file** (recommended for Windows cmd.exe):

1. Create a file `test-payload.json`:
```json
{
  "token": "86675b5056c776ec0f5bbec0ab75bc0701db80f4e4f3d5745b1900f65800006b",
  "strategyId": "6fa876bc-cd7e-4d88-8780-00bbd979fb16",
  "signal": "BUY",
  "symbol": "AAPL",
  "price": 192.34,
  "time": "2026-01-08T20:48:30.608Z",
  "interval": "5"
}
```

2. Then run:
```cmd
curl -X POST https://signal-streamer-q4xlfsoyz-chronodat.vercel.app/api/tradingview -H "Content-Type: application/json" -d @test-payload.json
```

### For PowerShell (Windows)

PowerShell supports single quotes, so you can use:

```powershell
curl -X POST https://signal-streamer-q4xlfsoyz-chronodat.vercel.app/api/tradingview `
  -H "Content-Type: application/json" `
  -d '{
    "token": "86675b5056c776ec0f5bbec0ab75bc0701db80f4e4f3d5745b1900f65800006b",
    "strategyId": "6fa876bc-cd7e-4d88-8780-00bbd979fb16",
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 192.34,
    "time": "2026-01-08T20:48:30.608Z",
    "interval": "5"
  }'
```

### For Bash/Git Bash/Linux/Mac

```bash
curl -X POST https://signal-streamer-q4xlfsoyz-chronodat.vercel.app/api/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "token": "86675b5056c776ec0f5bbec0ab75bc0701db80f4e4f3d5745b1900f65800006b",
    "strategyId": "6fa876bc-cd7e-4d88-8780-00bbd979fb16",
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 192.34,
    "time": "2026-01-08T20:48:30.608Z",
    "interval": "5"
  }'
```

## Troubleshooting

1. **"Invalid token" error:**
   - Get your strategy token from the Strategy Detail page in your app
   - Make sure there are no extra spaces or quotes
   - The token must match exactly (case-sensitive)

2. **Still not working?**
   - Check Vercel function logs for detailed error messages
   - Verify all environment variables are set correctly

