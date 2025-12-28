import { useWeightInsights } from "@/hooks/useWeightInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, Minus, Activity, Clock, Info, Scale, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeightInsightsCardProps {
  profileId?: string;
}

export default function WeightInsightsCard({ profileId }: WeightInsightsCardProps) {
  const { data, isLoading } = useWeightInsights(profileId);
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card/80 backdrop-blur-sm p-6 animate-pulse" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="h-6 w-40 bg-muted rounded mb-4" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  if (!data || data.insights.length === 0) {
    return null;
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'down': return <TrendingDown className="h-5 w-5" />;
      case 'up': return <TrendingUp className="h-5 w-5" />;
      default: return <Minus className="h-5 w-5" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'correlation': return <Activity className="h-5 w-5" />;
      case 'frequency': return <Clock className="h-5 w-5" />;
      case 'info': return <Info className="h-5 w-5" />;
      case 'trend': return <TrendingDown className="h-5 w-5" />;
      default: return <Scale className="h-5 w-5" />;
    }
  };

  // Neutral styling - no green/red judgmental colors
  const getNeutralStyles = () => ({
    bg: 'hsl(var(--primary) / 0.1)',
    border: 'hsl(var(--primary) / 0.2)',
    text: 'text-primary'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with medication context */}
      {data.hasGLP1 && data.medications && data.medications.length > 0 && (
        <div 
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ 
            backgroundColor: 'hsl(var(--primary) / 0.1)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div className="p-2 rounded-xl bg-primary/20">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {t('weightInsights.activeTracking')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('weightInsights.correlatingWith', { medications: data.medications.map(m => m.name).join(', ') })}
            </p>
          </div>
        </div>
      )}

      {/* Insights with neutral tone */}
      <div className="space-y-3">
        {data.insights.slice(0, 3).map((insight, index) => {
          const styles = getNeutralStyles();
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl bg-card/80 backdrop-blur-sm p-4"
              style={{ 
                boxShadow: 'var(--shadow-sm)',
                borderLeft: `3px solid ${styles.border}`
              }}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="p-2 rounded-xl shrink-0"
                  style={{ backgroundColor: styles.bg }}
                >
                  <span className={styles.text}>
                    {insight.trend ? getTrendIcon(insight.trend) : getTypeIcon(insight.type)}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-foreground">{insight.title}</h4>
                    {insight.value && (
                      <span className={`font-bold text-lg ${styles.text}`}>
                        {insight.value}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Frequency guidance */}
      <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          {t('weightInsights.guidanceTip')}
        </p>
      </div>

      {/* Quick action to log weight */}
      <Button
        variant="outline"
        className="w-full rounded-xl hover-lift"
        onClick={() => navigate(`/peso/historico${profileId ? `?profile=${profileId}` : ''}`)}
      >
        <Scale className="h-4 w-4 mr-2" />
        {t('weightInsights.logWeight')}
        <ArrowRight className="h-4 w-4 ml-auto" />
      </Button>
    </motion.div>
  );
}