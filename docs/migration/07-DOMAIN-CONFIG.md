# HoraMed Domain Configuration

## Production Domains

| Domain | Purpose | Type |
|--------|---------|------|
| `horamed.net` | Landing page | Primary |
| `www.horamed.net` | Alias to landing | CNAME |
| `app.horamed.net` | Application | Primary |

---

## Domain Separation Architecture

The project follows strict domain separation:

```
┌─────────────────────────────────────────────────────────────┐
│                      horamed.net                            │
│                   (Landing/Marketing)                       │
│                                                             │
│  • Public content                                           │
│  • No authentication required                               │
│  • Marketing analytics (GA, Meta Pixel)                     │
│  • CTAs redirect to app.horamed.net/auth                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    app.horamed.net                          │
│                     (Application)                           │
│                                                             │
│  • Authentication (login, signup)                           │
│  • User dashboard                                           │
│  • Subscription management                                  │
│  • All protected routes                                     │
│  • Internal metrics only                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## DNS Records Required

### For Landing (horamed.net)

```
Type    Name    Value                    TTL
A       @       [Hosting IP]             Auto
CNAME   www     horamed.net              Auto
```

### For App (app.horamed.net)

```
Type    Name    Value                    TTL
CNAME   app     [App Hosting Target]     Auto
```

---

## Supabase Auth Configuration

Configure in Supabase Dashboard → Authentication → URL Configuration:

| Setting | Value |
|---------|-------|
| Site URL | `https://app.horamed.net` |
| Redirect URLs | `https://app.horamed.net/**` |

---

## Lovable Preview URLs

| Environment | URL |
|-------------|-----|
| Preview | `https://id-preview--281a4314-4cea-4c93-9b25-b97f8d39e706.lovable.app` |
| Published | `https://horamed.lovable.app` |

---

## Frontend Configuration

File: `src/lib/domainConfig.ts`

```typescript
export const domainConfig = {
  landing: 'https://horamed.net',
  app: 'https://app.horamed.net',
  
  // Routes
  auth: 'https://app.horamed.net/auth',
  subscription: 'https://app.horamed.net/assinatura',
  
  // Stripe redirects
  checkoutSuccess: 'https://app.horamed.net/assinatura/sucesso',
  checkoutCancel: 'https://app.horamed.net/assinatura/cancelado',
  customerPortalReturn: 'https://app.horamed.net/assinatura',
};
```

---

## Migration Checklist

When migrating to new hosting:

- [ ] Update DNS A/CNAME records
- [ ] Configure SSL certificates
- [ ] Update Supabase Auth URLs
- [ ] Update Stripe webhook URLs
- [ ] Update edge function return URLs
- [ ] Test authentication flow
- [ ] Test Stripe checkout flow
- [ ] Verify email links work correctly
