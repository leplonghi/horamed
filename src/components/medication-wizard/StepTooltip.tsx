import { Info, Lightbulb, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepTooltipProps {
  type?: "info" | "tip" | "warning";
  children: React.ReactNode;
  className?: string;
}

export default function StepTooltip({ 
  type = "info", 
  children, 
  className 
}: StepTooltipProps) {
  const config = {
    info: {
      icon: Info,
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-700 dark:text-blue-300",
      iconColor: "text-blue-500"
    },
    tip: {
      icon: Lightbulb,
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-700 dark:text-amber-300",
      iconColor: "text-amber-500"
    },
    warning: {
      icon: AlertCircle,
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-700 dark:text-red-300",
      iconColor: "text-red-500"
    }
  };

  const { icon: Icon, bg, border, text, iconColor } = config[type];

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        bg, border, text,
        className
      )}
    >
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconColor)} />
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}
