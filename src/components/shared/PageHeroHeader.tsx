import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PageHeroHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
  className?: string;
  variant?: "default" | "success" | "warning" | "info";
}

const variantStyles = {
  default: "from-primary/20 via-primary/10 to-background border-primary/20",
  success: "from-success/20 via-success/10 to-background border-success/20",
  warning: "from-warning/20 via-warning/10 to-background border-warning/20",
  info: "from-info/20 via-info/10 to-background border-info/20",
};

const iconBgStyles = {
  default: "bg-primary/20",
  success: "bg-success/20",
  warning: "bg-warning/20",
  info: "bg-info/20",
};

export default function PageHeroHeader({
  icon,
  title,
  subtitle,
  action,
  className,
  variant = "default"
}: PageHeroHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br border p-6",
        variantStyles[variant],
        className
      )}
    >
      {/* Decorative blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-2xl backdrop-blur-sm",
              iconBgStyles[variant]
            )}>
              {icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
        
        {action && (
          <Button 
            size="lg" 
            className="gap-2 rounded-2xl hover-lift hidden sm:flex shadow-lg" 
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
