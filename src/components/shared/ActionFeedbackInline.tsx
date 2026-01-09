import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { ReactNode } from "react";

interface ActionFeedbackInlineProps {
  show: boolean;
  type: "success" | "error" | "warning" | "info";
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  icon?: ReactNode;
  className?: string;
}

const typeConfig = {
  success: {
    bg: "bg-success/10 border-success/30",
    icon: <CheckCircle2 className="h-4 w-4 text-success" />,
    textColor: "text-success"
  },
  error: {
    bg: "bg-destructive/10 border-destructive/30",
    icon: <AlertCircle className="h-4 w-4 text-destructive" />,
    textColor: "text-destructive"
  },
  warning: {
    bg: "bg-warning/10 border-warning/30",
    icon: <AlertTriangle className="h-4 w-4 text-warning" />,
    textColor: "text-warning"
  },
  info: {
    bg: "bg-primary/10 border-primary/30",
    icon: <Info className="h-4 w-4 text-primary" />,
    textColor: "text-primary"
  }
};

/**
 * Inline feedback component for contextual messages.
 * Use for form validation, action confirmation, etc.
 */
export default function ActionFeedbackInline({
  show,
  type,
  message,
  action,
  onDismiss,
  icon,
  className
}: ActionFeedbackInlineProps) {
  const config = typeConfig[type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn(
            "rounded-xl border p-3 flex items-center gap-3",
            config.bg,
            className
          )}
        >
          <div className="shrink-0">
            {icon || config.icon}
          </div>
          
          <p className={cn("text-sm flex-1", config.textColor)}>
            {message}
          </p>
          
          {action && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 h-7 text-xs"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-6 w-6"
              onClick={onDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
