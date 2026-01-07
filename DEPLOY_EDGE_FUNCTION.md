# Deploy Edge Function - Fix "NOT_FOUND" Error

The "NOT_FOUND" error occurs because the Edge Function hasn't been deployed to Supabase yet. Follow these steps to deploy it.

## Quick Deploy

### Option 1: Using Access Token (Recommended)

1. **Login to Supabase CLI:**
   ```bash
   npx supabase login
   ```

2. **Link your project (if not already linked):**
   ```bash
   npm run db:link
   ```

3. **Deploy the function:**
   ```bash
   npm run functions:deploy
   ```

   Or directly:
   ```bash
   npx supabase functions deploy tradingview-webhook
   ```

### Option 2: Using Database Password

If you have the database password in `.env`, you can deploy using:

```bash
# Set environment variables
set SUPABASE_ACCESS_TOKEN=your_token_here

# Or use the database connection
npx supabase functions deploy tradingview-webhook --project-ref ogcnilkuneeqkhmoamxi
```

## Verify Deployment

After deployment, verify the function is live:

```bash
npm run functions:list
```

You should see `tradingview-webhook` in the list.

## Test the Function

Once deployed, test it with curl:

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

## Troubleshooting

### Error: "Access token not provided"
- Run `npx supabase login` first
- Or set `SUPABASE_ACCESS_TOKEN` in your environment

### Error: "Project not linked"
- Run `npm run db:link` to link your project
- Or use `--project-ref ogcnilkuneeqkhmoamxi` flag

### Error: "Function already exists"
- The function is already deployed
- Use `--no-verify-jwt` if you need to update it without JWT verification

## Function URL

After deployment, your webhook URL will be:
```
https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/tradingview-webhook
```

This URL is automatically constructed in the app from `VITE_SUPABASE_URL`.

## Environment Variables

The Edge Function needs these environment variables (set automatically by Supabase):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (set in Supabase dashboard)

These are automatically available when the function runs on Supabase.

## Manual Deployment via Dashboard

Alternatively, you can deploy via Supabase Dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions**
4. Click **Create Function**
5. Name it `tradingview-webhook`
6. Copy the code from `supabase/functions/tradingview-webhook/index.ts`
7. Paste and deploy

