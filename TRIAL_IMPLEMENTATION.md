# 15-Day Trial Implementation Summary

## Changes Made

### ✅ UI Updates
1. **Pricing.tsx**
   - Changed Free plan period from "forever" to "/15-day trial"
   - Updated description to "15-day free trial, then upgrade required"
   - Updated FAQ about trial period

2. **Billing.tsx**
   - Changed Free plan price from "$0/forever" to "$0/15-day trial"

3. **Index.tsx**
   - Updated Free plan description to "15-day free trial"
   - Changed "Free forever on the starter plan" to "15-day free trial"

4. **Translations**
   - Updated English: `perForever: '/15-day trial'`
   - Updated Spanish: `perForever: '/prueba de 15 días'`

### ✅ Database Migration
Created `20260122000000_add_trial_expiration_logic.sql` with:
- `is_trial_expired(user_id)` - Returns true if FREE plan user's trial has expired
- `get_trial_end_date(user_id)` - Returns trial end date (created_at + 15 days) for FREE users

## Next Steps (To Fully Implement Trial Enforcement)

### 1. Apply Migration
```bash
# Apply the migration to your Supabase database
npx supabase migration up
```

### 2. Update Webhook Endpoint
Add trial expiration check in `supabase/functions/tradingview-webhook/index.ts`:
```typescript
// Check if FREE user's trial has expired
const { data: trialExpired } = await supabase
  .rpc('is_trial_expired', { user_id_param: userId });

if (trialExpired) {
  return new Response(
    JSON.stringify({ error: 'Trial expired. Please upgrade to continue.' }),
    { status: 403, headers: corsHeaders }
  );
}
```

### 3. Update Frontend Plan Checks
Add trial expiration checks in:
- `src/lib/planUtils.ts` - Add `isTrialExpired()` helper
- `src/pages/Dashboard.tsx` - Show trial expiration warning
- `src/pages/Strategies.tsx` - Block strategy creation if trial expired
- `src/pages/Billing.tsx` - Show trial countdown/expiration status

### 4. Add Trial Status Display
Update `Billing.tsx` to show:
- Days remaining in trial
- Trial expiration date
- Upgrade prompt when trial is expiring/expired

### 5. Update Plan Gates
Modify plan enforcement functions to check trial status:
- If trial expired → block all features (except upgrade flow)
- Show clear upgrade prompts

## Trial Logic

- **Trial Duration**: 15 days from account creation (`created_at`)
- **Trial End Date**: `created_at + 15 days`
- **Applies To**: Only FREE plan users
- **After Trial**: User must upgrade to PRO or ELITE to continue using the platform

## Testing Checklist

- [ ] Apply database migration
- [ ] Test `is_trial_expired()` function with new users
- [ ] Test `get_trial_end_date()` function
- [ ] Verify webhook blocks expired trial users
- [ ] Verify UI shows trial countdown
- [ ] Verify upgrade prompts appear when trial expires
- [ ] Test that paid users (PRO/ELITE) are not affected

## Notes

- Existing FREE users will have their trial calculated from their `created_at` date
- Users who signed up more than 15 days ago will immediately be in "trial expired" state
- Consider adding a grace period or grandfathering existing users if needed
