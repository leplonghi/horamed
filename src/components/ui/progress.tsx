import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-3 w-full overflow-hidden rounded-full",
      "bg-gradient-to-r from-secondary/80 to-secondary/60 backdrop-blur-sm",
      "shadow-inner",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all duration-300 ease-out rounded-full",
        "shadow-sm",
        value && value <= 10 ? "bg-gradient-to-r from-destructive to-destructive/80" :
        value && value <= 20 ? "bg-gradient-to-r from-warning to-warning/80" :
        value && value <= 50 ? "bg-gradient-to-r from-primary to-primary/80" :
        "bg-gradient-to-r from-success to-success/80"
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
