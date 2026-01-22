// Stripe product and price mapping
// Price IDs from environment variables for flexibility between test/production
export const STRIPE_PLANS = {
  PRO: {
    name: 'Pro',
    price: '$9/month',
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_1SnTupCRSet8VgXEYX1JuFu5',
    productId: import.meta.env.VITE_STRIPE_PRO_PRODUCT_ID || 'prod_Tkzuk0NeshkOAM',
  },
  ELITE: {
    name: 'Elite',
    price: '$18/month',
    priceId: import.meta.env.VITE_STRIPE_ELITE_PRICE_ID || 'price_1SnTvDCRSet8VgXEURGSOqcw',
    productId: import.meta.env.VITE_STRIPE_ELITE_PRODUCT_ID || 'prod_TkzvPzWPAd8jYf',
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;

