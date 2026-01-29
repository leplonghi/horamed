

# Guia de Acesso ao Supabase para Migração ao Antigravity

## Situação Atual

O projeto HoraMed está rodando no **Lovable Cloud**, que é uma camada gerenciada sobre o Supabase. Isso significa que:
- O Supabase está **provisionado automaticamente** pela Lovable
- O acesso direto ao Dashboard do Supabase **não está disponível** pela interface padrão da Lovable
- As credenciais sensíveis (como `SERVICE_ROLE_KEY`) estão protegidas

---

## Informações que Você JÁ Possui

### Credenciais Públicas (seguras para usar no frontend)
| Item | Valor |
|------|-------|
| **Project ID** | `zmsuqdwleyqpdthaqvbi` |
| **URL do Supabase** | `https://zmsuqdwleyqpdthaqvbi.supabase.co` |
| **Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptc3VxZHdsZXlxcGR0aGFxdmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzkzMzYsImV4cCI6MjA3NDk1NTMzNn0.Ce-xbOtP5d1kJPQ8aOQqfm-P1QMM_e50ZAWiO0kWQr8` |

### URLs de Produção
| Ambiente | URL |
|----------|-----|
| App (Produto) | `https://app.horamed.net` |
| Landing Page | `https://horamed.net` |
| Preview Lovable | `https://id-preview--281a4314-4cea-4c93-9b25-b97f8d39e706.lovable.app` |
| Publicado Lovable | `https://horamed.lovable.app` |

---

## Secrets Configurados (Nomes - valores estão criptografados)

Você precisará **recoletar os valores** destes secrets para reconfigurar no novo ambiente:

| Secret | Uso |
|--------|-----|
| `STRIPE_SECRET_KEY` | Integração pagamentos Stripe |
| `STRIPE_WEBHOOK_SECRET` | Validação webhooks Stripe |
| `GOOGLE_AI_API_KEY` | Funcionalidades de IA |
| `GOOGLE_CALENDAR_CLIENT_ID` | Integração Google Calendar |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Integração Google Calendar |
| `VAPID_PUBLIC_KEY` | Push notifications |
| `VAPID_PRIVATE_KEY` | Push notifications |
| `SMTP_HOST` | Envio de emails |
| `SMTP_PORT` | Envio de emails |
| `SMTP_USER` | Envio de emails |
| `SMTP_PASSWORD` | Envio de emails |
| `SMTP_FROM_EMAIL` | Envio de emails |
| `FIREBASE_SERVER_KEY` | Push (legacy) |
| `CRON_SECRET` | Jobs agendados |

---

## Edge Functions (48 funções serverless)

```text
├── affiliate-click/
├── agendar-lembretes-saude/
├── analyze-drug-interactions/
├── audit-log/
├── cancel-subscription/
├── caregiver-invite/
├── check-interactions/
├── clara-consultation-prep/
├── clara-weekly-summary/
├── compartilhar-historico/
├── consultation-card/
├── create-checkout/
├── customer-portal/
├── emergency-guidance/
├── export-user-data/
├── extract-document/
├── extract-exam/
├── extract-medication/
├── extrair-metadados-documento/
├── generate-dose-instances/
├── generate-monthly-report/
├── gerar-link-compartilhamento/
├── get-payment-method/
├── get-vapid-key/
├── google-calendar-sync/
├── handle-dose-action/
├── health-assistant/
├── medication-info/
├── pharmacy-prices/
├── predictive-health-analysis/
├── process-referral/
├── process-scheduled-alarms/
├── process-scheduled-notifications/
├── revogar-link-compartilhamento/
├── schedule-dose-notifications/
├── schedule-vaccine-reminders/
├── send-dose-notification/
├── send-email-smtp/
├── send-multi-channel-notification/
├── send-smart-notifications/
├── send-whatsapp-evolution/
├── send-whatsapp-reminder/
├── stripe-webhook/
├── sync-subscription/
├── update-payment-method/
├── validar-compartilhamento/
├── visualizar-historico/
└── voice-to-text/
```

---

## Tabelas no Banco de Dados (30+ tabelas)

| Tabela | Descrição |
|--------|-----------|
| `items` | Medicamentos cadastrados |
| `schedules` | Horários dos medicamentos |
| `dose_instances` | Histórico de doses |
| `user_profiles` | Perfis de usuários (pacientes) |
| `subscriptions` | Assinaturas Stripe |
| `notification_preferences` | Config de notificações |
| `documentos_saude` | Documentos médicos |
| `exames_laboratoriais` | Exames de laboratório |
| `valores_exames` | Resultados de exames |
| `consultas_medicas` | Consultas agendadas |
| `sinais_vitais` | Sinais vitais registrados |
| `medical_shares` | Compartilhamentos médicos |
| `referrals` | Sistema de indicações |
| `referral_goals` | Metas de indicações |
| `referral_discounts` | Descontos de indicações |
| `stock` | Estoque de medicamentos |
| `alarms` | Alarmes e lembretes |
| `audit_logs` | Logs de auditoria |
| `drug_interactions` | Interações medicamentosas |
| `feature_flags` | Flags de funcionalidades |
| `consents` | Consentimentos LGPD |
| `caregiver_links` | Vínculos de cuidadores |
| `health_history` | Histórico de saúde |
| E mais... | |

---

## Storage Buckets

| Bucket | Público | Uso |
|--------|---------|-----|
| `medical-exams` | Não | Exames médicos |
| `cofre-saude` | Não | Documentos de saúde |
| `avatars` | Não | Fotos de perfil |

---

## Como Conseguir Acesso Completo ao Supabase

### Opção 1: Contatar Suporte Lovable
1. Acesse o Discord da Lovable ou suporte
2. Solicite "transfer" do projeto Supabase para sua conta pessoal
3. Você precisará ter uma conta no supabase.com

### Opção 2: Exportar Dados e Recriar
1. Posso exportar todas as tabelas em formato SQL
2. Posso gerar scripts de migração completos
3. Você cria um novo projeto Supabase e importa tudo

### Opção 3: Acesso via CLI (requer SERVICE_ROLE_KEY)
- O `SERVICE_ROLE_KEY` está configurado como secret no projeto
- Com ele, você pode acessar 100% do banco via API
- Mas precisamos extrair esse valor primeiro

---

## Próximos Passos Recomendados

1. **Confirmar qual caminho você quer seguir** (transfer, exportar, ou CLI)
2. **Coletar os valores dos secrets** que você configurou (Stripe, SMTP, etc.)
3. **Decidir se vai manter o domínio** `horamed.net` apontando para novo ambiente

---

## Informações que você NÃO tem acesso direto

| Item | Status |
|------|--------|
| Dashboard Supabase | ❌ Gerenciado pela Lovable |
| SERVICE_ROLE_KEY | ❌ Criptografado |
| DB Connection String | ❌ Não exposto |
| Logs de Banco | ❌ Via edge function logs apenas |

