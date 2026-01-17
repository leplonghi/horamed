import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  Clock, 
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeeklySummaryMetrics {
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  adherenceRate: number;
  onTimeRate: number;
  bestHour: string | null;
  worstHour: string | null;
  medicationStats: { [name: string]: { total: number; taken: number } };
}

export default function ClaraWeeklySummary() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<WeeklySummaryMetrics | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const t = {
    title: language === 'pt' ? 'Resumo Semanal Clara' : 'Clara Weekly Summary',
    generate: language === 'pt' ? 'Gerar Resumo' : 'Generate Summary',
    refresh: language === 'pt' ? 'Atualizar' : 'Refresh',
    adherence: language === 'pt' ? 'Adesão' : 'Adherence',
    onTime: language === 'pt' ? 'Pontualidade' : 'On Time',
    bestHour: language === 'pt' ? 'Melhor horário' : 'Best hour',
    needsAttention: language === 'pt' ? 'Precisa atenção' : 'Needs attention',
    share: language === 'pt' ? 'Compartilhar' : 'Share',
    showDetails: language === 'pt' ? 'Ver detalhes' : 'Show details',
    hideDetails: language === 'pt' ? 'Ocultar detalhes' : 'Hide details',
  };

  const generateSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('clara-weekly-summary');
      
      if (error) throw error;
      
      setSummary(data.summary);
      setMetrics(data.metrics);
      setLastGenerated(new Date());
      
      toast.success(language === 'pt' ? 'Resumo gerado!' : 'Summary generated!');
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error(language === 'pt' ? 'Erro ao gerar resumo' : 'Error generating summary');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!summary) return;
    
    try {
      await navigator.share({
        title: t.title,
        text: summary,
      });
    } catch {
      await navigator.clipboard.writeText(summary);
      toast.success(language === 'pt' ? 'Copiado!' : 'Copied!');
    }
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base">{t.title}</span>
          </div>
          {summary && (
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2">
              <Skeleton className="h-16 flex-1" />
              <Skeleton className="h-16 flex-1" />
            </div>
          </div>
        ) : summary ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Summary Text */}
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {summary}
            </div>

            {/* Quick Metrics */}
            {metrics && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-card border">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">{t.adherence}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{metrics.adherenceRate}%</span>
                      <Progress value={metrics.adherenceRate} className="flex-1 h-2" />
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-card border">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">{t.onTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{metrics.onTimeRate}%</span>
                      <Progress value={metrics.onTimeRate} className="flex-1 h-2" />
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {metrics.bestHour && (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10">
                          <span className="text-sm">✅ {t.bestHour}</span>
                          <Badge variant="secondary">{metrics.bestHour}</Badge>
                        </div>
                      )}
                      
                      {metrics.worstHour && (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-orange-500/10">
                          <span className="text-sm">⚠️ {t.needsAttention}</span>
                          <Badge variant="outline">{metrics.worstHour}</Badge>
                        </div>
                      )}

                      {/* Medication breakdown */}
                      <div className="space-y-2">
                        {Object.entries(metrics.medicationStats || {}).map(([name, stats]) => (
                          <div key={name} className="flex items-center justify-between text-sm">
                            <span className="truncate flex-1">{name}</span>
                            <span className="text-muted-foreground">
                              {stats.taken}/{stats.total} ({Math.round((stats.taken / stats.total) * 100)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="w-full gap-2"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      {t.hideDetails}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      {t.showDetails}
                    </>
                  )}
                </Button>
              </>
            )}

            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={generateSummary}
              disabled={loading}
              className="w-full gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </Button>
          </motion.div>
        ) : (
          <div className="text-center py-4">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {language === 'pt' 
                ? 'Clara analisa sua semana e traz insights personalizados'
                : 'Clara analyzes your week and brings personalized insights'}
            </p>
            <Button onClick={generateSummary} disabled={loading} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {t.generate}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
