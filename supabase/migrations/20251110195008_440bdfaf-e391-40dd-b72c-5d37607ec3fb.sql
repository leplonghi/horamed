-- Criar tabela de logs de extração de documentos
CREATE TABLE IF NOT EXISTS public.document_extraction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documentos_saude(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  pages_count INTEGER,
  confidence_score DOUBLE PRECISION,
  extraction_type TEXT NOT NULL, -- 'receita', 'exame', 'consulta', etc
  status TEXT NOT NULL, -- 'success', 'failed', 'low_confidence'
  error_message TEXT,
  extracted_fields JSONB DEFAULT '{}'::jsonb,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.document_extraction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus logs de extração"
  ON public.document_extraction_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema insere logs de extração"
  ON public.document_extraction_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_extraction_logs_user_id ON public.document_extraction_logs(user_id);
CREATE INDEX idx_extraction_logs_document_id ON public.document_extraction_logs(document_id);
CREATE INDEX idx_extraction_logs_status ON public.document_extraction_logs(status);
CREATE INDEX idx_extraction_logs_created_at ON public.document_extraction_logs(created_at DESC);