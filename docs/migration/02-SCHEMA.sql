-- ============================================
-- HoraMed Database Schema Migration
-- Generated: 2026-01-30
-- Project: zmsuqdwleyqpdthaqvbi
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CUSTOM TYPES
-- ============================================

CREATE TYPE consent_purpose AS ENUM (
  'data_processing',
  'marketing',
  'analytics',
  'third_party_sharing'
);

CREATE TYPE health_event_type AS ENUM (
  'consulta',
  'exame',
  'vacina',
  'retorno',
  'outro'
);

CREATE TYPE caregiver_role AS ENUM (
  'viewer',
  'editor',
  'admin'
);

-- ============================================
-- CORE TABLES
-- ============================================

-- User Profiles (managed profiles, not auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  birth_date DATE,
  relationship TEXT DEFAULT 'self',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Main Profile Data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  nickname TEXT,
  avatar_url TEXT,
  birth_date TEXT,
  cpf TEXT,
  cpf_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  weight_kg NUMERIC,
  height_cm NUMERIC,
  referral_code TEXT UNIQUE,
  device_fingerprint TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  tutorial_flags JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Medications/Items
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id),
  name TEXT NOT NULL,
  dose_text TEXT,
  category TEXT DEFAULT 'medicamento',
  with_food BOOLEAN DEFAULT false,
  notes TEXT,
  notification_type TEXT DEFAULT 'push',
  is_active BOOLEAN DEFAULT true,
  treatment_start_date DATE,
  treatment_end_date DATE,
  treatment_duration_days INTEGER,
  total_doses INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Schedules
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  freq_type TEXT NOT NULL,
  times JSONB NOT NULL DEFAULT '[]'::jsonb,
  days_of_week INTEGER[],
  day_of_month INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dose Instances
