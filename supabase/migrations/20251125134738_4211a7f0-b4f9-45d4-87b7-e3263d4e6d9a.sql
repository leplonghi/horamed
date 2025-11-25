-- Create side_effects_log table for tracking medication effects
CREATE TABLE IF NOT EXISTS public.side_effects_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  dose_id UUID REFERENCES public.dose_instances(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ratings 1-5
  overall_feeling INTEGER CHECK (overall_feeling BETWEEN 1 AND 5),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  pain_level INTEGER CHECK (pain_level BETWEEN 1 AND 5),
  nausea_level INTEGER CHECK (nausea_level BETWEEN 1 AND 5),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  
  -- Tags for side effects
  side_effect_tags TEXT[] DEFAULT '{}',
  
  -- Additional notes
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.side_effects_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own side effects logs"
  ON public.side_effects_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own side effects logs"
  ON public.side_effects_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own side effects logs"
  ON public.side_effects_log
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own side effects logs"
  ON public.side_effects_log
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_side_effects_log_user_id ON public.side_effects_log(user_id);
CREATE INDEX idx_side_effects_log_profile_id ON public.side_effects_log(profile_id);
CREATE INDEX idx_side_effects_log_item_id ON public.side_effects_log(item_id);
CREATE INDEX idx_side_effects_log_recorded_at ON public.side_effects_log(recorded_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_side_effects_log_updated_at
  BEFORE UPDATE ON public.side_effects_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();