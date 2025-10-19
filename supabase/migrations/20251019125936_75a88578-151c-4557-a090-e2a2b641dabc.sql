-- Corrigir Security Definer View para medical_exams_v
DROP VIEW IF EXISTS public.medical_exams_v;

CREATE OR REPLACE VIEW public.medical_exams_v
WITH (security_invoker=on)
AS
SELECT 
  d.id,
  d.user_id,
  d.file_path as file_url,
  d.title as file_name,
  d.issued_at as exam_date,
  d.ocr_text as extracted_data,
  d.notes,
  d.created_at,
  d.updated_at
FROM public.documentos_saude d
JOIN public.categorias_saude c ON d.categoria_id = c.id
WHERE c.slug = 'exame';