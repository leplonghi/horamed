# HoraMed Stripe Configuration

## Account Information

| Field | Value |
|-------|-------|
| Account ID | `acct_1SDoIOAY2hnWxlHu` |
| Account Name | HoraMed |

---

## Price IDs

### BRL (Brazilian Real)

| Plan | Price ID | Amount |
|------|----------|--------|
| Monthly | `price_1Stun3AY2hnWxlHuDEEMRVTs` | R$ 19,90 |
| Annual | `price_1StuprHh4P8HSV4YRO4eI5YE` | R$ 199,90 |

### USD (US Dollar)

| Plan | Price ID | Amount |
|------|----------|--------|
| Monthly | `price_1SturuAY2hnWxlHuHVLxgKae` | $3.99 |
| Annual | `price_1StusNHh4P8HSV4YF0mk0mcI` | $39.99 |

---

## Frontend Configuration

File: `src/lib/stripeConfig.ts`

```typescript
export const stripeConfig = {
  prices: {
    brl: {
      monthly: {
        id: 'price_1Stun3AY2hnWxlHuDEEMRVTs',
        amount: 1990,
        currency: 'BRL',
        interval: 'month',
      },
      annual: {
        id: 'price_1StuprHh4P8HSV4YRO4eI5YE',
        amount: 19990,
        currency: 'BRL',
        interval: 'year',
      },
    },
    usd: {
      monthly: {
        id: 'price_1SturuAY2hnWxlHuHVLxgKae',
        amount: 399,
        currency: 'USD',
        interval: 'month',
      },
      annual: {
        id: 'price_1StusNHh4P8HSV4YF0mk0mcI',
        amount: 3999,
        currency: 'USD',
        interval: 'year',
      },
    },
  },
};
```

---

## Webhook Configuration

### Endpoint URL

For production, configure webhook at:
```
https://zmsuqdwleyqpdthaqvbi.supabase.co/functions/v1/stripe-webhook
```

### Events to Listen

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `setup_intent.succeeded` (for payment method updates)

---

## Secrets Required

| Secret | Where to Find |
|--------|---------------|
| `STRIPE_SECRET_KEY` | [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | [Stripe Dashboard → Webhooks → Signing secret](https://dashboard.stripe.com/webhooks) |

---

## Customer Portal

Ensure customer portal is configured:
1. Go to [Stripe Customer Portal Settings](https://dashboard.stripe.com/settings/billing/portal)
2. Enable portal
3. Configure allowed actions:
   - Cancel subscriptions
   - Update payment methods
   - View invoices

---

## Migration Notes

When migrating to new environment:

1. **Create new products/prices** in new Stripe account OR use existing account
2. **Update `stripeConfig.ts`** with new price IDs
3. **Configure new webhook** endpoint pointing to new Supabase project
4. **Update secrets** in new environment:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
5. **Test checkout flow** before going live

---

## Domain Configuration

Success/Cancel URLs are configured to:

| Event | URL |
|-------|-----|
| Success | `https://app.horamed.net/assinatura/sucesso` |
| Cancel | `https://app.horamed.net/assinatura/cancelado` |
| Customer Portal Return | `https://app.horamed.net/assinatura` |

Update these in `create-checkout` and `customer-portal` edge functions if domain changes.
