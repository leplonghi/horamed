-- Create weight_logs table for tracking weight history
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own weight logs"
ON public.weight_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight logs"
ON public.weight_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight logs"
ON public.weight_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight logs"
ON public.weight_logs FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_weight_logs_user_profile ON public.weight_logs(user_id, profile_id, recorded_at DESC);

-- Add helpful comment
COMMENT ON TABLE public.weight_logs IS 'Stores weight tracking history for users and their family profiles';