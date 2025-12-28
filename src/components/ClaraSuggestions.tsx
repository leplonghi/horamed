import { Heart, AlertTriangle, Package, Clock, Sparkles, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ClaraSuggestion {
  id: string;
  type: 'overdue' | 'low_stock' | 'streak' | 'tip' | 'reminder';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ClaraSuggestionsProps {
  overdueDoses: number;
  lowStockItems: string[];
  currentStreak: number;
  onTakeOverdue?: () => void;
  onCheckStock?: () => void;
  onOpenClara?: () => void;
}

export default function ClaraSuggestions({
  overdueDoses,
  lowStockItems,
  currentStreak,
  onTakeOverdue,
  onCheckStock,
  onOpenClara,
}: ClaraSuggestionsProps) {
  const { t, language } = useLanguage();
  const suggestions: ClaraSuggestion[] = [];

  // Doses atrasadas - prioritário
  if (overdueDoses > 0) {
    const plural = overdueDoses > 1 ? 's' : '';
    suggestions.push({
      id: 'overdue',
      type: 'overdue',
      title: t('claraSuggests.attention'),
      message: t('claraSuggests.overdue', { count: String(overdueDoses), plural }),
      action: onTakeOverdue ? { label: t('claraSuggests.viewDoses'), onClick: onTakeOverdue } : undefined,
    });
  }

  // Estoque baixo
  if (lowStockItems.length > 0) {
    const itemNames = lowStockItems.slice(0, 2).join(', ');
    const more = lowStockItems.length > 2 ? ` ${t('claraSuggests.andMore', { count: String(lowStockItems.length - 2) })}` : '';
    suggestions.push({
      id: 'low_stock',
      type: 'low_stock',
      title: t('claraSuggests.lowStock'),
      message: t('claraSuggests.lowStockMsg', { items: itemNames + more }),
      action: onCheckStock ? { label: t('claraSuggests.viewStock'), onClick: onCheckStock } : undefined,
    });
  }

  // Streak motivacional
  if (currentStreak >= 7 && currentStreak % 7 === 0) {
    suggestions.push({
      id: 'streak',
      type: 'streak',
      title: t('claraSuggests.congrats'),
      message: t('claraSuggests.streakMsg', { count: String(currentStreak) }),
    });
  }

  // Dica geral se não houver sugestões
  if (suggestions.length === 0) {
    const tips = [
      t('claraSuggests.tips.water'),
      t('claraSuggests.tips.schedule'),
      t('claraSuggests.tips.help'),
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    suggestions.push({
      id: 'tip',
      type: 'tip',
      title: t('claraSuggests.tip'),
      message: randomTip,
    });
  }

  // Limitar a 2 sugestões
  const visibleSuggestions = suggestions.slice(0, 2);

  const getIcon = (type: ClaraSuggestion['type']) => {
    switch (type) {
      case 'overdue': return AlertTriangle;
      case 'low_stock': return Package;
      case 'streak': return Sparkles;
      case 'reminder': return Clock;
      default: return Heart;
    }
  };

  const getColors = (type: ClaraSuggestion['type']) => {
    switch (type) {
      case 'overdue': return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'low_stock': return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
      case 'streak': return 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400';
      default: return 'bg-primary/10 border-primary/20 text-primary';
    }
  };

  if (visibleSuggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 px-1">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Heart className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{t('claraSuggests.suggests')}</span>
      </div>

      <AnimatePresence mode="popLayout">
        {visibleSuggestions.map((suggestion, index) => {
          const Icon = getIcon(suggestion.type);
          const colors = getColors(suggestion.type);

          return (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={cn(
                  "p-3 border cursor-pointer transition-all hover:shadow-md",
                  colors
                )}
                onClick={() => {
                  if (suggestion.action) {
                    suggestion.action.onClick();
                  } else if (onOpenClara) {
                    onOpenClara();
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-1.5 rounded-lg", colors.split(' ')[0])}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{suggestion.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {suggestion.message}
                    </p>
                  </div>
                  {suggestion.action && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="shrink-0 h-8 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        suggestion.action?.onClick();
                      }}
                    >
                      {suggestion.action.label}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
