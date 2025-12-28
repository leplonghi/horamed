import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Lightbulb, X, AlertTriangle, Info, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { startOfDay, subDays, differenceInHours } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface SmartInsight {
  id: string;
  type: "pattern" | "reminder" | "achievement" | "warning";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

export default function SmartInsightsCard() {
  const { t } = useLanguage();
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSmartInsights();
  }, []);

  const generateSmartInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newInsights: SmartInsight[] = [];

      // Analyze last 14 days of data
      const last14Days = startOfDay(subDays(new Date(), 14));
      
      const { data: doses } = await supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(user_id, name)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", last14Days.toISOString());

      if (!doses || doses.length === 0) {
        setLoading(false);
        return;
      }

      // Pattern 1: Consistent delay pattern
      const delayedDoses = doses.filter(
        (d) => d.status === "taken" && d.delay_minutes && d.delay_minutes > 30
      );
      if (delayedDoses.length > 5) {
        const avgDelay = Math.round(
          delayedDoses.reduce((sum, d) => sum + (d.delay_minutes || 0), 0) / delayedDoses.length
        );
        newInsights.push({
          id: "delay-pattern",
          type: "pattern",
          title: t('smartInsights.delayPattern'),
          description: t('smartInsights.delayPatternDesc', { minutes: String(avgDelay) }),
          priority: "medium",
        });
      }

      // Pattern 2: Weekend adherence drop
      const weekendDoses = doses.filter((d) => {
        const day = new Date(d.due_at).getDay();
        return day === 0 || day === 6;
      });
      const weekdayDoses = doses.filter((d) => {
        const day = new Date(d.due_at).getDay();
        return day > 0 && day < 6;
      });

      if (weekendDoses.length > 0 && weekdayDoses.length > 0) {
        const weekendAdherence = (weekendDoses.filter((d) => d.status === "taken").length / weekendDoses.length) * 100;
        const weekdayAdherence = (weekdayDoses.filter((d) => d.status === "taken").length / weekdayDoses.length) * 100;
        
        if (weekdayAdherence - weekendAdherence > 15) {
          newInsights.push({
            id: "weekend-drop",
            type: "warning",
            title: t('smartInsights.weekendDrop'),
            description: t('smartInsights.weekendDropDesc', { percent: String(Math.round(weekdayAdherence - weekendAdherence)) }),
            priority: "high",
          });
        }
      }

      // Pattern 3: Specific time slot issues
      const morningDoses = doses.filter((d) => {
        const hour = new Date(d.due_at).getHours();
        return hour >= 6 && hour < 12;
      });

      if (morningDoses.length > 3) {
        const morningAdherence = (morningDoses.filter((d) => d.status === "taken").length / morningDoses.length) * 100;
        if (morningAdherence < 70) {
          newInsights.push({
            id: "morning-issues",
            type: "pattern",
            title: t('smartInsights.morningIssues'),
            description: t('smartInsights.morningIssuesDesc'),
            priority: "medium",
          });
        }
      }

      // Pattern 4: Stock insights
      const { data: stockData } = await supabase
        .from("stock")
        .select(`
          *,
          items!inner(user_id, name)
        `)
        .eq("items.user_id", user.id);

      if (stockData) {
        const lowStock = stockData.filter((s) => {
          if (!s.projected_end_at) return false;
          const daysLeft = Math.ceil(
            (new Date(s.projected_end_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return daysLeft <= 7 && daysLeft > 0;
        });

        if (lowStock.length > 0) {
          newInsights.push({
            id: "low-stock",
            type: "reminder",
            title: t('smartInsights.restockNeeded'),
            description: t('smartInsights.restockNeededDesc', { count: String(lowStock.length) }),
            priority: "high",
          });
        }
      }

      // Pattern 5: Positive reinforcement
      const recentDoses = doses.filter((d) => {
        const hoursSince = differenceInHours(new Date(), new Date(d.due_at));
        return hoursSince <= 168; // Last 7 days
      });
      const recentAdherence = (recentDoses.filter((d) => d.status === "taken").length / recentDoses.length) * 100;

      if (recentAdherence >= 95) {
        newInsights.push({
          id: "excellent-progress",
          type: "achievement",
          title: t('smartInsights.excellentProgress'),
          description: t('smartInsights.excellentProgressDesc', { percent: String(Math.round(recentAdherence)) }),
          priority: "low",
        });
      }

      setInsights(newInsights);
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismissInsight = (id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  const getIcon = (type: SmartInsight["type"]) => {
    switch (type) {
      case "pattern":
        return <TrendingUp className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "reminder":
        return <Info className="h-5 w-5" />;
      case "achievement":
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getColorClasses = (priority: SmartInsight["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 border-destructive/30 text-destructive";
      case "medium":
        return "bg-warning/10 border-warning/30 text-warning";
      case "low":
        return "bg-success/10 border-success/30 text-success";
    }
  };

  if (loading || insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse">
          <Lightbulb className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{t('smartInsights.title')}</h3>
          <p className="text-xs text-muted-foreground">
            {t('smartInsights.subtitle')}
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <Card
            key={insight.id}
            style={{ animationDelay: `${index * 100}ms` }}
            className={cn(
              "p-5 relative backdrop-blur-sm bg-gradient-to-br transition-all duration-300 hover:scale-[1.01] hover:shadow-lg animate-scale-in border-2",
              getColorClasses(insight.priority)
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-7 w-7 hover:bg-background/50 transition-all hover:scale-110"
              onClick={() => dismissInsight(insight.id)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="flex items-start gap-4 pr-10">
              <div className={cn(
                "p-3 rounded-xl transition-transform duration-300 hover:scale-110",
                insight.priority === "high" ? "bg-destructive/20" :
                insight.priority === "medium" ? "bg-orange-500/20" :
                "bg-primary/20"
              )}>
                {getIcon(insight.type)}
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <h4 className="font-bold text-base leading-tight">{insight.title}</h4>
                <p className="text-sm leading-relaxed opacity-90">{insight.description}</p>
                {insight.priority === "high" && (
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{t('smartInsights.actionRecommended')}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
