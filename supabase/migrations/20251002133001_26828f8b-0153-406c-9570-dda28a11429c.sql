-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create items table (medications, supplements, vitamins)
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  dose_text TEXT,
  with_food BOOLEAN DEFAULT false,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create schedules table
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  freq_type TEXT NOT NULL CHECK (freq_type IN ('daily', 'days_of_week', 'weekly', 'monthly')),
  times JSONB NOT NULL DEFAULT '[]'::jsonb,
  days_of_week INTEGER[] DEFAULT NULL,
  day_of_month INTEGER DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create dose_instances table (individual reminders)
CREATE TABLE public.dose_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'taken', 'snoozed', 'skipped')),
  taken_at TIMESTAMPTZ DEFAULT NULL,
  delay_minutes INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create stock table
CREATE TABLE public.stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE UNIQUE,
  units_total NUMERIC NOT NULL DEFAULT 0,
  units_left NUMERIC NOT NULL DEFAULT 0,
  unit_label TEXT DEFAULT 'unidades',
  projected_end_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_items_user_id ON public.items(user_id);
CREATE INDEX idx_items_active ON public.items(is_active) WHERE is_active = true;
CREATE INDEX idx_schedules_item_id ON public.schedules(item_id);
CREATE INDEX idx_dose_instances_schedule_id ON public.dose_instances(schedule_id);
CREATE INDEX idx_dose_instances_item_id ON public.dose_instances(item_id);
CREATE INDEX idx_dose_instances_due_at ON public.dose_instances(due_at);
CREATE INDEX idx_dose_instances_status ON public.dose_instances(status);
CREATE INDEX idx_stock_item_id ON public.stock(item_id);

-- Enable Row Level Security
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

-- RLS Policies for items (temporary public access for MVP - will add auth later)
CREATE POLICY "Enable all access for items" ON public.items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for schedules" ON public.schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for dose_instances" ON public.dose_instances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for stock" ON public.stock FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for items updated_at
CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for stock updated_at
CREATE TRIGGER update_stock_updated_at
BEFORE UPDATE ON public.stock
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();