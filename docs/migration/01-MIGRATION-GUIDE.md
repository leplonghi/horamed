# HoraMed Migration Guide: Lovable Cloud → Antigravity

## Project Overview

| Metric | Value |
|--------|-------|
| Project ID | `zmsuqdwleyqpdthaqvbi` |
| Supabase URL | `https://zmsuqdwleyqpdthaqvbi.supabase.co` |
| Total Tables | 49 (47 base + 2 views) |
| Edge Functions | 48 |
| Storage Buckets | 3 (private) |

---

## Step 1: Request Project Transfer (Recommended)

Contact Lovable Support and request:

```
Subject: Transfer Supabase Project Ownership

I need to transfer ownership of Supabase project "zmsuqdwleyqpdthaqvbi" 
to my personal Supabase account.

My Supabase account email: [YOUR_EMAIL]
Lovable project: HoraMed
```

**After transfer, you'll have:**
- Full Dashboard access
- SERVICE_ROLE_KEY
- Database connection string
- Storage management

---

## Step 2: Recollect External Secrets

These secrets are encrypted and need to be retrieved from their original providers:

### Stripe (Required for payments)
| Secret | Location |
|--------|----------|
| `STRIPE_SECRET_KEY` | [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks) |

### Google APIs
| Secret | Location |
|--------|----------|
| `GOOGLE_AI_API_KEY` | [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CALENDAR_CLIENT_ID` | Google Cloud Console → OAuth 2.0 Client IDs |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 Client IDs |

### Email (SMTP)
| Secret | Your Provider |
|--------|---------------|
| `SMTP_HOST` | e.g., smtp.gmail.com, smtp.sendgrid.net |
| `SMTP_PORT` | Usually 465 (TLS) or 587 (STARTTLS) |
| `SMTP_USER` | Your SMTP username |
| `SMTP_PASSWORD` | Your SMTP password |
| `SMTP_FROM_EMAIL` | e.g., noreply@horamed.net |

### Push Notifications (Can be regenerated)
| Secret | How to Generate |
|--------|-----------------|
| `VAPID_PUBLIC_KEY` | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` |

### Other
| Secret | Notes |
|--------|-------|
| `FIREBASE_SERVER_KEY` | Firebase Console (legacy FCM) |
| `CRON_SECRET` | Generate new: `openssl rand -hex 32` |

---

## Step 3: Configure DNS (if keeping domain)

Current domain configuration:

| Domain | Points To |
|--------|-----------|
| `horamed.net` | Landing page |
| `www.horamed.net` | Alias to horamed.net |
| `app.horamed.net` | Application |

Update DNS records to point to new hosting after migration.

---

## Step 4: Database Migration

If you can't transfer and need to recreate:

1. Run `02-SCHEMA.sql` in new Supabase project
2. Run `03-RLS-POLICIES.sql` for security
3. Run `04-FUNCTIONS.sql` for database functions
4. Import data from `05-DATA-EXPORT.json`

---

## Step 5: Edge Functions

All 48 Edge Functions are in `supabase/functions/`. Deploy them:

```bash
supabase functions deploy --project-ref YOUR_NEW_PROJECT_ID
```

Or deploy individually:
```bash
supabase functions deploy create-checkout --project-ref YOUR_NEW_PROJECT_ID
```

---

## Step 6: Storage Buckets

Recreate these private buckets:

| Bucket | Public | Purpose |
|--------|--------|---------|
| `medical-exams` | No | Medical exam documents |
| `cofre-saude` | No | Health vault documents |
| `avatars` | No | User profile pictures |

```sql
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('medical-exams', 'medical-exams', false),
  ('cofre-saude', 'cofre-saude', false),
  ('avatars', 'avatars', false);
```

---

## Step 7: Update Frontend Configuration

Update `.env` with new project:

```env
VITE_SUPABASE_PROJECT_ID="YOUR_NEW_PROJECT_ID"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_NEW_ANON_KEY"
VITE_SUPABASE_URL="https://YOUR_NEW_PROJECT_ID.supabase.co"
```

---

## Verification Checklist

- [ ] Supabase project accessible in dashboard
- [ ] All secrets configured
- [ ] Edge Functions deployed and working
- [ ] Storage buckets created
- [ ] RLS policies active
- [ ] Authentication working
- [ ] Stripe integration functional
- [ ] Email sending operational
- [ ] Push notifications working
- [ ] DNS configured correctly

---

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
