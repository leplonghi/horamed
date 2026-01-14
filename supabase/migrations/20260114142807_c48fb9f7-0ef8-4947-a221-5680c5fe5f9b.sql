-- Corrigir search_path da função criada
CREATE OR REPLACE FUNCTION update_medication_interactions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;