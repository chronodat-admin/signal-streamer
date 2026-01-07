# Get Access Token and Deploy Function

## Option 1: Quick Dashboard Deploy (Easiest - 2 minutes)

**No token needed!** Just use the Supabase Dashboard:

1. **Open:** https://supabase.com/dashboard/project/ogcnilkuneeqkhmoamxi/functions
2. **Click:** "Create Function"
3. **Name:** `tradingview-webhook`
4. **Copy code from:** `supabase/functions/tradingview-webhook/index.ts`
5. **Paste and Deploy**

Done! ✅

---

## Option 2: Get Token and Deploy via Script

### Step 1: Get Access Token

**Method A: Via CLI (Opens Browser)**
```bash
npx supabase login
```
This opens your browser. After login, the token is saved locally.

**Method B: Via Dashboard**
1. Go to: https://supabase.com/dashboard/account/tokens
2. Click "Generate New Token"
3. Copy the token

### Step 2: Add Token to .env

Add this line to your `.env` file:
```env
SUPABASE_ACCESS_TOKEN=your_token_here
```

### Step 3: Deploy

```bash
node deploy-function.js
```

Or use npm script:
```bash
npm run functions:deploy
```

---

## Option 3: Manual CLI Deploy

After getting token (Step 1 above):

```bash
# Set token in environment
set SUPABASE_ACCESS_TOKEN=your_token_here

# Deploy
npm run functions:deploy
```

---

## Which Method Should You Use?

- **Dashboard (Option 1)** - Fastest, no setup needed
- **Script (Option 2)** - Automated, good for future updates
- **CLI (Option 3)** - Standard Supabase workflow

**Recommendation:** Use Option 1 (Dashboard) for first deployment, then Option 2 for updates.

