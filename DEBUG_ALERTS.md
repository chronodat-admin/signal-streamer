# Debugging Alert Delivery Issues

## Problem: No Invocations on send-alerts Function

If the `send-alerts` function shows no invocations, it means it's never being called. Here's how to debug:

## Step 1: Check tradingview-webhook Logs

1. Go to: https://supabase.com/dashboard/project/ogcnilkuneeqkhmoamxi/functions
2. Click on `tradingview-webhook` → "Logs" tab
3. Look for these messages:
   - `"Triggering alerts for signal ..."`
   - `"Calling send-alerts at: ..."`
   - `"send-alerts response status: ..."`
   - Any error messages

## Step 2: Verify Signal Insertion

Check if signals are being inserted:
1. Go to your database → `signals` table
2. Check if new signals are being created when you send a webhook
3. Note the `id` of a recent signal

## Step 3: Check Integration Setup

1. Go to `/dashboard/integrations` in your app
2. Verify you have at least one integration:
   - **Enabled** (`enabled = true`)
   - **Active** (`status = 'active'`)
   - Has a valid `webhook_url` (for Discord/Slack)
   - Either `strategy_id` matches your strategy OR `strategy_id` is NULL (for all strategies)

## Step 4: Test Manually

You can test the send-alerts function directly:

```bash
curl -X POST https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/send-alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{
    "signal_id": "YOUR_SIGNAL_ID",
    "strategy_id": "YOUR_STRATEGY_ID"
  }'
```

Replace:
- `YOUR_SIGNAL_ID` with an actual signal ID from your database
- `YOUR_STRATEGY_ID` with an actual strategy ID
- `YOUR_SERVICE_ROLE_KEY` with your Supabase service role key

## Common Issues

### Issue 1: insertedSignal is null
**Symptom**: Logs show "No signal ID found, cannot trigger alerts"
**Fix**: The signal insertion might be failing or the query to fetch it is wrong

### Issue 2: Fetch is failing silently
**Symptom**: No error in logs but send-alerts never called
**Fix**: Check the fetch URL and authentication headers

### Issue 3: No integrations found
**Symptom**: send-alerts is called but logs show "No active integrations found"
**Fix**: 
- Check integration `enabled` and `status` fields
- Verify `strategy_id` matches or is NULL
- Check `user_id` matches the strategy owner

### Issue 4: Discord webhook URL invalid
**Symptom**: Logs show Discord webhook failed with 404 or 401
**Fix**: 
- Verify the Discord webhook URL is correct
- Check if the webhook was deleted in Discord
- Create a new webhook URL in Discord

## Next Steps

1. **Send a test signal** from TradingView or using curl
2. **Check tradingview-webhook logs** to see if it's trying to call send-alerts
3. **Check send-alerts logs** (if it gets called) to see what's happening
4. **Check Alert Logs page** (`/dashboard/logs`) to see if any logs are created
5. **Verify your integration** is properly configured

## Expected Flow

1. TradingView sends webhook → `tradingview-webhook` function
2. Signal inserted into database
3. `tradingview-webhook` calls `send-alerts` function
4. `send-alerts` finds active integrations
5. `send-alerts` sends Discord webhook
6. Log entry created in `alert_logs` table
7. Log appears in `/dashboard/logs` page

If any step fails, check the logs for that step.

