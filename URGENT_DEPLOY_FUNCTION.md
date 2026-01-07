# ⚠️ URGENT: Deploy Edge Function to Fix NOT_FOUND Error

## The Problem
The error `{"code": "NOT_FOUND", "message": "Requested function was not found"}` means the Edge Function **hasn't been deployed yet**. It exists in your code but not on Supabase servers.

## ✅ Quick Fix (5 minutes)

### Option 1: Supabase Dashboard (EASIEST - No CLI needed)

1. **Open:** https://supabase.com/dashboard/project/ogcnilkuneeqkhmoamxi/functions

2. **Click:** "Create Function" or "New Function"

3. **Enter Function Name:** `tradingview-webhook` (exactly this, lowercase with hyphen)

4. **Copy ALL code from:** `supabase/functions/tradingview-webhook/index.ts`

5. **Paste** into the editor

6. **Click:** "Deploy"

7. **Done!** The function will be live in ~30 seconds

### Option 2: CLI (If you have access token)

```bash
# 1. Login first
npx supabase login

# 2. Deploy
npm run functions:deploy
```

## 📋 Complete Code to Copy

The entire file `supabase/functions/tradingview-webhook/index.ts` contains 157 lines. Copy everything from line 1 to line 157.

**Quick copy path:**
- File: `supabase/functions/tradingview-webhook/index.ts`
- Copy ALL lines (Ctrl+A, Ctrl+C)
- Paste into Supabase Dashboard editor

## ✅ After Deployment

1. The function will be available at:
   ```
   https://ogcnilkuneeqkhmoamxi.supabase.co/functions/v1/tradingview-webhook
   ```

2. The NOT_FOUND error will disappear

3. Your app will automatically use this URL (it's already configured)

## 🔍 Verify It's Deployed

After deploying, you can verify:
1. The function appears in the Edge Functions list
2. You can see function logs
3. Test with a curl command (see DEPLOY_VIA_DASHBOARD.md)

## ⚡ Why This Is Needed

Edge Functions must be deployed to Supabase servers. Having the code locally isn't enough - Supabase needs to host and run it. Once deployed, it's live and accessible via the webhook URL.

---

**The function code is ready - you just need to deploy it!**

