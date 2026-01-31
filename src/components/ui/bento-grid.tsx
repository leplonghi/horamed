import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  /** 1 = 1x1, 2 = 2x1 (wide), 3 = 1x2 (tall), 4 = 2x2 (large) */
  size?: 1 | 2 | 3 | 4;
  /** Visual variant */
  variant?: "default" | "gradient" | "glass" | "outline" | "highlight";
  /** Click handler */
  onClick?: () => void;
  /** Animation delay for staggered entrance */
  delay?: number;
}

const sizeClasses = {
  1: "col-span-1 row-span-1",
  2: "col-span-2 row-span-1",
  3: "col-span-1 row-span-2",
  4: "col-span-2 row-span-2",
};

const variantClasses = {
  default: "bg-card border border-border/50",
  gradient: "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20",
  glass: "bg-card/60 backdrop-blur-xl border border-white/10",
  outline: "bg-transparent border-2 border-dashed border-border/60",
  highlight: "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 shadow-lg shadow-primary/10",
};

export function BentoCard({
  children,
  className,
  size = 1,
  variant = "default",
  onClick,
  delay = 0,
}: BentoCardProps) {
  const isClickable = !!onClick;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: delay * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={isClickable ? { scale: 1.02, y: -2 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "rounded-3xl p-4 md:p-5 transition-all duration-300",
        sizeClasses[size],
        variantClasses[variant],
        isClickable && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface BentoHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function BentoHeader({
  icon,
  title,
  subtitle,
  action,
  className,
}: BentoHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-3", className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className="shrink-0 p-2 rounded-xl bg-primary/10">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

interface BentoValueProps {
  value: string | number;
  label: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function BentoValue({
  value,
  label,
  trend,
  trendValue,
  className,
}: BentoValueProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-end gap-2">
        <span className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {value}
        </span>
        {trend && trendValue && (
          <span
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded-full mb-1",
              trend === "up" && "bg-success/10 text-success",
              trend === "down" && "bg-destructive/10 text-destructive",
              trend === "neutral" && "bg-muted text-muted-foreground"
            )}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

interface BentoProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: "default" | "gradient" | "success" | "warning";
  className?: string;
}

export function BentoProgress({
  value,
  max = 100,
  showLabel = true,
  variant = "default",
  className,
}: BentoProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const barVariants = {
    default: "bg-primary",
    gradient: "bg-gradient-to-r from-primary to-primary/60",
    success: "bg-success",
    warning: "bg-warning",
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={cn("h-full rounded-full", barVariants[variant])}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{value} / {max}</span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}
