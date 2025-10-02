-- Create health_history table to track health data over time
CREATE TABLE IF NOT EXISTS public.health_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  weight_kg NUMERIC,
  height_cm NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.health_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health history" 
ON public.health_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health history" 
ON public.health_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health history" 
ON public.health_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health history" 
ON public.health_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_health_history_user_date ON public.health_history(user_id, recorded_at DESC);