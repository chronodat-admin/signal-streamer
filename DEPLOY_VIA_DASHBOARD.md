# Deploy Edge Function via Supabase Dashboard (Easiest Method)

Since CLI deployment requires authentication, use the Supabase Dashboard to deploy the function.

## Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: **ogcnilkuneeqkhmoamxi**

### Step 2: Navigate to Edge Functions
1. In the left sidebar, click **Edge Functions**
2. Click the **Create Function** button (or **New Function**)

### Step 3: Create the Function
1. **Function Name:** Enter exactly: `tradingview-webhook`
   - ⚠️ **Important:** The name must match exactly (lowercase, with hyphen)

2. **Copy the Code:** Open the file `supabase/functions/tradingview-webhook/index.ts` and copy ALL the code

3. **Paste the Code:** Paste it into the code editor in the dashboard

4. **Click Deploy** button

### Step 4: Verify Deployment
After deployment, you should see:
- ✅ Function appears in the Edge Functions list
- ✅ Status shows as "Active" or "Deployed"
- ✅ You can see function logs

### Step 5: Test the Function
The function URL will be:
```
https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/tradingview-webhook
```

Test it with this curl command (replace with your actual token and strategy ID):
```bash
curl -X POST https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/tradingview-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_SECRET_TOKEN",
    "strategyId": "YOUR_STRATEGY_ID",
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 192.34,
    "time": "2026-01-07T12:34:56Z",
    "interval": "5"
  }'
```

## What Happens After Deployment

✅ The "NOT_FOUND" error will be resolved
✅ TradingView webhooks will work
✅ Signals will be stored in your database
✅ Your app will automatically use the correct webhook URL

## Troubleshooting

### Function name must be exact
- ✅ Correct: `tradingview-webhook`
- ❌ Wrong: `tradingview_webhook` (underscore)
- ❌ Wrong: `TradingView-Webhook` (capital letters)

### If you get errors after deployment
1. Check the function logs in the dashboard
2. Verify the code was copied completely
3. Make sure there are no syntax errors

### Environment Variables
The function automatically has access to:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key

These are set automatically by Supabase - no manual configuration needed!

