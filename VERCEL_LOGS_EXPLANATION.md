# Vercel Logs Explanation

## Why Vercel Logs Are Empty

Your app is a **static React application** built with Vite. This means:

1. **No Server-Side Code on Vercel**: The app is just HTML, CSS, and JavaScript files served statically
2. **Backend Runs on Supabase**: All your backend logic (Edge Functions, database) runs on Supabase, not Vercel
3. **Vercel Only Serves Files**: Vercel just serves the built files - there's no server-side code to log

## Where to Find Logs

### ✅ For Alert/Webhook Logs (What You Need)

**Use the Alert Logs Page:**
- Go to: `/dashboard/logs` in your app
- This shows all alert sending attempts with full details
- Includes: success/error status, HTTP responses, error messages

**Or Supabase Edge Function Logs:**
- Go to: https://supabase.com/dashboard/project/ogcnilkuneeqkhmoamxi/functions
- Click on `send-alerts` function
- Click "Logs" tab
- This shows real-time function execution logs

### ✅ For Build Logs

**Vercel Dashboard:**
- Go to: https://vercel.com/dashboard
- Select your project
- Click on a deployment
- View "Build Logs" tab
- These show build-time logs (npm install, vite build, etc.)

### ✅ For Runtime Errors (Client-Side)

**Browser Console:**
- Open browser DevTools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for failed API calls

**Vercel Function Logs (if you add serverless functions):**
- Only relevant if you add Vercel Serverless Functions
- Currently not used in this project

## What Vercel Logs Show

Vercel logs will only show:
- ✅ Build logs (when deploying)
- ✅ Deployment status
- ❌ NOT runtime application logs (those are in Supabase)
- ❌ NOT alert sending logs (those are in the Alert Logs page)

## Recommended: Use Alert Logs Page

For debugging Discord alerts, use:
1. **Alert Logs Page** (`/dashboard/logs`) - Best option, shows all alert attempts
2. **Supabase Edge Function Logs** - Real-time function execution

## How to View Supabase Edge Function Logs

1. Go to: https://supabase.com/dashboard/project/ogcnilkuneeqkhmoamxi/functions
2. Click on `send-alerts` function
3. Click "Logs" tab
4. You'll see real-time logs as alerts are sent

These logs include:
- Function invocations
- Console.log statements
- Errors and stack traces
- Request/response details

