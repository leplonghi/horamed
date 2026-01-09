import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateAnimatedProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  tip?: string;
  className?: string;
  iconColor?: string;
}

export default function EmptyStateAnimated({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  tip,
  className,
  iconColor = "text-primary"
}: EmptyStateAnimatedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6",
        "rounded-3xl text-center",
        "bg-gradient-to-br from-card/80 to-muted/30 backdrop-blur-sm",
        "border border-border/30",
        className
      )}
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.1 
        }}
        className="relative mb-6"
      >
        {/* Pulse ring animation */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={cn(
            "absolute inset-0 rounded-2xl",
            "bg-primary/20"
          )}
        />
        
        <div className={cn(
          "relative w-20 h-20 rounded-2xl flex items-center justify-center",
          "bg-gradient-to-br from-primary/15 to-primary/5",
          "shadow-lg"
        )}>
          <Icon className={cn("w-10 h-10", iconColor)} />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold mb-2"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="text-muted-foreground text-sm max-w-[280px] mb-6"
      >
        {description}
      </motion.p>

      {/* Tip */}
      {tip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          💡 {tip}
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            size="lg"
            className="rounded-2xl gap-2 min-w-[160px]"
          >
            {actionLabel}
          </Button>
        )}

        {secondaryLabel && onSecondaryAction && (
          <Button
            variant="outline"
            onClick={onSecondaryAction}
            size="lg"
            className="rounded-2xl"
          >
            {secondaryLabel}
          </Button>
        )}
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl -z-10" />
    </motion.div>
  );
}
