import { AlertTriangle, XCircle, AlertCircle, X, ShieldAlert, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CriticalAlert } from "@/hooks/useCriticalAlerts";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface CriticalAlertBannerProps {
  alerts: CriticalAlert[];
  onDismiss: (alertId: string) => void;
  onDismissAll: () => void;
}

export default function CriticalAlertBanner({ alerts, onDismiss, onDismissAll }: CriticalAlertBannerProps) {
  const { t } = useLanguage();

  if (alerts.length === 0) return null;

  const getActionLink = (alert: CriticalAlert): { label: string; path: string } | null => {
    switch (alert.type) {
      case "zero_stock":
        return { label: t('criticalAlert.manageStock'), path: "/estoque" };
      case "missed_essential":
        return { label: t('criticalAlert.viewMedications'), path: "/hoje" };
      case "duplicate_dose":
        return { label: t('criticalAlert.viewHistory'), path: "/historico" };
      case "drug_interaction":
        return { label: t('criticalAlert.viewProfile'), path: "/perfil" };
      default:
        return null;
    }
  };

  const getSeverityConfig = (severity: CriticalAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          icon: XCircle,
          gradient: "from-destructive/20 via-destructive/10 to-destructive/5",
          border: "border-destructive/40",
          text: "text-destructive",
          iconBg: "bg-gradient-to-br from-destructive/30 to-destructive/20",
          glow: "shadow-lg shadow-destructive/20",
        };
      case "urgent":
        return {
          icon: AlertTriangle,
          gradient: "from-orange-500/20 via-orange-500/10 to-orange-500/5",
          border: "border-orange-500/40",
          text: "text-orange-600 dark:text-orange-400",
          iconBg: "bg-gradient-to-br from-orange-500/30 to-orange-500/20",
          glow: "shadow-lg shadow-orange-500/20",
        };
      case "warning":
        return {
          icon: AlertCircle,
          gradient: "from-yellow-500/20 via-yellow-500/10 to-yellow-500/5",
          border: "border-yellow-500/40",
          text: "text-yellow-600 dark:text-yellow-400",
          iconBg: "bg-gradient-to-br from-yellow-500/30 to-yellow-500/20",
          glow: "shadow-lg shadow-yellow-500/20",
        };
    }
  };

  return (
    <div className="space-y-1.5 animate-fade-in">
      <div className="flex items-center justify-between gap-1.5 px-0.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-gradient-to-br from-destructive/20 to-destructive/10 animate-pulse">
            <ShieldAlert className="h-3 w-3 text-destructive" />
          </div>
          <h2 className="text-xs font-bold text-destructive">
            {t('criticalAlert.urgentActions', { 
              count: String(alerts.length),
              plural: alerts.length > 1 ? 's' : ''
            })}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismissAll}
          className="h-6 text-[10px] px-2 hover:bg-destructive/10 text-destructive/70 hover:text-destructive"
        >
          {t('criticalAlert.clearAll')}
        </Button>
      </div>

      <div className="space-y-1.5">
        {alerts.map((alert, index) => {
          const config = getSeverityConfig(alert.severity);
          const Icon = config.icon;
          const actionLink = getActionLink(alert);

          return (
            <Card
              key={alert.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className={cn(
                "p-3 border backdrop-blur-sm bg-gradient-to-br transition-all duration-300 animate-fade-in overflow-hidden",
                config.gradient,
                config.border
              )}
            >
              <div className="flex gap-2 items-center">
                <div className={cn(
                  "p-1.5 rounded shrink-0",
                  config.iconBg
                )}>
                  <Icon className={cn("h-4 w-4", config.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn("font-semibold text-sm leading-tight truncate", config.text)}>
                    {alert.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {actionLink && (
                    <Link to={actionLink.path}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5 border-current/20 hover:bg-background/50 whitespace-nowrap"
                      >
                        {t('criticalAlert.confirm')}
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDismiss(alert.id)}
                    className="shrink-0 h-7 w-7 hover:bg-background/50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}