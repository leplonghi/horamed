import { supabase } from "@/integrations/supabase/client";

interface AuditLogParams {
  action: string;
  resource: string;
  resource_id?: string;
  metadata?: Record<string, any>;
}

export const useAuditLog = () => {
  const logAction = async ({
    action,
    resource,
    resource_id,
    metadata = {},
  }: AuditLogParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call edge function with proper authentication
      const { error } = await supabase.functions.invoke('audit-log', {
        body: {
          action,
          resource,
          resource_id,
          metadata,
        },
      });

      if (error) {
        console.error("Failed to log audit action:", error);
      }
    } catch (error) {
      // Log silencioso - não mostrar erro ao usuário
      console.error("Failed to log audit action:", error);
    }
  };

  return { logAction };
};