CREATE TABLE public.dose_instances (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  taken_at TIMESTAMPTZ,
  skip_reason TEXT,
  delay_minutes INTEGER,
  actor_id UUID,
  actor_type TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Management
CREATE TABLE public.stock (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  item_id UUID NOT NULL UNIQUE REFERENCES public.items(id) ON DELETE CASCADE,
  units_total NUMERIC NOT NULL DEFAULT 0,
  units_left NUMERIC NOT NULL DEFAULT 0,
  unit_label TEXT DEFAULT 'unidades',
  projected_end_at TIMESTAMPTZ,
  last_refill_at TIMESTAMPTZ,
  consumption_history JSONB DEFAULT '[]'::jsonb,
  created_from_prescription_id UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  trial_used BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  price_variant TEXT DEFAULT 'A',
  pricing_variant TEXT DEFAULT 'A',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- NOTIFICATION TABLES
-- ============================================

CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_number TEXT,
  whatsapp_instance_id TEXT,
  whatsapp_api_token TEXT,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dose_id UUID REFERENCES public.dose_instances(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dose_id UUID,
  notification_type TEXT NOT NULL,
  delivery_status TEXT NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.local_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dose_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  notification_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.alarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  recurrence TEXT NOT NULL DEFAULT 'once',
  sound BOOLEAN NOT NULL DEFAULT true,
  vibrate BOOLEAN NOT NULL DEFAULT true,
  silent BOOLEAN NOT NULL DEFAULT false,
  require_interaction BOOLEAN NOT NULL DEFAULT true,
  url TEXT,
  action TEXT,
  category TEXT DEFAULT 'reminder',
  metadata JSONB DEFAULT '{}'::jsonb,
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- MEDICAL DOCUMENTS TABLES
-- ============================================

CREATE TABLE public.categorias_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.documentos_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id),
  categoria_id UUID REFERENCES public.categorias_saude(id),
  title TEXT,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  provider TEXT,
  notes TEXT,
  ocr_text TEXT,
  issued_at DATE,
  expires_at DATE,
  meta JSONB DEFAULT '{}'::jsonb,
  status_extraction TEXT DEFAULT 'pending_review',
  confidence_score DOUBLE PRECISION DEFAULT 0.0,
  extraction_attempted_at TIMESTAMPTZ,
  extraction_error TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.exames_laboratoriais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id),
  documento_id UUID REFERENCES public.documentos_saude(id),
  data_exame DATE NOT NULL,
  laboratorio TEXT,
  medico_solicitante TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.valores_exames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exame_id UUID NOT NULL REFERENCES public.exames_laboratoriais(id) ON DELETE CASCADE,
  parametro TEXT NOT NULL,
  valor NUMERIC,
  valor_texto TEXT,
  unidade TEXT,
  referencia_min NUMERIC,
  referencia_max NUMERIC,
  referencia_texto TEXT,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.consultas_medicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id),
  documento_id UUID REFERENCES public.documentos_saude(id),
  data_consulta TIMESTAMPTZ NOT NULL,
  especialidade TEXT,
  medico_nome TEXT,
  local TEXT,
  motivo TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'agendada',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID,
  document_id UUID,
  vaccine_name TEXT NOT NULL,
  vaccine_type TEXT,
  dose_number INTEGER,
  dose_description TEXT,
  application_date DATE NOT NULL,
  next_dose_date DATE,
  batch_number TEXT,
  manufacturer TEXT,
  expiry_date DATE,
  vaccination_location TEXT,
  vaccinator_name TEXT,
  vaccinator_registration TEXT,
  sus_card_number TEXT,
  disease_prevention TEXT,
  adverse_reactions TEXT,
  official_source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.sinais_vitais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id),
  data_medicao TIMESTAMPTZ NOT NULL DEFAULT now(),
  pressao_sistolica INTEGER,
  pressao_diastolica INTEGER,
  frequencia_cardiaca INTEGER,
  temperatura NUMERIC,
  glicemia INTEGER,
  saturacao_oxigenio INTEGER,
  peso_kg NUMERIC,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.health_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  weight_kg NUMERIC,
  height_cm NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.eventos_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id),
  type health_event_type NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  due_date DATE NOT NULL,
  related_document_id UUID REFERENCES public.documentos_saude(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.side_effects_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id),
  dose_id UUID REFERENCES public.dose_instances(id),
  item_id UUID REFERENCES public.items(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  overall_feeling INTEGER,
  energy_level INTEGER,
  pain_level INTEGER,
  nausea_level INTEGER,
  sleep_quality INTEGER,
  side_effect_tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.health_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id),
  insight_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SHARING TABLES
-- ============================================

CREATE TABLE public.medical_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID NOT NULL REFERENCES public.documentos_saude(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  allow_download BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.compartilhamentos_doc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documentos_saude(id),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  allow_download BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.consultation_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.caregiver_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_owner UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_owner UUID NOT NULL,
  caregiver_user_id UUID,
  email_or_phone TEXT NOT NULL,
  role caregiver_role NOT NULL DEFAULT 'viewer',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id_owner, email_or_phone)
);

-- ============================================
-- REFERRAL SYSTEM TABLES
-- ============================================

CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID,
  referral_code_used TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  activated_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.referral_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL,
  current_count INTEGER DEFAULT 0,
  target_count INTEGER NOT NULL,
  completed_at TIMESTAMPTZ,
  reward_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, goal_type)
);

CREATE TABLE public.referral_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  max_cycles INTEGER DEFAULT 12,
  cycles_used INTEGER DEFAULT 0,
  valid_until TIMESTAMPTZ,
  stripe_coupon_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id),
  reward_type TEXT NOT NULL,
  reward_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  granted_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.referral_fraud_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  referrer_id UUID,
  referral_id UUID REFERENCES public.referrals(id),
  fraud_type TEXT NOT NULL,
  device_fingerprint TEXT,
  ip_address INET,
  action_taken TEXT DEFAULT 'flagged',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AFFILIATE SYSTEM TABLES
-- ============================================

CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  utm_source TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.affiliate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  affiliate_id UUID REFERENCES public.affiliates(id),
  medication_id UUID REFERENCES public.items(id),
  event_type TEXT NOT NULL DEFAULT 'click',
  utm_params JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- DRUG INTERACTION TABLES
-- ============================================

CREATE TABLE public.drug_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_a TEXT NOT NULL,
  drug_b TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.medication_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_a TEXT NOT NULL,
  drug_b TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  mechanism TEXT,
  recommendation TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_interaction_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id),
  item_a_id UUID REFERENCES public.items(id),
  item_b_id UUID REFERENCES public.items(id),
  interaction_id UUID REFERENCES public.medication_interactions(id),
  severity TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SYSTEM TABLES
-- ============================================

CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.app_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purpose consent_purpose NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.premium_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.document_extraction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID REFERENCES public.documentos_saude(id),
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  extraction_type TEXT NOT NULL,
  status TEXT NOT NULL,
  pages_count INTEGER,
  confidence_score DOUBLE PRECISION,
  extracted_fields JSONB DEFAULT '{}'::jsonb,
  processing_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.extraction_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  image_hash TEXT NOT NULL,
  extraction_type TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.medical_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  exam_date DATE,
  extracted_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- VIEWS
-- ============================================

CREATE OR REPLACE VIEW public.medical_exams_v AS
SELECT 
  d.id,
  d.user_id,
  d.issued_at::date as exam_date,
  d.created_at,
  d.updated_at,
  d.file_path as file_url,
  d.title as file_name,
  d.ocr_text as extracted_data,
  d.notes
FROM public.documentos_saude d
WHERE d.categoria_id IN (
  SELECT id FROM public.categorias_saude WHERE slug IN ('exame', 'laboratorio')
);

CREATE OR REPLACE VIEW public.user_adherence_streaks AS
SELECT 
  i.user_id,
  COUNT(DISTINCT DATE(di.taken_at)) as current_streak,
  COUNT(DISTINCT DATE(di.taken_at)) as longest_streak
FROM public.items i
JOIN public.dose_instances di ON i.id = di.item_id
WHERE di.status = 'taken'
  AND di.taken_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY i.user_id;

-- ============================================
-- INDEXES
-- ============================================

-- Items
CREATE INDEX idx_items_user ON public.items(user_id);
CREATE INDEX idx_items_active ON public.items(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_items_profile ON public.items(profile_id);

-- Schedules
CREATE INDEX idx_schedules_item ON public.schedules(item_id);
CREATE INDEX idx_schedules_active ON public.schedules(item_id, is_active) WHERE is_active = true;

-- Dose Instances
CREATE INDEX idx_dose_instances_item ON public.dose_instances(item_id);
CREATE INDEX idx_dose_instances_schedule ON public.dose_instances(schedule_id);
CREATE INDEX idx_dose_instances_due ON public.dose_instances(due_at);
CREATE INDEX idx_dose_instances_status ON public.dose_instances(status);
CREATE INDEX idx_dose_instances_item_due ON public.dose_instances(item_id, due_at);

-- Subscriptions
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- Notifications
CREATE INDEX idx_notification_logs_user ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_scheduled ON public.notification_logs(scheduled_at);
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);

-- Documents
CREATE INDEX idx_documentos_user ON public.documentos_saude(user_id);
CREATE INDEX idx_documentos_profile ON public.documentos_saude(profile_id);
CREATE INDEX idx_documentos_categoria ON public.documentos_saude(categoria_id);

-- Alarms
CREATE INDEX idx_alarms_user_scheduled ON public.alarms(user_id, scheduled_at);
CREATE INDEX idx_alarms_enabled ON public.alarms(user_id, enabled) WHERE enabled = true;

-- Audit
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource, resource_id);

-- App Metrics
CREATE INDEX idx_app_metrics_user ON public.app_metrics(user_id);
CREATE INDEX idx_app_metrics_event ON public.app_metrics(event_name);
CREATE INDEX idx_app_metrics_created ON public.app_metrics(created_at);
