-- Create alarms table for cloud sync
CREATE TABLE public.alarms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
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
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own alarms"
ON public.alarms FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alarms"
ON public.alarms FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alarms"
ON public.alarms FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alarms"
ON public.alarms FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_alarms_updated_at
BEFORE UPDATE ON public.alarms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for efficient queries
CREATE INDEX idx_alarms_user_scheduled ON public.alarms(user_id, scheduled_at);
CREATE INDEX idx_alarms_enabled ON public.alarms(user_id, enabled) WHERE enabled = true;