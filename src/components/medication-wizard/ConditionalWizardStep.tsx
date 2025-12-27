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
          "relative rounded-xl border-2 transition-all duration-300",
          isActive && "border-primary bg-card shadow-md shadow-primary/5",
          isComplete && !isActive && "border-primary/40 bg-primary/5",
          !isActive && !isComplete && "border-border/50 bg-muted/20"
        )}
      >
        {/* Header - Always Visible */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-2.5 p-3 text-left transition-all",
            isActive && "pb-1.5"
          )}
        >
          {/* Step Number/Check Circle */}
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs transition-all",
              isComplete && "bg-primary text-primary-foreground",
              isActive && !isComplete && "bg-primary text-primary-foreground ring-2 ring-primary/20",
              !isActive && !isComplete && "bg-muted text-muted-foreground"
            )}
          >
            {isComplete ? (
              <Check className="h-4 w-4" strokeWidth={3} />
            ) : (
              stepNumber
            )}
          </div>

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{icon}</span>
              <h3
                className={cn(
                  "font-semibold text-sm",
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
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/70 hover:text-primary transition-colors" />
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
              <p className="text-xs text-primary font-medium truncate">
                ✓ {summary}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                {description}
              </p>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          <div className={cn(
            "p-1 rounded-full transition-colors",
            isActive ? "bg-primary/10" : "bg-muted/50"
          )}>
            {isActive ? (
              <ChevronUp className="h-3.5 w-3.5 text-primary" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
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
              <div className="px-3 pb-3 pt-1">
                <div className="ml-[42px] space-y-3">
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
