import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
interface HelpTooltipProps {
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  iconSize?: "sm" | "default" | "lg";
}

export default function HelpTooltip({ 
  content, 
  side = "top", 
  className,
  iconSize = "default" 
}: HelpTooltipProps) {
  const { t } = useLanguage();
  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5"
  };
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center text-muted-foreground/70 hover:text-primary transition-colors rounded-full hover:bg-primary/10 p-0.5",
              className
            )}
            aria-label={t('common.help')}
          >
            <HelpCircle className={cn(iconSizes[iconSize])} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-xs bg-popover border shadow-lg z-50"
          sideOffset={5}
        >
          <p className="text-sm leading-relaxed">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
