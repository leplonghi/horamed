-- Restrict notification_logs INSERT to service role only
-- This prevents users from creating fake notification records

DROP POLICY IF EXISTS "Sistema insere notificações" ON notification_logs;

CREATE POLICY "Only service role can insert notifications"
ON notification_logs FOR INSERT
WITH CHECK (false);

-- Keep existing SELECT and UPDATE policies as they are secure