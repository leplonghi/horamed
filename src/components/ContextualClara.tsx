import { useState, useEffect } from "react";
import { Heart, Plus, Upload, Pill, Calendar, TrendingUp, Package, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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

const contextConfig: Record<PageContext, { message: string; actions: QuickAction[] }> = {
  today: {
    message: "Como posso ajudar com suas doses de hoje?",
    actions: [
      { id: "add-dose", label: "Nova dose", icon: Plus, route: "/adicionar-medicamento", color: "text-primary bg-primary/10" },
      { id: "view-stock", label: "Ver estoque", icon: Package, route: "/estoque", color: "text-amber-500 bg-amber-500/10" },
    ],
  },
  medications: {
    message: "Gerenciando seus medicamentos. Precisa de algo?",
    actions: [
      { id: "add-med", label: "Adicionar", icon: Plus, route: "/adicionar-medicamento", color: "text-primary bg-primary/10" },
      { id: "scan-prescription", label: "Escanear receita", icon: Upload, route: "/cofre/upload", color: "text-blue-500 bg-blue-500/10" },
    ],
  },
  stock: {
    message: "Vejo seu estoque aqui. Posso ajudar a repor algo?",
    actions: [
      { id: "add-stock", label: "Repor estoque", icon: Plus, route: "/estoque", color: "text-primary bg-primary/10" },
      { id: "view-meds", label: "Ver medicamentos", icon: Pill, route: "/medicamentos", color: "text-purple-500 bg-purple-500/10" },
    ],
  },
  cofre: {
    message: "Seu cofre de documentos. O que deseja guardar?",
    actions: [
      { id: "upload-doc", label: "Enviar documento", icon: Upload, route: "/cofre/upload", color: "text-primary bg-primary/10" },
      { id: "scan-exam", label: "Escanear exame", icon: Plus, route: "/cofre/manual", color: "text-green-500 bg-green-500/10" },
    ],
  },
  progress: {
    message: "Acompanhando seu progresso. Quer ver mais detalhes?",
    actions: [
      { id: "view-calendar", label: "Ver calendário", icon: Calendar, route: "/agenda", color: "text-primary bg-primary/10" },
      { id: "view-analytics", label: "Análises", icon: TrendingUp, route: "/saude-dashboard", color: "text-blue-500 bg-blue-500/10" },
    ],
  },
  calendar: {
    message: "Sua agenda de saúde. Posso ajudar a planejar?",
    actions: [
      { id: "add-appointment", label: "Nova consulta", icon: Plus, route: "/cofre/manual", color: "text-primary bg-primary/10" },
      { id: "view-today", label: "Ver hoje", icon: Calendar, route: "/hoje", color: "text-amber-500 bg-amber-500/10" },
    ],
  },
  health: {
    message: "Análise de saúde disponível. O que quer explorar?",
    actions: [
      { id: "view-insights", label: "Ver insights", icon: Sparkles, route: "/saude-dashboard", color: "text-primary bg-primary/10" },
      { id: "add-weight", label: "Registrar peso", icon: TrendingUp, route: "/peso", color: "text-green-500 bg-green-500/10" },
    ],
  },
  default: {
    message: "Olá! Em que posso ajudar?",
    actions: [
      { id: "go-today", label: "Ver hoje", icon: Calendar, route: "/hoje", color: "text-primary bg-primary/10" },
      { id: "add-med", label: "Adicionar", icon: Plus, route: "/adicionar-medicamento", color: "text-green-500 bg-green-500/10" },
    ],
  },
};

export default function ContextualClara({ context, className, onOpenClara }: ContextualClaraProps) {
  const navigate = useNavigate();
  const config = contextConfig[context] || contextConfig.default;
  const [isVisible, setIsVisible] = useState(true);

  const handleAction = (action: QuickAction) => {
    if (action.route) {
      navigate(action.route);
    } else if (action.action) {
      action.action();
    }
  };

  if (!isVisible) return null;

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
