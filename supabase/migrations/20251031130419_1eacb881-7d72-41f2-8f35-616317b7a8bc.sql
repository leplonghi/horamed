-- Adicionar campos para WhatsApp nas preferências de notificação
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_instance_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_api_token TEXT;