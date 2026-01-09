import { ReactNode, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface InteractiveCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  variant?: "default" | "glass" | "elevated" | "outlined";
  interactive?: boolean;
  selected?: boolean;
}

const variantStyles = {
  default: "bg-card border-border/50",
  glass: "bg-card/70 backdrop-blur-md border-border/30 shadow-[var(--shadow-glass)]",
  elevated: "bg-card border-border/50 shadow-lg",
  outlined: "bg-transparent border-border border-dashed"
};

/**
 * Reusable interactive card with consistent hover/tap animations.
 * Use as base for list items, selectable cards, etc.
 */
const InteractiveCard = forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ 
    children, 
    variant = "default",
    interactive = true,
    selected = false,
    className,
    ...motionProps 
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={interactive ? { scale: 1.01, y: -2 } : undefined}
        whileTap={interactive ? { scale: 0.99 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "rounded-2xl border p-4 transition-colors duration-200",
          variantStyles[variant],
          interactive && "cursor-pointer hover:border-primary/30",
          selected && "border-primary bg-primary/5 ring-1 ring-primary/20",
          className
        )}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);

InteractiveCard.displayName = "InteractiveCard";

export default InteractiveCard;
