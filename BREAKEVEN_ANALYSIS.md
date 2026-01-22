# Breakeven Analysis - $7 Pro / $18 Elite Pricing

## Pricing Structure
- **Pro Plan**: $7/month
- **Elite Plan**: $18/month
- **Free Plan**: $0/month

## Revenue Calculation

### Monthly Recurring Revenue (MRR) per User
- **Pro User**: $7/month
- **Elite User**: $18/month
- **Free User**: $0/month

### Average Revenue Per User (ARPU)
Assuming typical SaaS conversion rates:
- 70% Free users
- 25% Pro users ($7)
- 5% Elite users ($18)

**ARPU = (0.70 × $0) + (0.25 × $7) + (0.05 × $18) = $0 + $1.75 + $0.90 = $2.65/user/month**

## Cost Structure (Estimates)

### Fixed Costs (Monthly)
- **Supabase**: $25-100/month (depending on usage)
- **Vercel/Hosting**: $20-50/month
- **Stripe Fees**: ~2.9% + $0.30 per transaction
- **Domain/Email**: $5-10/month
- **Other Tools**: $20-50/month (monitoring, analytics, etc.)

**Total Fixed Costs**: ~$70-210/month (conservative estimate: $150/month)

### Variable Costs (Per User)
- **Database Storage**: ~$0.01-0.05/user/month
- **API Calls**: ~$0.02-0.10/user/month
- **Bandwidth**: ~$0.01-0.03/user/month
- **Stripe Processing**: 2.9% + $0.30 per transaction
  - Pro: $7 × 0.029 + $0.30 = $0.50/user/month
  - Elite: $18 × 0.029 + $0.30 = $0.82/user/month

**Average Variable Cost**: ~$0.60-0.70/user/month (paid users)

## Breakeven Calculation

### Scenario 1: Conservative (Higher Costs)
- **Fixed Costs**: $200/month
- **Variable Cost**: $0.70/user/month
- **ARPU**: $2.65/user/month
- **Net Revenue per User**: $2.65 - $0.70 = $1.95/user/month

**Breakeven Users**: $200 ÷ $1.95 = **~103 paid users** (or ~343 total users with 30% conversion)

### Scenario 2: Optimistic (Lower Costs)
- **Fixed Costs**: $100/month
- **Variable Cost**: $0.60/user/month
- **ARPU**: $2.65/user/month
- **Net Revenue per User**: $2.65 - $0.60 = $2.05/user/month

**Breakeven Users**: $100 ÷ $2.05 = **~49 paid users** (or ~163 total users with 30% conversion)

### Scenario 3: Realistic (Middle Ground)
- **Fixed Costs**: $150/month
- **Variable Cost**: $0.65/user/month
- **ARPU**: $2.65/user/month
- **Net Revenue per User**: $2.65 - $0.65 = $2.00/user/month

**Breakeven Users**: $150 ÷ $2.00 = **~75 paid users** (or ~250 total users with 30% conversion)

## Quick Reference Table

| Conversion Rate | Total Users Needed | Paid Users Needed |
|----------------|-------------------|-------------------|
| 20% (conservative) | 375 | 75 |
| 30% (realistic) | 250 | 75 |
| 40% (optimistic) | 188 | 75 |

## Revenue Projections

### At 100 Paid Users (30% conversion = 333 total users)
- 75 Pro users: 75 × $7 = $525/month
- 25 Elite users: 25 × $18 = $450/month
- **Total MRR**: $975/month
- **Annual Revenue**: $11,700/year

### At 200 Paid Users (30% conversion = 667 total users)
- 150 Pro users: 150 × $7 = $1,050/month
- 50 Elite users: 50 × $18 = $900/month
- **Total MRR**: $1,950/month
- **Annual Revenue**: $23,400/year

### At 500 Paid Users (30% conversion = 1,667 total users)
- 375 Pro users: 375 × $7 = $2,625/month
- 125 Elite users: 125 × $18 = $2,250/month
- **Total MRR**: $4,875/month
- **Annual Revenue**: $58,500/year

## Key Metrics to Track

1. **Customer Acquisition Cost (CAC)**: How much you spend to acquire each customer
2. **Lifetime Value (LTV)**: Average revenue per customer over their lifetime
3. **Churn Rate**: Percentage of customers who cancel each month
4. **Conversion Rate**: Free → Pro/Elite conversion percentage
5. **Monthly Active Users (MAU)**: Total users using the platform

## Recommendations

1. **Target**: Aim for **75-100 paid users** to reach breakeven
2. **Focus on Conversion**: Even small improvements in conversion rate (20% → 30%) significantly reduce breakeven point
3. **Reduce Fixed Costs**: Use free tiers where possible (Supabase free tier, Vercel free tier) to lower breakeven
4. **Monitor Costs**: Track actual costs vs. estimates and adjust pricing if needed
5. **Optimize for Elite**: Higher Elite conversion = faster breakeven (18/7 = 2.57x revenue)

## Notes

- Stripe fees are included in variable costs
- This assumes 30% conversion rate (industry average for freemium is 2-5%, but can be higher with good product-market fit)
- Costs scale with usage, so monitor database and API usage closely
- Consider annual plans (with discount) to improve cash flow and reduce churn
