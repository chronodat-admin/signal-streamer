# Plan Gates Audit

## Plan Limits Summary

| Feature | FREE | PRO | ELITE |
|---------|------|-----|-------|
| Max Strategies | 1 | 10 | Unlimited |
| Signal History | 7 days | 90 days | Unlimited |
| CSV Export | ❌ | ✅ | ✅ |
| Public Pages | ❌ | ✅ | ✅ |
| Integrations | 0 | 5 | Unlimited |
| API Keys | 0 | 5 | Unlimited |
| Rate Limit (per sec) | 1 | 5 | 20 |
| Rate Limit (per day) | 2,000 | 50,000 | 200,000 |

## Current Implementation Status

### ✅ Implemented

1. **Strategy Creation Limit** (`Strategies.tsx`)
   - Checks `canCreateStrategy()` before creating
   - Shows "Upgrade Required" toast with reason
   - ✅ Working

2. **CSV Export** (`StrategyDetail.tsx`)
   - Checks `userPlan === 'FREE'` before export
   - Shows "Upgrade Required" toast
   - ✅ Working

3. **Signal History Limit** (`Dashboard.tsx`, `Signals.tsx`)
   - Uses `getHistoryDateLimit()` to filter signals
   - ✅ Working

4. **Plan Display** (`DashboardLayout.tsx`, `Strategies.tsx`)
   - Shows current plan badge
   - Shows strategies used count
   - ✅ Working

### ✅ Now Fixed

1. **Public Pages Toggle** (`Strategies.tsx`)
   - ✅ FREE users blocked from making strategies public
   - Shows "Upgrade Required" toast

2. **Integrations Limit** (`Integrations.tsx`)
   - ✅ Plan check added when creating integrations
   - FREE users see upgrade prompt (0 integrations allowed)
   - PRO users limited to 5, ELITE unlimited

3. **API Keys** (`ApiKeys.tsx`)
   - ✅ Plan check added when creating API keys
   - Uses same limits as integrations
   - FREE: 0, PRO: 5, ELITE: unlimited

## Upgrade Messages

All upgrade prompts should:
1. Use `variant: 'destructive'` for visibility
2. Include the feature name in title
3. Explain what plan is needed in description
4. Optionally link to billing/pricing page

