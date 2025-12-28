import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface NotificationMetric {
  notification_type: string;
  delivery_status: string;
  count: number;
}

export default function NotificationMetrics() {
  const [metrics, setMetrics] = useState<NotificationMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_metrics')
        .select('notification_type, delivery_status, metadata')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Aggregate metrics
      const aggregated = data?.reduce((acc, item) => {
        const key = `${item.notification_type}-${item.delivery_status}`;
        if (!acc[key]) {
          acc[key] = {
            notification_type: item.notification_type,
            delivery_status: item.delivery_status,
            count: 0
          };
        }
        acc[key].count++;
        return acc;
      }, {} as Record<string, NotificationMetric>);

      setMetrics(Object.values(aggregated || {}));
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const totalDelivered = metrics.filter(m => m.delivery_status === 'delivered').reduce((sum, m) => sum + m.count, 0);
  const totalFailed = metrics.filter(m => m.delivery_status === 'failed').reduce((sum, m) => sum + m.count, 0);
  const total = totalDelivered + totalFailed;
  const deliveryRate = total > 0 ? ((totalDelivered / total) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">{t('notifMetrics.loading')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">{t('notifMetrics.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('notifMetrics.deliveryRate')}: <span className="font-semibold text-foreground">{deliveryRate}%</span>
          {total > 0 && ` (${totalDelivered}/${total})`}
        </p>
      </div>

      <div className="space-y-2">
        {metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('notifMetrics.noMetrics')}</p>
        ) : (
          metrics.map((metric, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(metric.delivery_status)}
                <div>
                  <p className="text-sm font-medium capitalize">{metric.notification_type}</p>
                  <p className="text-xs text-muted-foreground capitalize">{metric.delivery_status}</p>
                </div>
              </div>
              <span className="text-sm font-semibold">{metric.count}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}