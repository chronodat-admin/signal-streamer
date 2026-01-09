# How to Disable Vercel Deployment Protection

## Quick Steps

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in if needed

2. **Select Your Project**
   - Find and click on: `signal-streamer`

3. **Navigate to Settings**
   - Click on the **Settings** tab in the project navigation

4. **Go to Deployment Protection**
   - In the left sidebar, click on **Deployment Protection**
   - Or scroll down to find the "Deployment Protection" section

5. **Disable for Production**
   - Find the toggle for **"Enable Deployment Protection"**
   - Turn it **OFF** for Production deployments
   - You can keep it enabled for Preview deployments if you want

6. **Save Changes**
   - Click **Save** or the changes will auto-save

7. **Test the Endpoint**
   ```bash
   curl -X POST https://signal-streamer-btgso6013-chronodat.vercel.app/api/tradingview \
     -H "Content-Type: application/json" \
     -d '{
       "secret": "YOUR_TRADINGVIEW_SECRET",
       "token": "86675b5056c776ec0f5bbec0ab75bc0701db80f4e4f3d5745b1900f65800006b",
       "strategyId": "6fa876bc-cd7e-4d88-8780-00bbd979fb16",
       "signal": "BUY",
       "symbol": "AAPL",
       "price": 192.34,
       "time": "2026-01-08T03:00:22.156Z",
       "interval": "5"
     }'
   ```

## Visual Guide

```
Vercel Dashboard
  └── Your Project (signal-streamer)
      └── Settings (tab)
          └── Deployment Protection (left sidebar)
              └── [Toggle OFF for Production]
```

## Alternative: Direct URL

If you can't find it in Settings, try this direct URL pattern:
```
https://vercel.com/[your-team]/signal-streamer/settings/deployment-protection
```

## What Happens After Disabling

- ✅ `/api/tradingview` will be publicly accessible
- ✅ TradingView webhooks will work
- ✅ Endpoint is still secured by `TRADINGVIEW_SECRET` validation
- ✅ All other security measures remain in place

## Security Reminder

The endpoint is still secure because:
- Secret validation (`TRADINGVIEW_SECRET`)
- Strategy token validation
- Rate limiting
- User isolation (RLS)
- Proxy secret header validation

Deployment protection is just an extra layer that's not needed for this use case.





