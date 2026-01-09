import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium",
    "transition-all duration-300 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "shadow-[var(--shadow-sm)]",
          "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:brightness-110",
          "active:translate-y-0 active:shadow-[var(--shadow-xs)] active:scale-[0.98]",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "shadow-[var(--shadow-sm)]",
          "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:brightness-110",
          "active:translate-y-0 active:scale-[0.98]",
        ].join(" "),
        outline: [
          "border border-border/60 bg-transparent",
          "hover:bg-muted/50 hover:border-primary/40",
          "active:scale-[0.98]",
        ].join(" "),
        secondary: [
          "bg-muted text-muted-foreground",
          "hover:bg-muted/80 hover:text-foreground",
          "active:scale-[0.98]",
        ].join(" "),
        ghost: [
          "hover:bg-muted/50",
          "active:scale-[0.98]",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline",
        success: [
          "bg-success text-success-foreground",
          "shadow-[var(--shadow-sm)]",
          "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:brightness-110",
          "active:translate-y-0 active:scale-[0.98]",
        ].join(" "),
        soft: [
          "bg-primary/10 text-primary",
          "hover:bg-primary/15",
          "active:scale-[0.98]",
        ].join(" "),
        glass: [
          "bg-gradient-to-br from-card/80 to-card/60 text-foreground",
          "backdrop-blur-xl border border-border/30",
          "shadow-[var(--shadow-glass)]",
          "hover:shadow-[var(--shadow-glass-hover)] hover:-translate-y-0.5",
          "active:translate-y-0 active:scale-[0.98]",
        ].join(" "),
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base font-medium",
        xl: "h-14 rounded-2xl px-10 text-lg font-medium",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };