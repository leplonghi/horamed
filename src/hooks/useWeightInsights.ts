import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays, subDays, format } from "date-fns";

// GLP-1 and weight-related medications
const GLP1_MEDICATIONS = [
  'ozempic', 'wegovy', 'mounjaro', 'saxenda', 'victoza', 
  'trulicity', 'byetta', 'bydureon', 'rybelsus', 'semaglutida',
  'liraglutida', 'tirzepatida', 'dulaglutida', 'exenatida'
];

const BARIATRIC_MEDICATIONS = [
  'orlistat', 'xenical', 'contrave', 'qsymia', 'saxenda',
  'sibutramina', 'lorcaserin', 'phentermine', 'topiramato'
];

interface WeightInsight {
  type: 'progress' | 'correlation' | 'trend' | 'milestone' | 'suggestion';
  title: string;
  description: string;
  value?: string;
  trend?: 'up' | 'down' | 'stable';
  severity?: 'positive' | 'neutral' | 'attention';
}

interface WeightData {
  weight_kg: number;
  recorded_at: string;
}

interface MedicationData {
  id: string;
  name: string;
  created_at: string;
  category: string;
}

export function useWeightInsights(profileId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["weight-insights", user?.id, profileId],
    queryFn: async () => {
      if (!user?.id) return { insights: [], hasGLP1: false, medications: [] };

      // Fetch weight logs
      let weightQuery = supabase
        .from("weight_logs")
        .select("weight_kg, recorded_at")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: true });

      if (profileId) {
        weightQuery = weightQuery.eq("profile_id", profileId);
      }

      const { data: weightLogs } = await weightQuery;

      // Fetch medications to check for GLP-1/bariatric
      let medsQuery = supabase
        .from("items")
        .select("id, name, created_at, category")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (profileId) {
        medsQuery = medsQuery.eq("profile_id", profileId);
      }

      const { data: medications } = await medsQuery;

      // Detect GLP-1 or bariatric medications
      const glp1Meds = (medications || []).filter(med => 
        GLP1_MEDICATIONS.some(glp => med.name.toLowerCase().includes(glp))
      );

      const bariatricMeds = (medications || []).filter(med => 
        BARIATRIC_MEDICATIONS.some(bar => med.name.toLowerCase().includes(bar))
      );

      const weightRelatedMeds = [...glp1Meds, ...bariatricMeds];
      const hasGLP1 = weightRelatedMeds.length > 0;

      // Generate insights
      const insights: WeightInsight[] = [];

      if (!weightLogs || weightLogs.length === 0) {
        insights.push({
          type: 'suggestion',
          title: 'Comece a registrar seu peso',
          description: hasGLP1 
            ? `Você está usando ${weightRelatedMeds[0]?.name}. Registrar seu peso ajudará a acompanhar seu progresso.`
            : 'Registre seu peso regularmente para acompanhar sua evolução.',
          severity: 'neutral'
        });
        return { insights, hasGLP1, medications: weightRelatedMeds };
      }

      const weights = weightLogs as WeightData[];
      const latestWeight = weights[weights.length - 1];
      const firstWeight = weights[0];

      // Calculate total change
      const totalChange = latestWeight.weight_kg - firstWeight.weight_kg;
      const daysSinceFirst = differenceInDays(
        new Date(latestWeight.recorded_at),
        new Date(firstWeight.recorded_at)
      );

      // If we have GLP-1 medication, correlate with medication start
      if (hasGLP1 && weightRelatedMeds[0]) {
        const medStartDate = new Date(weightRelatedMeds[0].created_at);
        const weightsAfterMed = weights.filter(w => 
          new Date(w.recorded_at) >= medStartDate
        );

        if (weightsAfterMed.length >= 2) {
          const weightAtMedStart = weightsAfterMed[0];
          const changeWithMed = latestWeight.weight_kg - weightAtMedStart.weight_kg;
          const daysSinceMed = differenceInDays(new Date(), medStartDate);

          if (changeWithMed < 0) {
            insights.push({
              type: 'correlation',
              title: `Progresso com ${weightRelatedMeds[0].name}`,
              description: `Você perdeu ${Math.abs(changeWithMed).toFixed(1)}kg desde que iniciou o tratamento há ${daysSinceMed} dias.`,
              value: `${changeWithMed.toFixed(1)}kg`,
              trend: 'down',
              severity: 'positive'
            });
          } else if (changeWithMed > 0) {
            insights.push({
              type: 'correlation',
              title: `Acompanhamento com ${weightRelatedMeds[0].name}`,
              description: `Desde o início do tratamento há ${daysSinceMed} dias, seu peso aumentou ${changeWithMed.toFixed(1)}kg. Continue acompanhando com seu médico.`,
              value: `+${changeWithMed.toFixed(1)}kg`,
              trend: 'up',
              severity: 'attention'
            });
          }
        }

        // Fetch adherence for this medication
        const { data: doses } = await supabase
          .from("dose_instances")
          .select("status")
          .eq("item_id", weightRelatedMeds[0].id)
          .gte("due_at", subDays(new Date(), 30).toISOString());

        if (doses && doses.length > 0) {
          const taken = doses.filter(d => d.status === 'taken').length;
          const adherence = Math.round((taken / doses.length) * 100);

          insights.push({
            type: 'correlation',
            title: 'Adesão ao tratamento',
            description: `Sua adesão ao ${weightRelatedMeds[0].name} nos últimos 30 dias foi de ${adherence}%.`,
            value: `${adherence}%`,
            severity: adherence >= 80 ? 'positive' : adherence >= 60 ? 'neutral' : 'attention'
          });
        }
      }

      // 7-day trend
      const sevenDaysAgo = subDays(new Date(), 7);
      const recentWeights = weights.filter(w => new Date(w.recorded_at) >= sevenDaysAgo);
      
      if (recentWeights.length >= 2) {
        const weekChange = recentWeights[recentWeights.length - 1].weight_kg - recentWeights[0].weight_kg;
        
        insights.push({
          type: 'trend',
          title: 'Tendência da semana',
          description: weekChange === 0 
            ? 'Seu peso está estável nesta semana.'
            : weekChange < 0 
              ? `Você perdeu ${Math.abs(weekChange).toFixed(1)}kg nos últimos 7 dias.`
              : `Seu peso aumentou ${weekChange.toFixed(1)}kg nos últimos 7 dias.`,
          value: weekChange === 0 ? '0kg' : `${weekChange > 0 ? '+' : ''}${weekChange.toFixed(1)}kg`,
          trend: weekChange < 0 ? 'down' : weekChange > 0 ? 'up' : 'stable',
          severity: weekChange <= 0 ? 'positive' : 'neutral'
        });
      }

      // Milestones
      if (totalChange <= -5) {
        insights.push({
          type: 'milestone',
          title: '🎉 Marco alcançado!',
          description: `Parabéns! Você já perdeu ${Math.abs(totalChange).toFixed(1)}kg desde o início do acompanhamento.`,
          value: `${totalChange.toFixed(1)}kg`,
          severity: 'positive'
        });
      }

      // Suggestion for regular logging
      const lastLogDate = new Date(latestWeight.recorded_at);
      const daysSinceLastLog = differenceInDays(new Date(), lastLogDate);
      
      if (daysSinceLastLog > 7) {
        insights.push({
          type: 'suggestion',
          title: 'Registre seu peso',
          description: `Faz ${daysSinceLastLog} dias desde sua última pesagem. Mantenha o acompanhamento regular!`,
          severity: 'attention'
        });
      }

      return { 
        insights, 
        hasGLP1, 
        medications: weightRelatedMeds,
        latestWeight: latestWeight.weight_kg,
        totalChange,
        daysSinceFirst
      };
    },
    enabled: !!user?.id,
  });
}
