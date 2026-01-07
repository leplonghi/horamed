-- Drop and recreate medical_exams_v with security_invoker to respect RLS
DROP VIEW IF EXISTS public.medical_exams_v;

CREATE VIEW public.medical_exams_v
WITH (security_invoker = true)
AS
SELECT 
    d.id,
    d.user_id,
    d.file_path AS file_url,
    d.title AS file_name,
    d.issued_at AS exam_date,
    d.ocr_text AS extracted_data,
    d.notes,
    d.created_at,
    d.updated_at
FROM documentos_saude d
JOIN categorias_saude c ON d.categoria_id = c.id
WHERE c.slug = 'exame'::text;

-- Grant access to authenticated users (RLS on documentos_saude will filter results)
GRANT SELECT ON public.medical_exams_v TO authenticated;