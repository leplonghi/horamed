import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: {
    title: "text-sm font-medium",
    subtitle: "text-xs",
    gap: "gap-2"
  },
  md: {
    title: "text-base font-semibold",
    subtitle: "text-sm",
    gap: "gap-2"
  },
  lg: {
    title: "text-lg font-bold",
    subtitle: "text-sm",
    gap: "gap-3"
  }
};

/**
 * Consistent section header for content sections.
 */
export default function SectionHeader({
  title,
  subtitle,
  icon,
  action,
  className,
  size = "md"
}: SectionHeaderProps) {
  const styles = sizeStyles[size];

  return (
    <div className={cn("flex items-center justify-between", styles.gap, className)}>
      <div className={cn("flex items-center", styles.gap)}>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
        <div>
          <h2 className={cn(styles.title, "text-foreground")}>
            {title}
          </h2>
          {subtitle && (
            <p className={cn(styles.subtitle, "text-muted-foreground")}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
