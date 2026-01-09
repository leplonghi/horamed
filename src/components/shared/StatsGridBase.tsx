import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StatItem {
  id: string;
  label: string;
  value: number | string;
  icon: ReactNode;
  color: string; // Tailwind classes like "bg-primary/10 text-primary"
  onClick?: () => void;
  subtitle?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
}

interface StatsGridBaseProps {
  stats: StatItem[];
  title?: string;
  className?: string;
  columns?: 2 | 3 | 4;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 }
};

export default function StatsGridBase({
  stats,
  title,
  className,
  columns = 4
}: StatsGridBaseProps) {
  if (stats.length === 0) return null;

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4"
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
        className={cn("grid gap-3", gridCols[columns])}
      >
        {stats.map((stat) => {
          const isClickable = !!stat.onClick;
          
          return (
            <motion.div
              key={stat.id}
              variants={itemVariants}
              whileHover={isClickable ? { scale: 1.02 } : undefined}
              whileTap={isClickable ? { scale: 0.98 } : undefined}
              onClick={stat.onClick}
              className={cn(
                "relative rounded-2xl p-4 backdrop-blur-sm",
                "bg-gradient-to-br from-card/90 to-card/70",
                "border border-border/30",
                "shadow-[var(--shadow-glass)]",
                isClickable && "cursor-pointer hover:border-border/50 hover:shadow-[var(--shadow-glass-hover)]",
                "transition-all duration-200"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={cn(
                  "p-2 rounded-xl",
                  stat.color.split(" ")[0] // Get just the bg class
                )}>
                  {stat.icon}
                </div>
                
                {stat.trend && (
                  <span className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded-full",
                    stat.trend.positive 
                      ? "bg-success/10 text-success" 
                      : "bg-destructive/10 text-destructive"
                  )}>
                    {stat.trend.positive ? "+" : ""}{stat.trend.value}%
                  </span>
                )}
              </div>
              
              <p className={cn(
                "text-2xl font-bold",
                stat.color.split(" ")[1] || "text-foreground" // Get text class if exists
              )}>
                {stat.value}
              </p>
              
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {stat.label}
              </p>
              
              {stat.subtitle && (
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  {stat.subtitle}
                </p>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
