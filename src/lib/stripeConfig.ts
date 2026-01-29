/**
 * Stripe Product and Price Configuration
 * 
 * IMPORTANT: These price IDs are from your live Stripe account.
 * Separate products for BRL (Brazil) and USD (International).
 */

// Brazilian prices (BRL) - Account: AY2hnWxlHu
export const STRIPE_PRICES_BRL = {
  monthly: 'price_1Stun3AY2hnWxlHuDEEMRVTs', // R$ 19,90/mês
  annual: 'price_1SuWEwAY2hnWxlHuG2WrgNhx',  // R$ 199,90/ano
} as const;

// International prices (USD) - Account: AY2hnWxlHu
export const STRIPE_PRICES_USD = {
  monthly: 'price_1SturuAY2hnWxlHuHVLxgKae', // $3.99/month
  annual: 'price_1SieJtAY2hnWxlHuAOa6m5nu',  // $39.90/year
} as const;

// Legacy export for backward compatibility
export const STRIPE_PRICES = STRIPE_PRICES_BRL;

export const STRIPE_PRODUCTS = {
  // BRL Products
  premiumMonthlyBRL: 'prod_Tre5v8Yqw6dowr',
  premiumAnnualBRL: 'prod_Tre8O5YZRrC8D7',
  // USD Products
  premiumMonthlyUSD: 'prod_TreAx6jZCXru0w',
  premiumAnnualUSD: 'prod_TreA9Kp7N8DteW',
  // Legacy exports
  premiumMonthly: 'prod_Tre5v8Yqw6dowr',
  premiumAnnual: 'prod_Tre8O5YZRrC8D7',
} as const;

export const PRICING = {
  brl: {
    monthly: 19.90,
    annual: 199.90,
    currency: 'BRL',
    symbol: 'R$',
  },
  usd: {
    monthly: 3.99,
    annual: 39.99,
    currency: 'USD',
    symbol: '$',
  },
  trial_days: 7,
} as const;

// Lusophone countries that should see Portuguese and BRL pricing (only Brazil)
export const PORTUGUESE_COUNTRIES = ['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL'];
export const BRL_COUNTRIES = ['BR']; // Only Brazil uses BRL

// Helper to get price config based on country
export function getPriceConfig(countryCode: string) {
  const isBrazil = countryCode === 'BR';
  return {
    prices: isBrazil ? STRIPE_PRICES_BRL : STRIPE_PRICES_USD,
    pricing: isBrazil ? PRICING.brl : PRICING.usd,
    currency: isBrazil ? 'BRL' : 'USD',
  };
}

// Helper to get language based on country
export function getLanguageByCountry(countryCode: string): 'pt' | 'en' {
  return PORTUGUESE_COUNTRIES.includes(countryCode) ? 'pt' : 'en';
}
