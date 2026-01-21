# Environment Variables Verification

## Required Vercel Environment Variables

Based on your Supabase project, set these in Vercel:

### 1. SUPABASE_EDGE_FUNCTION_URL
```
https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/tradingview-webhook
```

### 2. VERCEL_PROXY_SECRET
Set this to any secure random string (e.g., `vercel-proxy-secret-abc123`)

**Important:** This value must match the `VERCEL_PROXY_SECRET` secret in your Supabase Edge Function.

## How to Set in Vercel

1. Go to Vercel Dashboard
2. Select your project: `signal-streamer`
3. Settings → Environment Variables
4. Add/Update:
   - **Key:** `SUPABASE_EDGE_FUNCTION_URL`
   - **Value:** `https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/tradingview-webhook`
   - **Environment:** Production, Preview, Development (select all)
   
   - **Key:** `VERCEL_PROXY_SECRET`
   - **Value:** `[your-secret-string]` (use the same value in Supabase)
   - **Environment:** Production, Preview, Development (select all)

5. **Redeploy** your Vercel project after adding/updating environment variables

## Required Supabase Edge Function Secret

1. Go to Supabase Dashboard
2. Edge Functions → Secrets
3. Add/Update:
   - **Key:** `VERCEL_PROXY_SECRET`
   - **Value:** `[same-value-as-vercel]` (must match exactly)

## Test After Configuration

Once both are set, test with:

```cmd
curl -v -X POST https://trademoq.com/api/tradingview -H "Content-Type: application/json" -d @test-payload.json
```

You should see a response instead of hanging.





