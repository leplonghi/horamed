import { Pill, Leaf, FlaskConical, Package, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import StepTooltip from "./StepTooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

type Category = "medicamento" | "vitamina" | "suplemento" | "outro";

interface StepCategoryProps {
  category: Category;
  onCategoryChange: (category: Category) => void;
  onComplete: () => void;
}

export default function StepCategory({ category, onCategoryChange, onComplete }: StepCategoryProps) {
  const { t } = useLanguage();
  
  const categories = [
    {
      value: "medicamento" as Category,
      label: t('category.medication'),
      description: t('category.medicationDesc'),
      tooltip: t('category.medicationTooltip'),
      icon: Pill,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      borderActive: "border-blue-500 bg-blue-50 dark:bg-blue-900/40 ring-2 ring-blue-500/20"
    },
    {
      value: "vitamina" as Category,
      label: t('category.vitamin'),
      description: t('category.vitaminDesc'),
      tooltip: t('category.vitaminTooltip'),
      icon: FlaskConical,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900/30",
      borderActive: "border-orange-500 bg-orange-50 dark:bg-orange-900/40 ring-2 ring-orange-500/20"
    },
    {
      value: "suplemento" as Category,
      label: t('category.supplement'),
      description: t('category.supplementDesc'),
      tooltip: t('category.supplementTooltip'),
      icon: Leaf,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
      borderActive: "border-green-500 bg-green-50 dark:bg-green-900/40 ring-2 ring-green-500/20"
    },
    {
      value: "outro" as Category,
      label: t('category.other'),
      description: t('category.otherDesc'),
      tooltip: t('category.otherTooltip'),
      icon: Package,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      borderActive: "border-purple-500 bg-purple-50 dark:bg-purple-900/40 ring-2 ring-purple-500/20"
    },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <StepTooltip type="info">
          {t('category.info')}
        </StepTooltip>

        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.value;
            
            return (
              <Tooltip key={cat.value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onCategoryChange(cat.value)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                      isSelected 
                        ? cat.borderActive + " shadow-md" 
                        : "border-border hover:border-primary/30 bg-card hover:bg-muted/50"
                    )}
                  >
                    <HelpCircle className="absolute top-2 right-2 h-3.5 w-3.5 text-muted-foreground opacity-50" />
                    <div className={cn("p-3 rounded-full", cat.bg)}>
                      <Icon className={cn("h-6 w-6", cat.color)} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{cat.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                        {cat.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-xs">✓</span>
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="text-xs">{cat.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <Button 
          onClick={onComplete}
          className="w-full h-12 text-base font-semibold"
        >
          {t('category.continue')}
        </Button>
      </div>
    </TooltipProvider>
  );
}
