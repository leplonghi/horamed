import { ReactNode, useState } from "react";
import { Check, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConditionalWizardStepProps {
  stepNumber: number;
  title: string;
  description: string;
  helpText?: string;
  icon: ReactNode;
  isComplete: boolean;
  isVisible: boolean;
  isActive: boolean;
  summary?: string;
  children: ReactNode;
  onToggle: () => void;
}

export function ConditionalWizardStep({
  stepNumber,
  title,
  description,
  helpText,
  icon,
  isComplete,
  isVisible,
  isActive,
  summary,
  children,
  onToggle,
}: ConditionalWizardStepProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div
        className={cn(
          "relative rounded-2xl border-2 transition-all duration-300",
          isActive && "border-primary bg-card shadow-lg shadow-primary/5",
          isComplete && !isActive && "border-primary/40 bg-primary/5",
          !isActive && !isComplete && "border-border/50 bg-muted/20"
        )}
      >
        {/* Header - Always Visible */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-3 p-4 text-left transition-all",
            isActive && "pb-2"
          )}
        >
          {/* Step Number/Check Circle */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm transition-all",
              isComplete && "bg-primary text-primary-foreground",
              isActive && !isComplete && "bg-primary text-primary-foreground ring-4 ring-primary/20",
              !isActive && !isComplete && "bg-muted text-muted-foreground"
            )}
          >
            {isComplete ? (
              <Check className="h-5 w-5" strokeWidth={3} />
            ) : (
              stepNumber
            )}
          </div>

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <h3
                className={cn(
                  "font-semibold text-base",
                  isActive && "text-primary",
                  isComplete && !isActive && "text-foreground"
                )}
              >
                {title}
              </h3>
              {helpText && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground/70 hover:text-primary transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[280px]">
                      <p className="text-xs">{helpText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Summary when collapsed and complete, or description when active/incomplete */}
            {isComplete && !isActive && summary ? (
              <p className="text-sm text-primary font-medium mt-0.5 truncate">
                ✓ {summary}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          <div className={cn(
            "p-1.5 rounded-full transition-colors",
            isActive ? "bg-primary/10" : "bg-muted/50"
          )}>
            {isActive ? (
              <ChevronUp className="h-4 w-4 text-primary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Content - Animated Expand/Collapse */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-2">
                <div className="ml-[52px] space-y-4">
                  {children}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
