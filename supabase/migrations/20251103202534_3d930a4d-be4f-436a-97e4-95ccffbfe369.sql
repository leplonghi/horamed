-- Enable realtime for dose_instances and items tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.dose_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock;