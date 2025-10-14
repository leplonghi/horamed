-- Múltiplos perfis por conta
-- Cada usuário pode ter múltiplos perfis (ex: para família)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  birth_date DATE,
  relationship TEXT DEFAULT 'self', -- self, child, parent, spouse, other
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_is_primary ON public.user_profiles(user_id, is_primary);

-- RLS policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profiles"
ON public.user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profiles"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles"
ON public.user_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar profile_id aos items para suportar múltiplos perfis
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_items_profile_id ON public.items(profile_id);

-- Atualizar RLS policies do items para considerar profile_id
DROP POLICY IF EXISTS "Users can view own items" ON public.items;
CREATE POLICY "Users can view own items"
ON public.items FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.id = items.profile_id 
    AND user_profiles.user_id = auth.uid()
  )
);

-- Tabela para histórico de análises de saúde
CREATE TABLE IF NOT EXISTS public.health_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'adherence_pattern', 'drug_interaction', 'predictive_alert'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- info, warning, critical
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_health_insights_user_id ON public.health_insights(user_id);
CREATE INDEX idx_health_insights_profile_id ON public.health_insights(profile_id);
CREATE INDEX idx_health_insights_severity ON public.health_insights(severity);
CREATE INDEX idx_health_insights_created_at ON public.health_insights(created_at DESC);

-- RLS
ALTER TABLE public.health_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
ON public.health_insights FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own insights"
ON public.health_insights FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
ON public.health_insights FOR UPDATE
USING (auth.uid() = user_id);

-- Tabela para interações medicamentosas conhecidas
CREATE TABLE IF NOT EXISTS public.drug_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_a TEXT NOT NULL,
  drug_b TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'major', 'moderate', 'minor'
  description TEXT NOT NULL,
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX idx_drug_interactions_drugs ON public.drug_interactions(drug_a, drug_b);

-- Dados iniciais de interações comuns (exemplos)
INSERT INTO public.drug_interactions (drug_a, drug_b, interaction_type, description, recommendation) VALUES
  ('Antibiótico', 'Anticoncepcional', 'major', 'Alguns antibióticos podem reduzir a eficácia dos anticoncepcionais orais', 'Use método contraceptivo adicional durante o tratamento'),
  ('Anticoagulante', 'Anti-inflamatório', 'major', 'Aumenta risco de sangramento', 'Consulte seu médico antes de combinar'),
  ('Antidepressivo', 'Álcool', 'moderate', 'Álcool pode potencializar efeitos sedativos', 'Evite consumo de álcool'),
  ('Estatina', 'Toranja', 'moderate', 'Toranja aumenta concentração da estatina no sangue', 'Evite consumo de toranja'),
  ('Ansiolítico', 'Álcool', 'major', 'Combinação perigosa que pode causar depressão respiratória', 'Nunca misture com álcool')
ON CONFLICT DO NOTHING;