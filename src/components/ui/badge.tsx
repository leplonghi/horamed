import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:brightness-110",
        secondary: "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:brightness-110",
        outline: "border-border/60 bg-transparent text-foreground hover:bg-muted/50",
        success: "border-transparent bg-success text-success-foreground shadow-sm hover:brightness-110",
        warning: "border-transparent bg-warning text-warning-foreground shadow-sm hover:brightness-110",
        glass: "border-border/30 bg-card/60 backdrop-blur-sm text-foreground hover:bg-card/80",
        soft: "border-transparent bg-primary/10 text-primary hover:bg-primary/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
