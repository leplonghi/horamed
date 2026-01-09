import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, ShoppingCart, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStockProjection, StockProjection } from "@/hooks/useStockProjection";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StockAlertWidget() {
  const navigate = useNavigate();
  const { data: stockData, isLoading } = useStockProjection();
  const { language } = useLanguage();

  // Filter items that are low on stock (7 days or less)
  const criticalItems = (stockData || []).filter(
    (item: StockProjection) => item.days_remaining !== null && item.days_remaining <= 7
  );

  // Don't show if no critical items or loading
  if (isLoading || criticalItems.length === 0) return null;

  const mostUrgent = criticalItems[0];
  const urgencyLevel = mostUrgent.days_remaining! <= 2 ? 'critical' : mostUrgent.days_remaining! <= 5 ? 'warning' : 'info';

  const urgencyConfig = {
    critical: {
      bg: 'bg-gradient-to-br from-red-500/20 to-red-500/5 backdrop-blur-xl',
      border: 'border-red-500/30 shadow-[var(--shadow-glass)]',
      icon: 'text-red-600 dark:text-red-400',
      text: 'text-red-700 dark:text-red-300',
    },
    warning: {
      bg: 'bg-gradient-to-br from-orange-500/20 to-orange-500/5 backdrop-blur-xl',
      border: 'border-orange-500/30 shadow-[var(--shadow-glass)]',
      icon: 'text-orange-600 dark:text-orange-400',
      text: 'text-orange-700 dark:text-orange-300',
    },
    info: {
      bg: 'bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 backdrop-blur-xl',
      border: 'border-yellow-500/30 shadow-[var(--shadow-glass)]',
      icon: 'text-yellow-600 dark:text-yellow-400',
      text: 'text-yellow-700 dark:text-yellow-300',
    },
  };

  const config = urgencyConfig[urgencyLevel];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card className={`${config.bg} ${config.border} border mb-4 hover:shadow-[var(--shadow-glass-hover)] transition-all`}>
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl bg-background/60 backdrop-blur-sm ${config.icon}`}>
                {urgencyLevel === 'critical' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Package className="h-5 w-5" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${config.text}`}>
                  {urgencyLevel === 'critical' 
                    ? (language === 'pt' ? '⚠️ Estoque acabando!' : '⚠️ Stock running out!')
                    : (language === 'pt' ? '📦 Atenção ao estoque' : '📦 Stock attention needed')}
                </p>
                
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === 'pt' 
                    ? `${mostUrgent.item_name}: ${mostUrgent.days_remaining} dias restantes`
                    : `${mostUrgent.item_name}: ${mostUrgent.days_remaining} days left`}
                </p>
                
                {criticalItems.length > 1 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {language === 'pt'
                      ? `+${criticalItems.length - 1} outros itens com estoque baixo`
                      : `+${criticalItems.length - 1} other items low on stock`}
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/estoque')}
                className="shrink-0 text-xs h-8 px-2"
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                {language === 'pt' ? 'Ver' : 'View'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
