# Quick Fix: "NOT_FOUND" Error for Edge Function

## The Problem
You're getting `{"code": "NOT_FOUND", "message": "Requested function was not found"}` because the Edge Function hasn't been deployed to Supabase yet.

## Solution: Deploy the Edge Function

### Step 1: Authenticate with Supabase CLI

```bash
npx supabase login
```

This will open your browser to authenticate. After authentication, you'll have an access token.

### Step 2: Link Your Project

```bash
npm run db:link
```

Or manually:
```bash
npx supabase link --project-ref ogcnilkuneeqkhmoamxi
```

### Step 3: Deploy the Function

```bash
npm run functions:deploy
```

Or directly:
```bash
npx supabase functions deploy tradingview-webhook
```

### Step 4: Verify

```bash
npm run functions:list
```

You should see `tradingview-webhook` in the list.

## Alternative: Deploy via Supabase Dashboard

If CLI deployment doesn't work, use the dashboard:

1. **Go to Supabase Dashboard:**
   - Visit https://supabase.com/dashboard
   - Select your project (ogcnilkuneeqkhmoamxi)

2. **Navigate to Edge Functions:**
   - Click on **Edge Functions** in the left sidebar
   - Click **Create Function**

3. **Create the Function:**
   - Function name: `tradingview-webhook`
   - Copy the entire code from `supabase/functions/tradingview-webhook/index.ts`
   - Paste it into the editor
   - Click **Deploy**

4. **Set Environment Variables (if needed):**
   - Go to **Project Settings** > **Edge Functions**
   - The `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available
   - No additional setup needed

## Verify the Function Works

After deployment, test it:

```bash
curl -X POST https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/tradingview-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test",
    "strategyId": "test-id",
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 192.34,
    "time": "2026-01-07T12:34:56Z"
  }'
```

You should get a response (even if it's an error about invalid token/strategy, that means the function is deployed and working).

## Expected Function URL

After deployment, your webhook URL will be:
```
https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/tradingview-webhook
```

This is automatically used in the app from your `VITE_SUPABASE_URL` environment variable.

## Troubleshooting

### "Access token not provided"
- Run `npx supabase login` first
- Or add `SUPABASE_ACCESS_TOKEN` to your `.env` file

### "Project not found"
- Make sure you're using the correct project ID: `ogcnilkuneeqkhmoamxi`
- Check your `.env` file has the correct `VITE_SUPABASE_PROJECT_ID`

### Function deployed but still getting NOT_FOUND
- Check the function name matches exactly: `tradingview-webhook`
- Verify the URL in your app matches: `{SUPABASE_URL}/functions/v1/tradingview-webhook`
- Wait a few seconds for the deployment to propagate

## Next Steps

Once deployed:
1. ✅ The webhook will be accessible
2. ✅ TradingView alerts can send signals
3. ✅ Signals will be stored in your database
4. ✅ Dashboard will show incoming signals

