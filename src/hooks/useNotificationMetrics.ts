import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationStats {
  total: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  channelBreakdown: {
    push: { total: number; success: number };
    email: { total: number; success: number };
    web_push: { total: number; success: number };
  };
}

export function useNotificationMetrics(days: number = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notification-metrics", user?.id, days],
    queryFn: async (): Promise<NotificationStats> => {
      if (!user?.id) throw new Error("Not authenticated");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: metrics, error } = await supabase
        .from("notification_metrics")
        .select("delivery_status, metadata")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      const total = metrics?.length || 0;
      const delivered = metrics?.filter(m => m.delivery_status === "delivered").length || 0;
      const failed = metrics?.filter(m => m.delivery_status === "failed").length || 0;
      const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;

      // Parse channel breakdown from metadata
      const channelBreakdown = {
        push: { total: 0, success: 0 },
        email: { total: 0, success: 0 },
        web_push: { total: 0, success: 0 },
      };

      metrics?.forEach(m => {
        const metadata = m.metadata as Record<string, unknown> | null;
        const channels = (metadata?.channels as Array<{ channel: string; success: boolean }>) || [];
        channels.forEach(ch => {
          if (ch.channel in channelBreakdown) {
            const key = ch.channel as keyof typeof channelBreakdown;
            channelBreakdown[key].total++;
            if (ch.success) channelBreakdown[key].success++;
          }
        });
      });

      return {
        total,
        delivered,
        failed,
        deliveryRate,
        channelBreakdown,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export async function trackNotificationEvent(
  eventName: string,
  eventData: Record<string, any> = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from("app_metrics").insert({
    user_id: user?.id,
    event_name: eventName,
    event_data: eventData,
  });
}

// Telemetry events for tracking
export const NotificationEvents = {
  PERMISSION_REQUESTED: 'notification_permission_requested',
  PERMISSION_GRANTED: 'notification_permission_granted',
  PERMISSION_DENIED: 'notification_permission_denied',
  FIRST_NOTIFICATION_SENT: 'first_notification_sent',
  NOTIFICATION_CLICKED: 'notification_clicked',
  NOTIFICATION_DISMISSED: 'notification_dismissed',
} as const;
