import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export interface Insight {
  id: string;
  type: "urgent" | "warning" | "success" | "info";
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
}

interface SmartInsightsBaseProps {
  insights: Insight[];
  title?: string;
  className?: string;
  maxVisible?: number;
}

const typeStyles = {
  urgent: {
    bg: "from-destructive/20 to-destructive/10 border-destructive/40",
    icon: <AlertCircle className="h-5 w-5 text-destructive" />,
    iconBg: "bg-destructive/20"
  },
  warning: {
    bg: "from-warning/20 to-warning/10 border-warning/40",
    icon: <AlertTriangle className="h-5 w-5 text-warning" />,
    iconBg: "bg-warning/20"
  },
  success: {
    bg: "from-success/20 to-success/10 border-success/40",
    icon: <CheckCircle2 className="h-5 w-5 text-success" />,
    iconBg: "bg-success/20"
  },
  info: {
    bg: "from-primary/20 to-primary/10 border-primary/40",
    icon: <Info className="h-5 w-5 text-primary" />,
    iconBg: "bg-primary/20"
  }
};

export default function SmartInsightsBase({
  insights,
  title,
  className,
  maxVisible = 3
}: SmartInsightsBaseProps) {
  if (insights.length === 0) return null;

  const visibleInsights = insights.slice(0, maxVisible);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-3", className)}
    >
      {title && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
      )}
      
      <div className="space-y-2">
        {visibleInsights.map((insight, index) => {
          const style = typeStyles[insight.type];
          
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative rounded-2xl bg-gradient-to-r border p-4 backdrop-blur-sm",
                style.bg
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-xl shrink-0", style.iconBg)}>
                  {insight.icon || style.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{insight.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{insight.description}</p>
                </div>
                
                {insight.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1 hover:bg-background/50"
                    onClick={insight.action.onClick}
                  >
                    {insight.action.label}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                
                {insight.dismissible && insight.onDismiss && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 hover:bg-background/50"
                    onClick={insight.onDismiss}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {insights.length > maxVisible && (
        <p className="text-xs text-center text-muted-foreground">
          +{insights.length - maxVisible} mais
        </p>
      )}
    </motion.div>
  );
}
