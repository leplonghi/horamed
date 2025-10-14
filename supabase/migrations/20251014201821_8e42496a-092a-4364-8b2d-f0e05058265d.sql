-- Habilitar RLS na tabela drug_interactions
ALTER TABLE public.drug_interactions ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (todos podem ver interações conhecidas)
CREATE POLICY "Anyone can view drug interactions"
ON public.drug_interactions FOR SELECT
USING (true);

-- Apenas admins podem inserir/atualizar (por enquanto sem inserção pública)
-- Em produção, isso seria gerenciado por um processo administrativo