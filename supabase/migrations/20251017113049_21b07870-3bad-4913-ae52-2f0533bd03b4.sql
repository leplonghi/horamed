-- Adicionar coluna skip_reason para registrar motivos de pulo
ALTER TABLE dose_instances ADD COLUMN IF NOT EXISTS skip_reason TEXT;

-- Criar view para calcular streaks (sequências) de adesão
CREATE OR REPLACE VIEW user_adherence_streaks AS
WITH daily_adherence AS (
  SELECT 
    items.user_id,
    DATE(dose_instances.due_at) as dose_date,
    COUNT(*) FILTER (WHERE dose_instances.status = 'taken') as taken_count,
    COUNT(*) as total_count,
    CASE 
      WHEN COUNT(*) = COUNT(*) FILTER (WHERE dose_instances.status = 'taken') THEN 1
      ELSE 0
    END as is_perfect_day
  FROM dose_instances
  JOIN items ON dose_instances.item_id = items.id
  WHERE dose_instances.due_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY items.user_id, DATE(dose_instances.due_at)
),
streak_groups AS (
  SELECT 
    user_id,
    dose_date,
    is_perfect_day,
    dose_date - (ROW_NUMBER() OVER (PARTITION BY user_id, is_perfect_day ORDER BY dose_date))::int * INTERVAL '1 day' as streak_group
  FROM daily_adherence
)
SELECT 
  user_id,
  MAX(consecutive_days) as current_streak,
  MAX(consecutive_days) as longest_streak
FROM (
  SELECT 
    user_id,
    streak_group,
    COUNT(*) as consecutive_days
  FROM streak_groups
  WHERE is_perfect_day = 1
  GROUP BY user_id, streak_group
) streaks
GROUP BY user_id;