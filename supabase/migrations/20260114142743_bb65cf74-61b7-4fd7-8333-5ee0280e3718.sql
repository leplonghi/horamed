-- ===================================
-- Sistema de Interações Medicamentosas
-- ===================================

-- Tabela de interações medicamentosas
CREATE TABLE public.medication_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drug_a TEXT NOT NULL,
  drug_b TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'moderate', 'high', 'contraindicated')),
  description TEXT NOT NULL,
  recommendation TEXT,
  mechanism TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(drug_a, drug_b)
);

-- Índices para busca rápida
CREATE INDEX idx_medication_interactions_drug_a ON public.medication_interactions(LOWER(drug_a));
CREATE INDEX idx_medication_interactions_drug_b ON public.medication_interactions(LOWER(drug_b));
CREATE INDEX idx_medication_interactions_severity ON public.medication_interactions(severity);

-- Enable RLS
ALTER TABLE public.medication_interactions ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (referência)
CREATE POLICY "Anyone can read medication interactions" 
ON public.medication_interactions 
FOR SELECT 
USING (true);

-- Tabela de alertas de interação para usuários
CREATE TABLE public.user_interaction_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.medication_interactions(id) ON DELETE CASCADE,
  item_a_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  item_b_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_user_interaction_alerts_user ON public.user_interaction_alerts(user_id);
CREATE INDEX idx_user_interaction_alerts_profile ON public.user_interaction_alerts(profile_id);

-- Enable RLS
ALTER TABLE public.user_interaction_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own interaction alerts" 
ON public.user_interaction_alerts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interaction alerts" 
ON public.user_interaction_alerts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interaction alerts" 
ON public.user_interaction_alerts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interaction alerts" 
ON public.user_interaction_alerts 
FOR DELETE 
USING (auth.uid() = user_id);

-- ===================================
-- Dados iniciais de interações comuns no Brasil
-- ===================================
INSERT INTO public.medication_interactions (drug_a, drug_b, severity, description, recommendation, mechanism) VALUES
-- Anticoagulantes
('varfarina', 'aspirina', 'high', 'Risco aumentado de sangramento grave', 'Evitar uso simultâneo. Consulte seu médico imediatamente.', 'Ambos afetam a coagulação sanguínea'),
('varfarina', 'ibuprofeno', 'high', 'Risco aumentado de sangramento', 'Evitar AINEs com varfarina. Use paracetamol se necessário.', 'AINEs aumentam efeito anticoagulante'),
('varfarina', 'omeprazol', 'moderate', 'Pode aumentar efeito da varfarina', 'Monitorar INR mais frequentemente.', 'Omeprazol inibe metabolismo da varfarina'),

-- Estatinas
('sinvastatina', 'amiodarona', 'high', 'Risco de rabdomiólise (lesão muscular grave)', 'Dose máxima de sinvastatina 20mg. Considerar outra estatina.', 'Amiodarona inibe metabolismo da sinvastatina'),
('sinvastatina', 'anlodipino', 'moderate', 'Risco aumentado de miopatia', 'Limitar sinvastatina a 20mg/dia.', 'Anlodipino aumenta níveis de sinvastatina'),
('atorvastatina', 'claritromicina', 'high', 'Risco de rabdomiólise', 'Suspender estatina durante tratamento com claritromicina.', 'Claritromicina inibe metabolismo'),

-- Antidepressivos
('fluoxetina', 'tramadol', 'high', 'Risco de síndrome serotoninérgica', 'Evitar combinação. Sintomas: agitação, tremores, febre.', 'Aumento excessivo de serotonina'),
('sertralina', 'tramadol', 'high', 'Risco de síndrome serotoninérgica', 'Evitar combinação ou usar dose mínima.', 'Aumento excessivo de serotonina'),
('fluoxetina', 'ibuprofeno', 'moderate', 'Risco aumentado de sangramento gastrointestinal', 'Use protetor gástrico. Evitar uso prolongado.', 'ISRS + AINE = maior risco de sangramento'),

-- Diabetes
('metformina', 'contraste iodado', 'high', 'Risco de acidose lática', 'Suspender metformina 48h antes de exames com contraste.', 'Contraste pode causar lesão renal'),
('glibenclamida', 'fluconazol', 'moderate', 'Risco de hipoglicemia grave', 'Monitorar glicemia. Reduzir dose se necessário.', 'Fluconazol aumenta efeito da glibenclamida'),

-- Hipertensão
('losartana', 'espironolactona', 'moderate', 'Risco de hipercalemia (potássio alto)', 'Monitorar potássio sérico regularmente.', 'Ambos retêm potássio'),
('enalapril', 'espironolactona', 'moderate', 'Risco de hipercalemia', 'Monitorar potássio. Evitar suplementos de K+.', 'Combinação retém potássio'),
('atenolol', 'verapamil', 'high', 'Risco de bradicardia grave e bloqueio cardíaco', 'Evitar combinação. Usar com cautela extrema.', 'Efeito aditivo na frequência cardíaca'),

-- Antibióticos
('ciprofloxacino', 'tizanidina', 'contraindicated', 'Aumento perigoso dos níveis de tizanidina', 'Combinação contraindicada. Usar alternativas.', 'Ciprofloxacino bloqueia metabolismo'),
('metronidazol', 'álcool', 'high', 'Reação tipo dissulfiram (náusea, vômito, taquicardia)', 'Evitar álcool durante e 48h após tratamento.', 'Bloqueia metabolismo do álcool'),
('amoxicilina', 'metotrexato', 'moderate', 'Aumento da toxicidade do metotrexato', 'Monitorar função renal e hemograma.', 'Reduz excreção renal do metotrexato'),

-- Suplementos
('levotiroxina', 'cálcio', 'moderate', 'Cálcio reduz absorção da levotiroxina', 'Tomar com 4 horas de diferença.', 'Quelação no intestino'),
('levotiroxina', 'ferro', 'moderate', 'Ferro reduz absorção da levotiroxina', 'Tomar com 4 horas de diferença.', 'Quelação no intestino'),
('levotiroxina', 'omeprazol', 'low', 'Pode reduzir absorção da levotiroxina', 'Monitorar TSH. Ajustar dose se necessário.', 'Alteração do pH gástrico'),

-- GLP-1 / Bariátrica
('semaglutida', 'insulina', 'moderate', 'Risco aumentado de hipoglicemia', 'Reduzir dose de insulina ao iniciar semaglutida.', 'Efeito glicêmico aditivo'),
('liraglutida', 'insulina', 'moderate', 'Risco aumentado de hipoglicemia', 'Ajustar dose de insulina. Monitorar glicemia.', 'Efeito glicêmico aditivo'),
('orlistate', 'ciclosporina', 'high', 'Reduz absorção de ciclosporina', 'Tomar ciclosporina 3h antes ou após orlistate.', 'Orlistate afeta absorção de gorduras'),

-- Ansiolíticos/Sedativos
('alprazolam', 'álcool', 'high', 'Sedação excessiva e depressão respiratória', 'Evitar álcool completamente.', 'Efeito sedativo aditivo'),
('clonazepam', 'álcool', 'high', 'Sedação excessiva e risco de overdose', 'Não consumir álcool durante tratamento.', 'Efeito depressor do SNC'),
('zolpidem', 'álcool', 'high', 'Risco de sedação perigosa', 'Evitar álcool. Risco de amnésia e quedas.', 'Potencialização do efeito sedativo'),

-- Anticonvulsivantes
('carbamazepina', 'anticoncepcionais', 'high', 'Reduz eficácia contraceptiva', 'Usar método adicional de barreira.', 'Carbamazepina induz metabolismo'),
('fenitoína', 'anticoncepcionais', 'high', 'Reduz eficácia contraceptiva', 'Considerar DIU ou outro método.', 'Indução enzimática'),

-- Cardiovascular
('digoxina', 'amiodarona', 'high', 'Toxicidade da digoxina (náusea, arritmias)', 'Reduzir dose de digoxina pela metade.', 'Amiodarona aumenta níveis de digoxina'),
('digoxina', 'verapamil', 'moderate', 'Aumento dos níveis de digoxina', 'Monitorar sinais de toxicidade digitálica.', 'Verapamil reduz excreção'),

-- Outros
('sildenafil', 'nitratos', 'contraindicated', 'Queda pressão potencialmente fatal', 'NUNCA usar juntos. Risco de morte.', 'Vasodilatação excessiva'),
('finasterida', 'testosterona', 'moderate', 'Efeitos antagônicos', 'Revisar necessidade de ambos.', 'Mecanismos opostos'),
('isotretinoína', 'tetraciclina', 'contraindicated', 'Risco de hipertensão intracraniana', 'Combinação contraindicada.', 'Efeitos aditivos no SNC');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_medication_interactions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_medication_interactions_timestamp
BEFORE UPDATE ON public.medication_interactions
FOR EACH ROW
EXECUTE FUNCTION update_medication_interactions_timestamp();