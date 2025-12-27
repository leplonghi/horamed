import { ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface WizardStep {
  id: string;
  number: number;
  title: string;
  description: string;
  icon?: ReactNode;
  isComplete: boolean;
  isActive: boolean;
  isLocked: boolean;
  content: ReactNode;
  summary?: string;
}

interface ProgressiveWizardProps {
  steps: WizardStep[];
  onStepClick?: (stepId: string) => void;
}

export default function ProgressiveWizard({ steps, onStepClick }: ProgressiveWizardProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <StepCard 
            step={step} 
            isLast={index === steps.length - 1}
            onClick={() => onStepClick?.(step.id)}
          />
        </motion.div>
      ))}
    </div>
  );
}

interface StepCardProps {
  step: WizardStep;
  isLast: boolean;
  onClick: () => void;
}

function StepCard({ step, isLast, onClick }: StepCardProps) {
  const canInteract = !step.isLocked;

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 transition-all duration-300",
        step.isActive && "border-primary bg-card shadow-lg shadow-primary/10",
        step.isComplete && !step.isActive && "border-primary/30 bg-primary/5",
        step.isLocked && "border-muted bg-muted/30 opacity-60",
        !step.isActive && !step.isLocked && !step.isComplete && "border-border bg-card hover:border-primary/50",
        canInteract && !step.isActive && "cursor-pointer"
      )}
      onClick={canInteract && !step.isActive ? onClick : undefined}
    >
      {/* Step Header */}
      <div 
        className={cn(
          "flex items-center gap-4 p-4",
          step.isActive && "pb-2"
        )}
      >
        {/* Step Number/Check */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm transition-all",
            step.isComplete && "bg-primary text-primary-foreground",
            step.isActive && !step.isComplete && "bg-primary text-primary-foreground ring-4 ring-primary/20",
            step.isLocked && "bg-muted text-muted-foreground",
            !step.isActive && !step.isComplete && !step.isLocked && "bg-muted text-muted-foreground"
          )}
        >
          {step.isComplete ? (
            <Check className="h-5 w-5" />
          ) : (
            step.number
          )}
        </div>

        {/* Step Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {step.icon && (
              <span className="text-lg">{step.icon}</span>
            )}
            <h3 
              className={cn(
                "font-semibold text-base",
                step.isActive && "text-primary",
                step.isLocked && "text-muted-foreground"
              )}
            >
              {step.title}
            </h3>
          </div>
          
          {/* Show summary when complete and not active */}
          {step.isComplete && !step.isActive && step.summary ? (
            <p className="text-sm text-primary font-medium mt-0.5 truncate">
              {step.summary}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">
              {step.description}
            </p>
          )}
        </div>

        {/* Expand/Edit indicator */}
        {step.isComplete && !step.isActive && (
          <button 
            className="text-xs text-primary font-medium hover:underline px-2 py-1"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Editar
          </button>
        )}

        {step.isActive && (
          <ChevronDown className="h-5 w-5 text-primary" />
        )}
      </div>

      {/* Step Content */}
      <AnimatePresence>
        {step.isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2">
              <div className="pl-14">
                {step.content}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection line to next step */}
      {!isLast && step.isComplete && (
        <div className="absolute left-[1.4rem] top-full h-3 w-0.5 bg-primary/30" />
      )}
    </div>
  );
}
