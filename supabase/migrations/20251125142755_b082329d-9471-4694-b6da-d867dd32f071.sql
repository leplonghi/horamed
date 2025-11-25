-- Adicionar campos necessários para caderneta de vacina na tabela documentos_saude
-- A categoria 'vacinacao' já existe, apenas precisamos garantir que meta suporte todos os campos

-- Criar tabela específica para registro de vacinas individuais
CREATE TABLE IF NOT EXISTS public.vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documentos_saude(id) ON DELETE SET NULL,
  
  -- Informações da Vacina
  vaccine_name TEXT NOT NULL,
  vaccine_type TEXT, -- 'adulto' ou 'infantil'
  disease_prevention TEXT, -- Doença que previne
  dose_number INTEGER, -- 1ª, 2ª, 3ª dose, reforço
  dose_description TEXT, -- "1ª dose", "Reforço", "Dose única"
  
  -- Datas
  application_date DATE NOT NULL,
  next_dose_date DATE,
  
  -- Local e Profissional
  vaccination_location TEXT, -- Nome do posto/clínica
  vaccinator_name TEXT, -- Nome do vacinador
  vaccinator_registration TEXT, -- COREN/outro registro
  
  -- Lote e Fabricante
  batch_number TEXT,
  manufacturer TEXT,
  expiry_date DATE,
  
  -- Observações
  notes TEXT,
  adverse_reactions TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Campos de referência oficial
  sus_card_number TEXT, -- Número do cartão SUS
  official_source TEXT DEFAULT 'Manual' -- 'Manual', 'Ministério da Saúde', 'Caderneta Digital da Criança'
);

-- RLS Policies
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam seus registros de vacina"
  ON public.vaccination_records
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices para melhor performance
CREATE INDEX idx_vaccination_records_user_id ON public.vaccination_records(user_id);
CREATE INDEX idx_vaccination_records_profile_id ON public.vaccination_records(profile_id);
CREATE INDEX idx_vaccination_records_vaccine_type ON public.vaccination_records(vaccine_type);
CREATE INDEX idx_vaccination_records_application_date ON public.vaccination_records(application_date DESC);

-- Trigger para updated_at
CREATE TRIGGER update_vaccination_records_updated_at
  BEFORE UPDATE ON public.vaccination_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.vaccination_records IS 'Registros individuais de vacinas seguindo o modelo da Caderneta de Vacinação Brasileira (adulto e infantil)';
COMMENT ON COLUMN public.vaccination_records.vaccine_type IS 'Tipo de carteira: adulto ou infantil';
COMMENT ON COLUMN public.vaccination_records.official_source IS 'Fonte oficial: Manual, Ministério da Saúde, Caderneta Digital da Criança, etc';