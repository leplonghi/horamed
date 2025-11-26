import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, format, subDays } from "date-fns";

export interface StockProjection {
  id: string;
  item_id: string;
  item_name: string;
  units_left: number;
  units_total: number;
  projected_end_at: string | null;
  created_from_prescription_id: string | null;
  prescription_title: string | null;
  last_refill_at: string | null;
  consumption_history: ConsumptionEntry[];
  daily_consumption_avg: number;
  days_remaining: number | null;
  consumption_trend: 'increasing' | 'stable' | 'decreasing';
  taken_count_7d: number;
  scheduled_count_7d: number;
  adherence_7d: number;
  treatment_end_date: string | null;
}

export interface ConsumptionEntry {
  date: string;
  amount: number;
  reason: 'taken' | 'adjusted' | 'refill' | 'lost';
}

export function useStockProjection(profileId?: string) {
  return useQuery({
    queryKey: ["stock-projection", profileId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch stock with related data
      let stockQuery = supabase
        .from("stock")
        .select(`
          id,
          item_id,
          units_left,
          units_total,
          projected_end_at,
          created_from_prescription_id,
          last_refill_at,
          consumption_history,
          items!inner (
            id,
            name,
            user_id,
            profile_id,
            is_active,
            treatment_end_date
          ),
          documentos_saude (
            id,
            title
          )
        `)
        .eq("items.user_id", user.id)
        .eq("items.is_active", true);

      if (profileId) {
        stockQuery = stockQuery.eq("items.profile_id", profileId);
      }

      const { data: stock, error: stockError } = await stockQuery;

      if (stockError) throw stockError;
      if (!stock || stock.length === 0) return [];

      // Fetch dose data for the last 7 days for each item
      const itemIds = stock.map(s => (s.items as any).id);
      const sevenDaysAgo = subDays(new Date(), 7);

      const { data: doses } = await supabase
        .from("dose_instances")
        .select("item_id, status, taken_at, due_at")
        .in("item_id", itemIds)
        .gte("due_at", sevenDaysAgo.toISOString());

      // Process each stock item
      const projections: StockProjection[] = stock.map((s: any) => {
        const item = s.items;
        const itemDoses = doses?.filter(d => d.item_id === item.id) || [];
        
        const takenDoses = itemDoses.filter(d => d.status === 'taken');
        const scheduledDoses = itemDoses.filter(d => 
          d.status === 'scheduled' || d.status === 'taken'
        );

        const dailyConsumptionAvg = takenDoses.length / 7;
        const adherence = scheduledDoses.length > 0 
          ? (takenDoses.length / scheduledDoses.length) * 100 
          : 0;

        // Calculate consumption trend
        const firstHalf = takenDoses.filter(d => 
          new Date(d.taken_at!) <= subDays(new Date(), 3.5)
        ).length;
        const secondHalf = takenDoses.filter(d =>
          new Date(d.taken_at!) > subDays(new Date(), 3.5)
        ).length;
        
        let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
        if (secondHalf > firstHalf * 1.2) trend = 'increasing';
        if (secondHalf < firstHalf * 0.8) trend = 'decreasing';

        // Calculate days remaining
        const daysRemaining = s.projected_end_at
          ? differenceInDays(new Date(s.projected_end_at), new Date())
          : dailyConsumptionAvg > 0
            ? Math.round(s.units_left / dailyConsumptionAvg)
            : null;

        return {
          id: s.id,
          item_id: item.id,
          item_name: item.name,
          units_left: s.units_left,
          units_total: s.units_total,
          projected_end_at: s.projected_end_at,
          created_from_prescription_id: s.created_from_prescription_id,
          prescription_title: s.documentos_saude?.title || null,
          last_refill_at: s.last_refill_at,
          consumption_history: s.consumption_history || [],
          daily_consumption_avg: dailyConsumptionAvg,
          days_remaining: daysRemaining,
          consumption_trend: trend,
          taken_count_7d: takenDoses.length,
          scheduled_count_7d: scheduledDoses.length,
          adherence_7d: Math.round(adherence),
          treatment_end_date: item.treatment_end_date || null,
        };
      });

      // Sort by days remaining (critical first)
      return projections.sort((a, b) => {
        if (a.days_remaining === null) return 1;
        if (b.days_remaining === null) return -1;
        return a.days_remaining - b.days_remaining;
      });
    },
    enabled: true,
  });
}
