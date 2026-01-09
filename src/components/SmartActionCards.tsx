import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import { useSmartMedicationSuggestions } from "@/hooks/useSmartMedicationSuggestions";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export function SmartActionCards() {
  const navigate = useNavigate();
  const { activeProfile } = useUserProfiles();
  const { data: suggestions, isLoading } = useSmartMedicationSuggestions(activeProfile?.id);
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-xl shadow-[var(--shadow-glass)]">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-destructive bg-gradient-to-br from-destructive/10 to-destructive/5 backdrop-blur-md';
      case 'medium':
        return 'border-l-4 border-l-primary bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-md';
      default:
        return 'border-l-4 border-l-muted-foreground bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur-md';
    }
  };

  const remaining = suggestions.length - 3;
  const remainingLabel = remaining === 1 ? t('smartActions.suggestion') : t('smartActions.suggestions');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
        <h3 className="heading-section">{t('smartActions.title')}</h3>
      </div>
      
      <div className="space-y-3">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <motion.div
            key={`${suggestion.type}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`${getPriorityColor(suggestion.priority)} shadow-[var(--shadow-glass)] hover:shadow-[var(--shadow-glass-hover)] transition-all cursor-pointer group`}
              onClick={() => navigate(suggestion.actionPath)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <h4 className="heading-card text-base">{suggestion.title}</h4>
                    <p className="text-subtitle leading-relaxed">{suggestion.description}</p>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="shrink-0 gap-2 group-hover:gap-3 transition-all"
                  >
                    {suggestion.actionLabel}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {suggestions.length > 3 && (
        <Button 
          variant="ghost" 
          className="w-full text-subtitle"
          onClick={() => navigate('/medications')}
        >
          {t('smartActions.seeMore', { count: String(remaining), label: remainingLabel })}
        </Button>
      )}
    </div>
  );
}
