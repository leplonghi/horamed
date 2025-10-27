-- Criar tabela de métricas de notificações
CREATE TABLE IF NOT EXISTS public.notification_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dose_id UUID,
  notification_type TEXT NOT NULL, -- 'push', 'local', 'web', 'sound'
  delivery_status TEXT NOT NULL, -- 'sent', 'delivered', 'failed', 'fallback'
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_notification_metrics_user_id ON public.notification_metrics(user_id);
CREATE INDEX idx_notification_metrics_dose_id ON public.notification_metrics(dose_id);
CREATE INDEX idx_notification_metrics_created_at ON public.notification_metrics(created_at);
CREATE INDEX idx_notification_metrics_status ON public.notification_metrics(delivery_status);

-- RLS policies
ALTER TABLE public.notification_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas métricas"
  ON public.notification_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema insere métricas"
  ON public.notification_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Criar tabela de lembretes locais (fallback)
CREATE TABLE IF NOT EXISTS public.local_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dose_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  notification_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_local_reminders_user_id ON public.local_reminders(user_id);
CREATE INDEX idx_local_reminders_scheduled_at ON public.local_reminders(scheduled_at);
CREATE INDEX idx_local_reminders_status ON public.local_reminders(status);

-- RLS policies
ALTER TABLE public.local_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam seus lembretes locais"
  ON public.local_reminders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_local_reminders_updated_at
  BEFORE UPDATE ON public.local_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();