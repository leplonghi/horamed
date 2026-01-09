import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  variant?: "default" | "subtle" | "card";
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className
}: EmptyStateProps) {
  const variantStyles = {
    default: "py-16",
    subtle: "py-8",
    card: "py-12 rounded-2xl bg-muted/30 border border-dashed border-border"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center px-6",
        variantStyles[variant],
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="p-5 rounded-3xl bg-muted/50 mb-4"
      >
        {icon}
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-lg font-semibold text-foreground mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-muted-foreground max-w-xs mb-6"
      >
        {description}
      </motion.p>
      
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            onClick={action.onClick}
            className="gap-2 rounded-2xl shadow-lg hover-lift"
          >
            {action.icon || <Plus className="h-4 w-4" />}
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
