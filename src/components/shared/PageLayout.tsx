import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  showBackButton?: boolean;
  backPath?: string;
  headerAction?: ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: "default" | "compact" | "hero";
  bottomPadding?: boolean;
}

export default function PageLayout({
  children,
  title,
  subtitle,
  icon,
  showBackButton = false,
  backPath,
  headerAction,
  className,
  contentClassName,
  variant = "default",
  bottomPadding = true
}: PageLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "min-h-screen bg-background",
        bottomPadding && "pb-24",
        className
      )}
    >
      {/* Header */}
      {(title || showBackButton || headerAction) && (
        <div className={cn(
          "sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30",
          variant === "compact" && "py-3 px-4",
          variant === "default" && "py-4 px-4",
          variant === "hero" && "py-3 px-4"
        )}>
          <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="shrink-0 h-9 w-9 rounded-xl hover:bg-muted/50"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              
              {icon && variant !== "hero" && (
                <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                  {icon}
                </div>
              )}
              
              {title && (
                <div className="min-w-0">
                  <h1 className={cn(
                    "font-semibold text-foreground truncate",
                    variant === "compact" ? "text-lg" : "text-xl"
                  )}>
                    {title}
                  </h1>
                  {subtitle && variant !== "compact" && (
                    <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                  )}
                </div>
              )}
            </div>
            
            {headerAction && (
              <div className="shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "max-w-4xl mx-auto",
        variant === "compact" ? "p-4 space-y-4" : "p-4 space-y-6",
        contentClassName
      )}>
        {children}
      </div>
    </motion.div>
  );
}
