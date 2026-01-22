# Database-Driven Pricing Implementation

## Overview

Pricing is now database-driven, allowing you to change prices, features, and limits without code deployments.

## Database Structure

### `subscription_plans` Table

Stores all plan information:
- **plan_type**: FREE, PRO, ELITE (enum)
- **price_monthly**: Monthly price in USD
- **price_yearly**: Optional yearly price
- **limits**: JSONB with plan limits (maxStrategies, historyDays, etc.)
- **features**: JSONB array of feature strings
- **stripe_price_id**: Stripe Price ID for checkout
- **stripe_product_id**: Stripe Product ID
- **trial_days**: Number of trial days (0 for no trial)

## Migration Steps

1. **Apply migrations**:
   ```bash
   npx supabase migration up
   ```

2. **Update Stripe Price IDs** (after creating Stripe products):
   ```sql
   UPDATE subscription_plans 
   SET stripe_price_id = 'price_xxxxx', 
       stripe_product_id = 'prod_xxxxx'
   WHERE plan_type = 'PRO';
   
   UPDATE subscription_plans 
   SET stripe_price_id = 'price_yyyyy', 
       stripe_product_id = 'prod_yyyyy'
   WHERE plan_type = 'ELITE';
   ```

## How It Works

### Caching
- Plans are cached in-memory for 5 minutes
- Reduces database queries
- Cache automatically refreshes

### Fallback
- If database fails, falls back to hardcoded defaults
- Ensures app always works

### Components Updated
- ✅ `src/lib/planService.ts` - Database fetching with caching
- ✅ `src/lib/planUtils.ts` - Uses database plans
- ✅ `src/lib/stripe.ts` - Gets Stripe IDs from database
- ✅ `src/pages/Billing.tsx` - Displays database pricing
- ✅ `src/pages/Pricing.tsx` - Uses database plans
- ✅ `src/pages/Dashboard.tsx` - Uses database limits

## Changing Prices

### Via SQL (Quick)
```sql
UPDATE subscription_plans 
SET price_monthly = 9.00,
    updated_at = now()
WHERE plan_type = 'PRO';
```

### Via Admin Panel (Future)
Create an admin interface to manage plans visually.

## Adding New Plans

1. Insert into database:
```sql
INSERT INTO subscription_plans (
  plan_type,
  name,
  description,
  price_monthly,
  limits,
  features,
  display_order,
  icon_name,
  color,
  bg_color
) VALUES (
  'BUSINESS', -- Add to enum first
  'Business',
  'For teams',
  29.00,
  '{"maxStrategies": 50, "historyDays": 365, ...}'::jsonb,
  '["50 Strategies", "1 year history", ...]'::jsonb,
  3,
  'Building',
  'text-purple-500',
  'bg-purple-500/10'
);
```

2. Update TypeScript enum (if needed)
3. Clear cache: Call `clearPlanCache()` in code

## Running Promotions

### Temporary Price Reduction
```sql
-- Set Pro to $5 for promotion
UPDATE subscription_plans 
SET price_monthly = 5.00,
    description = 'Limited time: $5/month (normally $7)'
WHERE plan_type = 'PRO';

-- Later, restore original price
UPDATE subscription_plans 
SET price_monthly = 7.00,
    description = 'For active traders'
WHERE plan_type = 'PRO';
```

### A/B Testing
Create duplicate plans with different prices:
```sql
-- Create test variant
INSERT INTO subscription_plans (
  plan_type, name, price_monthly, is_visible, ...
) VALUES (
  'PRO_TEST', 'Pro (Test)', 6.00, false, ...
);
```

## Monitoring

Check plan usage:
```sql
SELECT 
  plan_type,
  COUNT(*) as user_count
FROM profiles
GROUP BY plan_type;
```

## Benefits

✅ **No Code Deployment** - Change prices instantly  
✅ **Price History** - Track changes via `updated_at`  
✅ **A/B Testing** - Test different price points  
✅ **Promotions** - Run limited-time offers  
✅ **Regional Pricing** - Add currency/region fields later  
✅ **Feature Flags** - Enable/disable plans via `is_active`  

## Next Steps

1. Apply migrations
2. Update Stripe Price IDs in database
3. Test pricing display
4. Consider adding admin panel for plan management
