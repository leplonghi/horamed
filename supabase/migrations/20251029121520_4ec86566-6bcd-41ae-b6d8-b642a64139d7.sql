-- =====================
-- MIGRATIONS PARA FEATURES DIFERENCIAIS
-- =====================

-- 1) HANDSHAKE DO CUIDADOR
CREATE TYPE caregiver_role AS ENUM ('viewer', 'helper');

CREATE TABLE IF NOT EXISTS caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_or_phone TEXT NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  role caregiver_role NOT NULL DEFAULT 'viewer',
  caregiver_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id_owner, email_or_phone)
);

CREATE INDEX idx_caregivers_owner ON caregivers(user_id_owner);
CREATE INDEX idx_caregivers_caregiver ON caregivers(caregiver_user_id);

ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their caregivers"
ON caregivers FOR ALL
USING (auth.uid() = user_id_owner);

CREATE POLICY "Caregivers can view their assignments"
ON caregivers FOR SELECT
USING (auth.uid() = caregiver_user_id);

-- Links de convite de cuidador
CREATE TABLE IF NOT EXISTS caregiver_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_caregiver_links_token ON caregiver_links(token);
CREATE INDEX idx_caregiver_links_owner ON caregiver_links(user_id_owner);

ALTER TABLE caregiver_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their caregiver links"
ON caregiver_links FOR ALL
USING (auth.uid() = user_id_owner);

-- 2) COMPARTILHAMENTO DE DOCUMENTOS COM TOKEN
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documentos_saude(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER NOT NULL DEFAULT 0,
  allow_download BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_shares_token ON document_shares(token);
CREATE INDEX idx_document_shares_document ON document_shares(document_id);
CREATE INDEX idx_document_shares_user ON document_shares(user_id);

ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their document shares"
ON document_shares FOR ALL
USING (auth.uid() = user_id);

-- 3) LINKS DE AFILIADO
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  utm_source TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_affiliates_enabled ON affiliates(enabled);

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read enabled affiliates"
ON affiliates FOR SELECT
USING (enabled = true);

-- 4) EVENTOS DE AFILIADO (cliques)
CREATE TABLE IF NOT EXISTS affiliate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
  medication_id UUID REFERENCES items(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL DEFAULT 'click',
  utm_params JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_affiliate_events_user ON affiliate_events(user_id);
CREATE INDEX idx_affiliate_events_affiliate ON affiliate_events(affiliate_id);
CREATE INDEX idx_affiliate_events_created ON affiliate_events(created_at);

ALTER TABLE affiliate_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their affiliate events"
ON affiliate_events FOR SELECT
USING (auth.uid() = user_id);

-- 5) ATUALIZAR SUBSCRIPTIONS para pricing variant
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS pricing_variant TEXT DEFAULT 'A';

-- 6) ADICIONAR ACTOR NOS DOSE EVENTS
ALTER TABLE dose_instances 
ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 7) CONSULTATION CARDS (QR temporário)
CREATE TABLE IF NOT EXISTS consultation_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultation_cards_token ON consultation_cards(token);
CREATE INDEX idx_consultation_cards_user ON consultation_cards(user_id);

ALTER TABLE consultation_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their consultation cards"
ON consultation_cards FOR ALL
USING (auth.uid() = user_id);

-- 8) ADICIONAR NOVOS FEATURE FLAGS
INSERT INTO feature_flags (key, enabled, config) 
VALUES 
  ('caregiverHandshake', false, '{"description": "Sistema de cuidador com notificações de exceção"}'),
  ('consultationQR', false, '{"description": "Cartão de consulta com QR code temporário"}'),
  ('affiliate', false, '{"description": "Links de recompra com afiliados"}'),
  ('interactionsLite', false, '{"description": "IA educativa leve para interações medicamentosas"}')
ON CONFLICT (key) DO NOTHING;

-- 9) MÉTRICAS E EVENTOS
CREATE TABLE IF NOT EXISTS app_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_metrics_event ON app_metrics(event_name);
CREATE INDEX idx_app_metrics_user ON app_metrics(user_id);
CREATE INDEX idx_app_metrics_created ON app_metrics(created_at);

ALTER TABLE app_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own metrics"
ON app_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own metrics"
ON app_metrics FOR SELECT
USING (auth.uid() = user_id);