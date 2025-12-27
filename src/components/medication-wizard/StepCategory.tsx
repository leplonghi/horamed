import { Pill, Leaf, FlaskConical, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import StepTooltip from "./StepTooltip";

type Category = "medicamento" | "vitamina" | "suplemento" | "outro";

interface StepCategoryProps {
  category: Category;
  onCategoryChange: (category: Category) => void;
  onComplete: () => void;
}

const categories = [
  {
    value: "medicamento" as Category,
    label: "Medicamento",
    description: "Remédios prescritos ou de farmácia",
    icon: Pill,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    borderActive: "border-blue-500 bg-blue-50 dark:bg-blue-900/40"
  },
  {
    value: "vitamina" as Category,
    label: "Vitamina",
    description: "Vitaminas e complexos vitamínicos",
    icon: FlaskConical,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    borderActive: "border-orange-500 bg-orange-50 dark:bg-orange-900/40"
  },
  {
    value: "suplemento" as Category,
    label: "Suplemento",
    description: "Suplementos alimentares e naturais",
    icon: Leaf,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    borderActive: "border-green-500 bg-green-50 dark:bg-green-900/40"
  },
  {
    value: "outro" as Category,
    label: "Outro",
    description: "Outros itens de saúde",
    icon: Package,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    borderActive: "border-purple-500 bg-purple-50 dark:bg-purple-900/40"
  },
];

export default function StepCategory({ category, onCategoryChange, onComplete }: StepCategoryProps) {
  return (
    <div className="space-y-4">
      <StepTooltip type="info">
        Escolha o tipo do item. Isso nos ajuda a organizar e mostrar informações relevantes.
      </StepTooltip>

      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = category === cat.value;
          
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onCategoryChange(cat.value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                isSelected 
                  ? cat.borderActive + " border-2 shadow-sm" 
                  : "border-border hover:border-primary/30 bg-card"
              )}
            >
              <div className={cn("p-2.5 rounded-full", cat.bg)}>
                <Icon className={cn("h-5 w-5", cat.color)} />
              </div>
              <div>
                <p className="font-medium text-sm">{cat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                  {cat.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Button 
        onClick={onComplete}
        className="w-full h-11"
      >
        Continuar
      </Button>
    </div>
  );
}
