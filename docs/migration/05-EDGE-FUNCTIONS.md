# HoraMed Edge Functions Documentation

## Overview

The project contains **48 Edge Functions** organized by functionality.

---

## Function Categories

### 1. Payment & Subscription (6 functions)

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `create-checkout` | Create Stripe checkout session | Yes |
| `stripe-webhook` | Handle Stripe events | No (webhook signature) |
| `sync-subscription` | Sync subscription status from Stripe | Yes |
| `cancel-subscription` | Cancel user subscription | Yes |
| `customer-portal` | Open Stripe customer portal | Yes |
| `update-payment-method` | Update payment method | Yes |
| `get-payment-method` | Get current payment method | Yes |

**Required Secrets:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

---

### 2. Notifications (10 functions)

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `get-vapid-key` | Get VAPID public key for push | No |
| `send-dose-notification` | Send dose reminder notification | Yes |
| `schedule-dose-notifications` | Schedule upcoming dose notifications | No |
| `process-scheduled-notifications` | Process pending notifications | No |
| `process-scheduled-alarms` | Process scheduled alarms | No |
| `send-whatsapp-reminder` | Send WhatsApp via Green API | Yes |
| `send-whatsapp-evolution` | Send WhatsApp via Evolution API | Yes |
| `send-email-smtp` | Send email via SMTP | No |
| `send-multi-channel-notification` | Send to multiple channels | No |
| `send-smart-notifications` | AI-optimized notification timing | Yes |

**Required Secrets:**
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`
- WhatsApp API credentials (user-provided)

---

### 3. Document Processing (6 functions)

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `extract-medication` | Extract medication from prescription image | Yes |
| `extract-exam` | Extract exam data from document | Yes |
| `extract-document` | General document extraction | Yes |
| `extrair-metadados-documento` | Extract metadata from documents | Yes |
| `voice-to-text` | Convert voice to text | Yes |
| `generate-monthly-report` | Generate monthly health report | Yes |

**Required Secrets:**
- `GOOGLE_AI_API_KEY` (for Gemini AI)

---

### 4. Sharing & Access (7 functions)

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `gerar-link-compartilhamento` | Generate sharing link | Yes |
| `revogar-link-compartilhamento` | Revoke sharing link | Yes |
| `validar-compartilhamento` | Validate sharing token | No |
| `compartilhar-historico` | Share medical history | Yes |
| `visualizar-historico` | View shared history | No |
| `consultation-card` | Generate consultation QR card | Yes |
| `caregiver-invite` | Invite caregiver | Yes |

---

### 5. Health Intelligence (5 functions)

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `health-assistant` | AI health assistant (Clara) | Yes |
| `analyze-drug-interactions` | Analyze medication interactions | Yes |
| `check-interactions` | Check interactions for new medication | Yes |
| `predictive-health-analysis` | Predictive health insights | Yes |
| `emergency-guidance` | Emergency health guidance | Yes |

**Required Secrets:**
- `GOOGLE_AI_API_KEY`

---

### 6. Clara AI Assistant (2 functions)

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `clara-consultation-prep` | Prepare for medical consultation | Yes |
| `clara-weekly-summary` | Generate weekly health summary | Yes |

---

### 7. Scheduling (4 functions)

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `generate-dose-instances` | Generate dose instances from schedules | No |
| `handle-dose-action` | Handle take/skip dose action | Yes |
| `agendar-lembretes-saude` | Schedule health reminders | No |
| `schedule-vaccine-reminders` | Schedule vaccine reminders | Yes |

---

### 8. Integration (3 functions)

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `google-calendar-sync` | Sync with Google Calendar | Yes |
| `medication-info` | Get medication information | No |
| `pharmacy-prices` | Get pharmacy price comparison | Yes |

**Required Secrets:**
- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`

---

### 9. Referral System (1 function)

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `process-referral` | Process referral signup | Yes |

---

### 10. Analytics & Audit (3 functions)

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `audit-log` | Log audit events | Yes |
| `affiliate-click` | Track affiliate clicks | No |
| `export-user-data` | Export user data (LGPD) | Yes |

---

## Deployment

### Deploy All Functions

```bash
cd supabase/functions
supabase functions deploy --project-ref YOUR_PROJECT_ID
```

### Deploy Individual Function

```bash
supabase functions deploy create-checkout --project-ref YOUR_PROJECT_ID
```

### Function Configuration

All functions are configured in `supabase/config.toml`:

```toml
[functions.create-checkout]
verify_jwt = true

[functions.stripe-webhook]
verify_jwt = false
```

---

## Function Code Location

All function code is in `supabase/functions/[function-name]/index.ts`

Example structure:
```
supabase/functions/
├── create-checkout/
│   └── index.ts
├── stripe-webhook/
│   └── index.ts
├── health-assistant/
│   └── index.ts
...
```

---

## Common Patterns

### CORS Headers (all functions)

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

### Authentication Check

```typescript
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! },
    },
  }
);

const { data: { user } } = await supabaseClient.auth.getUser();
if (!user) {
  throw new Error('Not authenticated');
}
```

### Error Handling

```typescript
try {
  // Function logic
} catch (error) {
  console.error('Error:', error);
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

---

## Environment Variables Required

| Variable | Used By | Purpose |
|----------|---------|---------|
| `SUPABASE_URL` | All | Supabase project URL |
| `SUPABASE_ANON_KEY` | All | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Some | Admin operations |
| `STRIPE_SECRET_KEY` | Payment functions | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | Verify webhooks |
| `GOOGLE_AI_API_KEY` | AI functions | Gemini API |
| `VAPID_PUBLIC_KEY` | Push | Web Push public key |
| `VAPID_PRIVATE_KEY` | Push | Web Push private key |
| `SMTP_*` | Email | SMTP configuration |
