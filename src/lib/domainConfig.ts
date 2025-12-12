/**
 * Domain Configuration for HoraMed
 * 
 * Production domain structure:
 * - horamed.net / www.horamed.net → Landing page (marketing/SEO)
 * - app.horamed.net → Application (product)
 */

// App domain for authentication and product
export const APP_DOMAIN = import.meta.env.PROD 
  ? 'https://app.horamed.net'
  : window.location.origin;

// Landing domain for marketing
export const LANDING_DOMAIN = import.meta.env.PROD 
  ? 'https://horamed.net'
  : window.location.origin;

// Auth redirect URL
export const AUTH_URL = `${APP_DOMAIN}/auth`;

// Stripe checkout URLs
export const STRIPE_SUCCESS_URL = `${APP_DOMAIN}/assinatura/sucesso`;
export const STRIPE_CANCEL_URL = `${APP_DOMAIN}/assinatura/cancelado`;
export const STRIPE_PORTAL_RETURN_URL = `${APP_DOMAIN}/assinatura`;

// Check if we're on the landing domain
export const isLandingDomain = () => {
  if (!import.meta.env.PROD) return false;
  const host = window.location.hostname;
  return host === 'horamed.net' || host === 'www.horamed.net';
};

// Check if we're on the app domain
export const isAppDomain = () => {
  if (!import.meta.env.PROD) return true;
  return window.location.hostname === 'app.horamed.net';
};

// Get redirect URL for CTA buttons on landing
export const getAuthRedirectUrl = () => AUTH_URL;
