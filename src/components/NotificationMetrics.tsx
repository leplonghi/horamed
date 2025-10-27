import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, CheckCircle2, XCircle, AlertTriangle, Bell } from "lucide-react";
import { useResilientReminders } from "@/hooks/useResilientReminders";

interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  fallback: number;
  byType: {
    push: number;
    local: number;
    web: number;
    sound: number;
  };
  successRate: string;
}

export default function NotificationMetrics() {
  const { getNotificationStats } = useResilientReminders();
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await getNotificationStats(7);
    setStats(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas de Lembretes
          </CardTitle>
          <CardDescription>Carregando estatísticas...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas de Lembretes
          </CardTitle>
          <CardDescription>Nenhum dado disponível ainda</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Métricas de Lembretes
        </CardTitle>
        <CardDescription>Últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Taxa de Sucesso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Taxa de Sucesso</span>
            <Badge variant={parseFloat(stats.successRate) >= 90 ? "default" : "secondary"}>
              {stats.successRate}%
            </Badge>
          </div>
          <Progress value={parseFloat(stats.successRate)} className="h-2" />
        </div>

        {/* Total de Notificações */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Bell className="h-4 w-4" />
              Total
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Enviadas
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <XCircle className="h-4 w-4" />
              Falharam
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Fallback
            </div>
            <div className="text-2xl font-bold text-amber-600">{stats.fallback}</div>
          </div>
        </div>

        {/* Por Tipo */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Por Tipo de Notificação</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div
                key={type}
                className="flex items-center justify-between p-2 rounded-md bg-muted/50"
              >
                <span className="text-sm capitalize">
                  {type === "push" && "Push"}
                  {type === "local" && "Local"}
                  {type === "web" && "Web"}
                  {type === "sound" && "Som"}
                </span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Informação sobre Fallback */}
        {stats.fallback > 0 && (
          <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
            <p className="text-xs text-amber-900 dark:text-amber-100">
              <strong>Sistema de Fallback:</strong> {stats.fallback} notificações foram
              salvas localmente e serão reenviadas automaticamente quando possível.
            </p>
          </div>
        )}

        {stats.failed > 0 && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <p className="text-xs text-red-900 dark:text-red-100">
              <strong>Atenção:</strong> {stats.failed} notificações falharam. O sistema
              tentará reenviar automaticamente até 3 vezes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
