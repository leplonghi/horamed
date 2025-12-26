import { Heart, Plus, Upload, Pill, Calendar, TrendingUp, Package, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type PageContext = "today" | "medications" | "stock" | "cofre" | "progress" | "calendar" | "health" | "default";

interface QuickAction {
  id: string;
  label: string;
  icon: typeof Plus;
  route?: string;
  action?: () => void;
  color: string;
}

interface ContextualClaraProps {
  context: PageContext;
  className?: string;
  onOpenClara?: () => void;
}

export default function ContextualClara({ context, className, onOpenClara }: ContextualClaraProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const contextConfig: Record<PageContext, { message: string; actions: QuickAction[] }> = {
    today: {
      message: t('clara.todayMessage'),
      actions: [
        { id: "add-dose", label: t('clara.newDose'), icon: Plus, route: "/adicionar-medicamento", color: "text-primary bg-primary/10" },
        { id: "view-stock", label: t('clara.viewStock'), icon: Package, route: "/medicamentos?tab=estoque", color: "text-amber-500 bg-amber-500/10" },
      ],
    },
    medications: {
      message: t('clara.medsMessage'),
      actions: [
        { id: "view-calendar", label: t('clara.viewCalendar'), icon: Calendar, route: "/agenda", color: "text-blue-500 bg-blue-500/10" },
        { id: "view-progress", label: t('clara.viewProgress'), icon: TrendingUp, route: "/meu-progresso", color: "text-green-500 bg-green-500/10" },
      ],
    },
    stock: {
      message: t('clara.stockMessage'),
      actions: [
        { id: "view-rotina", label: t('clara.viewRoutine'), icon: Pill, route: "/medicamentos?tab=rotina", color: "text-primary bg-primary/10" },
        { id: "add-med", label: t('clara.addItem'), icon: Plus, route: "/adicionar-medicamento", color: "text-green-500 bg-green-500/10" },
      ],
    },
    cofre: {
      message: t('clara.cofreMessage'),
      actions: [
        { id: "upload-doc", label: t('clara.uploadDoc'), icon: Upload, route: "/carteira/upload", color: "text-primary bg-primary/10" },
        { id: "manual-doc", label: t('clara.manualDoc'), icon: Plus, route: "/carteira/criar-manual", color: "text-green-500 bg-green-500/10" },
      ],
    },
    progress: {
      message: t('clara.progressMessage'),
      actions: [
        { id: "view-calendar", label: t('clara.viewCalendar'), icon: Calendar, route: "/agenda", color: "text-primary bg-primary/10" },
        { id: "view-analytics", label: t('clara.analytics'), icon: TrendingUp, route: "/dashboard-saude", color: "text-blue-500 bg-blue-500/10" },
      ],
    },
    calendar: {
      message: t('clara.calendarMessage'),
      actions: [
        { id: "add-appointment", label: t('clara.newAppointment'), icon: Plus, route: "/carteira/criar-manual", color: "text-primary bg-primary/10" },
        { id: "view-today", label: t('clara.viewToday'), icon: Calendar, route: "/hoje", color: "text-amber-500 bg-amber-500/10" },
      ],
    },
    health: {
      message: t('clara.healthMessage'),
      actions: [
        { id: "view-insights", label: t('clara.viewInsights'), icon: Sparkles, route: "/dashboard-saude", color: "text-primary bg-primary/10" },
        { id: "add-weight", label: t('clara.logWeight'), icon: TrendingUp, route: "/peso/historico", color: "text-green-500 bg-green-500/10" },
      ],
    },
    default: {
      message: t('clara.defaultMessage'),
      actions: [
        { id: "go-today", label: t('clara.viewToday'), icon: Calendar, route: "/hoje", color: "text-primary bg-primary/10" },
        { id: "add-med", label: t('clara.add'), icon: Plus, route: "/adicionar-medicamento", color: "text-green-500 bg-green-500/10" },
      ],
    },
  };

  const config = contextConfig[context] || contextConfig.default;

  const handleAction = (action: QuickAction) => {
    if (action.route) {
      navigate(action.route);
    } else if (action.action) {
      action.action();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("mb-4", className)}
    >
      {/* Clara Header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Heart className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">Clara</span>
      </div>

      {/* Message Card */}
      <Card 
        className="p-3 bg-primary/5 border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={onOpenClara}
      >
        <div className="flex items-center gap-3">
          <p className="flex-1 text-sm">{config.message}</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
        <AnimatePresence>
          {config.actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(action)}
                  className="shrink-0 gap-2 rounded-full border-border/50 hover:border-primary/30"
                >
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center -ml-1", action.color)}>
                    <Icon className="w-3 h-3" />
                  </div>
                  {action.label}
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
