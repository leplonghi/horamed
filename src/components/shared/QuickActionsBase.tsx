import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface QuickAction {
  id: string;
  icon: ReactNode;
  label: string;
  color: string; // Tailwind bg class like "bg-primary/10"
  textColor?: string; // Tailwind text class like "text-primary"
  onClick: () => void;
  badge?: string | number;
}

interface QuickActionsBaseProps {
  actions: QuickAction[];
  title?: string;
  className?: string;
  columns?: 2 | 3 | 4;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function QuickActionsBase({
  actions,
  title,
  className,
  columns = 4
}: QuickActionsBaseProps) {
  if (actions.length === 0) return null;

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4"
  };

  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      )}
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={cn("grid gap-2", gridCols[columns])}
      >
        {actions.map((action) => (
          <motion.button
            key={action.id}
            variants={itemVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={action.onClick}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-2xl",
              "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm",
              "border border-border/30 hover:border-border/50",
              "shadow-[var(--shadow-glass)] hover:shadow-[var(--shadow-glass-hover)]",
              "transition-all duration-200 group"
            )}
          >
            {action.badge && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                {action.badge}
              </span>
            )}
            
            <div className={cn(
              "p-3 rounded-xl transition-transform group-hover:scale-110",
              action.color
            )}>
              {action.icon}
            </div>
            
            <span className={cn(
              "text-xs font-medium text-center leading-tight",
              action.textColor || "text-foreground"
            )}>
              {action.label}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
