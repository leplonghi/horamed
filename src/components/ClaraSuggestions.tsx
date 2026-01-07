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

  // Clara empática - mensagens curtas e contextuais, apenas quando ajuda
  if (suggestions.length === 0) {
    const hour = new Date().getHours();
    let contextualMessage = '';
    
    // Mensagens empáticas baseadas no contexto
    if (currentStreak > 0 && currentStreak < 7) {
      contextualMessage = language === 'pt' 
        ? 'Tudo certo hoje. Boa!' 
        : 'All good today. Nice!';
    } else if (hour < 10) {
      contextualMessage = language === 'pt'
        ? 'Bom dia! Pronto para mais um dia?'
        : 'Good morning! Ready for another day?';
    } else if (hour > 20) {
      contextualMessage = language === 'pt'
        ? 'Quase lá! Descanse bem.'
        : 'Almost there! Rest well.';
    } else {
      // Não mostrar nada se não houver contexto útil
      return;
    }
    
    suggestions.push({
      id: 'contextual',
      type: 'tip',
      title: language === 'pt' ? 'Clara' : 'Clara',
      message: contextualMessage,
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
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1.5"
    >
      <div className="flex items-center gap-1.5 px-1">
        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
          <Heart className="w-3 h-3 text-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{t('claraSuggests.suggests')}</span>
      </div>

      <AnimatePresence mode="popLayout">
        {visibleSuggestions.map((suggestion, index) => {
          const Icon = getIcon(suggestion.type);
          const colors = getColors(suggestion.type);

          return (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className={cn(
                  "px-3 py-2 border cursor-pointer transition-all hover:shadow-sm",
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
                <div className="flex items-center gap-2">
                  <div className={cn("p-1 rounded-md", colors.split(' ')[0])}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs leading-tight">{suggestion.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight mt-0.5">
                      {suggestion.message}
                    </p>
                  </div>
                  {suggestion.action && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="shrink-0 h-6 px-1.5 text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        suggestion.action?.onClick();
                      }}
                    >
                      <ChevronRight className="w-3 h-3" />
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
