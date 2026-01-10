import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-2xl text-card-foreground transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: [
          "relative border-0",
          "bg-gradient-to-br from-card/80 to-card/60",
          "backdrop-blur-xl",
          "shadow-[var(--shadow-glass)]",
          "[box-shadow:var(--shadow-glass),var(--shadow-inner-glow)]",
          "hover:shadow-[var(--shadow-glass-hover)]",
        ].join(" "),
        solid: [
          "bg-card border-0",
          "shadow-[var(--shadow-sm)]",
          "hover:shadow-[var(--shadow-md)]",
        ].join(" "),
        elevated: [
          "bg-card border-0",
          "shadow-[var(--shadow-md)]",
          "hover:shadow-[var(--shadow-lg)] hover:-translate-y-1",
        ].join(" "),
        interactive: [
          "relative border-0 cursor-pointer",
          "bg-gradient-to-br from-card/85 to-card/70",
          "backdrop-blur-xl",
          "shadow-[var(--shadow-glass)]",
          "[box-shadow:var(--shadow-glass),var(--shadow-inner-glow)]",
          "hover:-translate-y-1.5 hover:shadow-[var(--shadow-glass-hover)]",
          "active:scale-[0.98] active:translate-y-0",
          "group",
        ].join(" "),
        ghost: "bg-transparent border-0 shadow-none hover:bg-muted/30",
        outline: [
          "bg-transparent border border-border/50 shadow-none",
          "hover:border-primary/50 hover:bg-primary/5",
          "transition-colors",
        ].join(" "),
        glow: [
          "relative border-0",
          "bg-gradient-to-br from-card/90 to-card/70",
          "backdrop-blur-xl",
          "shadow-[var(--shadow-glass)]",
          "hover:shadow-[var(--shadow-glow),var(--shadow-glass-hover)]",
          "hover:-translate-y-1",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1 p-5 pb-3", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-medium leading-tight tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-5 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
