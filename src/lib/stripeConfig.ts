/**
 * Stripe Product and Price Configuration
 * 
 * IMPORTANT: These price IDs are from your live Stripe account.
 * Do not modify unless you've created new products in Stripe.
 */

export const STRIPE_PRICES = {
  monthly: 'price_1SYEVNAY2hnWxlHujMBQSYTt', // R$ 19,90/mês
  annual: 'price_1SYEWmAY2hnWxlHuNegLluyC',  // R$ 199,90/ano
} as const;

export const STRIPE_PRODUCTS = {
  premiumMonthly: 'prod_TVEzdnYZnmxoSK',
  premiumAnnual: 'prod_TVF02XNQOV4kXy',
} as const;

export const PRICING = {
  monthly: 19.90,
  annual: 199.90,
  trial_days: 7,
} as const;
