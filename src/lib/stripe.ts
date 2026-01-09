// Stripe product and price mapping
export const STRIPE_PLANS = {
  PRO: {
    name: 'Pro',
    price: '$19/month',
    priceId: 'price_1SnTupCRSet8VgXEYX1JuFu5',
    productId: 'prod_Tkzuk0NeshkOAM',
  },
  ELITE: {
    name: 'Elite',
    price: '$49/month',
    priceId: 'price_1SnTvDCRSet8VgXEURGSOqcw',
    productId: 'prod_TkzvPzWPAd8jYf',
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;

