import { AlertTriangle, XCircle, AlertCircle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CriticalAlert } from "@/hooks/useCriticalAlerts";
import { cn } from "@/lib/utils";

interface CriticalAlertBannerProps {
  alerts: CriticalAlert[];
  onDismiss: (alertId: string) => void;
}

export default function CriticalAlertBanner({ alerts, onDismiss }: CriticalAlertBannerProps) {
  if (alerts.length === 0) return null;

  const getSeverityConfig = (severity: CriticalAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          icon: XCircle,
          bg: "bg-destructive/10",
          border: "border-destructive",
          text: "text-destructive",
          iconBg: "bg-destructive/20",
        };
      case "urgent":
        return {
          icon: AlertTriangle,
          bg: "bg-orange-500/10",
          border: "border-orange-500",
          text: "text-orange-600 dark:text-orange-500",
          iconBg: "bg-orange-500/20",
        };
      case "warning":
        return {
          icon: AlertCircle,
          bg: "bg-yellow-500/10",
          border: "border-yellow-500",
          text: "text-yellow-600 dark:text-yellow-500",
          iconBg: "bg-yellow-500/20",
        };
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-destructive flex items-center gap-2">
        <AlertTriangle className="h-6 w-6" />
        AÇÕES URGENTES
      </h2>
      {alerts.map((alert) => {
        const config = getSeverityConfig(alert.severity);
        const Icon = config.icon;

        return (
          <Card
            key={alert.id}
            className={cn(
              "p-4 border-2 animate-pulse-slow",
              config.bg,
              config.border
            )}
          >
            <div className="flex gap-3">
              <div className={cn("p-2 rounded-lg shrink-0", config.iconBg)}>
                <Icon className={cn("h-5 w-5", config.text)} />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className={cn("font-bold text-sm", config.text)}>
                  {alert.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {alert.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDismiss(alert.id)}
                className="shrink-0 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
