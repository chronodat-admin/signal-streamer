# Trial Expiration Flow & Upgrade Process

## Overview

The system enforces a 15-day free trial for FREE plan users. After the trial expires, users must upgrade to Pro ($7/month) or Elite ($18/month) to continue using the platform.

## How Trial Expiration is Handled

### 1. **Database Functions** (Backend)

Two database functions track trial status:

- **`is_trial_expired(user_id)`**: Returns `true` if a FREE user's trial has expired
  - Calculates: `created_at + 15 days < NOW()`
  - Only applies to FREE plan users
  - Returns `false` for PRO/ELITE users

- **`get_trial_end_date(user_id)`**: Returns the trial expiration date
  - Calculates: `created_at + 15 days`
  - Returns `NULL` for paid plans

**Location**: `supabase/migrations/20260122000000_add_trial_expiration_logic.sql`

### 2. **Webhook Endpoint** (Backend Enforcement)

The TradingView webhook endpoint blocks expired trial users from receiving signals:

```typescript
// In supabase/functions/tradingview-webhook/index.ts
if (plan === "FREE") {
  const { data: trialExpired } = await supabase
    .rpc("is_trial_expired", { user_id_param: strategy.user_id });
  
  if (trialExpired) {
    return new Response(
      JSON.stringify({ 
        error: "Trial expired. Please upgrade to Pro or Elite to continue receiving signals.",
        code: "TRIAL_EXPIRED"
      }),
      { status: 403 }
    );
  }
}
```

**Result**: Expired trial users cannot receive webhook signals.

### 3. **Frontend Helpers** (Client-Side)

**`src/lib/planUtils.ts`** provides:
- `getTrialStatus(userId)`: Returns trial status with days remaining
- `isTrialExpired(userId)`: Quick check if trial expired

**`src/hooks/useTrial.tsx`**: React hook that:
- Fetches trial status for current user
- Auto-refreshes every hour
- Returns: `{ isExpired, daysRemaining, trialEndDate, loading }`

## User Experience Flow

### A. **Trial Active** (Days Remaining > 0)

1. **Dashboard**: No banner shown
2. **Billing Page**: Shows trial countdown card
   - "X days remaining"
   - Trial end date
3. **Strategies**: Can create strategies (within plan limits)
4. **Webhooks**: Signals are accepted

### B. **Trial Expiring Soon** (Days Remaining ≤ 3)

1. **Dashboard**: Amber warning banner
   - "Trial Ending Soon - X days remaining"
   - Link to upgrade
2. **Billing Page**: Amber trial status card
   - Shows days remaining
   - Upgrade buttons visible
3. **Strategies**: Still functional
4. **Webhooks**: Still functional

### C. **Trial Expired** (Days Remaining = 0)

1. **Dashboard**: Red error banner
   - "Trial Expired"
   - "Upgrade to Pro or Elite to continue"
   - Direct link to billing page
2. **Billing Page**: 
   - Red trial expired alert at top
   - Trial status card shows "Trial Expired"
   - Upgrade buttons prominently displayed
3. **Strategies Page**: 
   - Strategy creation blocked
   - Toast error: "Trial expired. Please upgrade..."
   - Upgrade button in toast
4. **Webhooks**: 
   - All webhook requests rejected (403)
   - Error: "Trial expired. Please upgrade..."

## Upgrade Flow

### Step 1: User Sees Trial Status

Users see trial status in multiple places:
- **Dashboard banner** (when expiring/expired)
- **Billing page** (always visible for FREE users)
- **Strategy creation** (blocked with upgrade prompt)

### Step 2: User Clicks Upgrade

Multiple upgrade entry points:
1. **Billing Page**: 
   - "Upgrade to Pro - $7/mo" button
   - "Upgrade to Elite - $18/mo" button
2. **Dashboard Banner**: 
   - "Upgrade Now →" link → Billing page
3. **Strategy Creation Toast**: 
   - "Upgrade Now" button → Billing page
4. **Pricing Page**: 
   - Direct checkout buttons

### Step 3: Checkout Process

1. User clicks upgrade button
2. `createCheckout()` is called with plan (PRO/ELITE)
3. Supabase Edge Function creates Stripe Checkout session
4. User redirected to Stripe Checkout
5. User completes payment
6. Stripe webhook updates user's plan
7. User redirected back to billing page with success

### Step 4: Post-Upgrade

1. Plan updated to PRO/ELITE
2. Trial status no longer applies
3. All features unlocked
4. Webhooks accepted
5. Strategy creation allowed (within plan limits)

## Implementation Details

### Files Modified

1. **Backend**:
   - `supabase/migrations/20260122000000_add_trial_expiration_logic.sql` - Database functions
   - `supabase/functions/tradingview-webhook/index.ts` - Webhook trial check

2. **Frontend Utilities**:
   - `src/lib/planUtils.ts` - Trial status helpers
   - `src/hooks/useTrial.tsx` - React hook for trial status

3. **UI Components**:
   - `src/pages/Billing.tsx` - Trial status display & upgrade buttons
   - `src/pages/Dashboard.tsx` - Trial warning banners
   - `src/pages/Strategies.tsx` - Trial expiration blocking

### Key Functions

```typescript
// Check if trial expired
const expired = await isTrialExpired(userId);

// Get full trial status
const status = await getTrialStatus(userId);
// Returns: { isExpired, daysRemaining, trialEndDate }

// Use in React component
const { isExpired, daysRemaining, trialEndDate } = useTrial();
```

## Testing Checklist

- [ ] New FREE user: Trial shows 15 days remaining
- [ ] Trial expiring: Warning banner appears at 3 days
- [ ] Trial expired: All features blocked, upgrade prompts shown
- [ ] Webhook blocked: Expired trial users get 403 error
- [ ] Strategy creation blocked: Toast shows upgrade prompt
- [ ] Upgrade flow: User can complete checkout
- [ ] Post-upgrade: Trial status no longer applies
- [ ] PRO/ELITE users: No trial restrictions

## Edge Cases Handled

1. **Existing Users**: Trial calculated from `created_at` date
   - Users who signed up >15 days ago: Immediately expired
   - Consider grandfathering if needed

2. **Paid Users**: Trial functions return `false`/`NULL`
   - PRO/ELITE users never see trial warnings
   - No performance impact

3. **Race Conditions**: 
   - Database functions use `SECURITY DEFINER` for consistency
   - Frontend checks are advisory (backend enforces)

4. **Timezone Issues**:
   - Uses database `TIMESTAMPTZ` for accurate calculations
   - Frontend displays in user's local timezone

## Future Enhancements

1. **Email Notifications**: Send trial expiration reminders
2. **Grace Period**: Allow 1-2 days grace after expiration
3. **Trial Extension**: Admin can extend trials for specific users
4. **Usage Analytics**: Track trial-to-paid conversion rates
