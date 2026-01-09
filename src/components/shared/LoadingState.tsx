import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  variant?: "default" | "inline" | "overlay" | "skeleton";
  className?: string;
  skeletonRows?: number;
}

export default function LoadingState({
  message,
  variant = "default",
  className,
  skeletonRows = 3
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="h-20 rounded-2xl bg-muted/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        {message && <span className="text-sm">{message}</span>}
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          "bg-background/80 backdrop-blur-sm",
          className
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-2xl bg-primary/10">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      </motion.div>
    );
  }

  // Default centered loader
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex flex-col items-center justify-center py-16",
        className
      )}
    >
      <div className="p-4 rounded-2xl bg-muted/50 mb-3">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </motion.div>
  );
}
