import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { month, year } = await req.json();
    
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader! },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Não autenticado");
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all doses for the month
    const { data: doses } = await supabase
      .from("dose_instances")
      .select(`
        *,
        items!inner(user_id, name)
      `)
      .eq("items.user_id", user.id)
      .gte("due_at", startDate.toISOString())
      .lte("due_at", endDate.toISOString());

    if (!doses || doses.length === 0) {
      return new Response(
        JSON.stringify({
          message: "Nenhum dado disponível para este mês",
          report: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate statistics
    const totalDoses = doses.length;
    const takenDoses = doses.filter((d) => d.status === "taken").length;
    const skippedDoses = doses.filter((d) => d.status === "skipped").length;
    const adherenceRate = Math.round((takenDoses / totalDoses) * 100);

    // Calculate average delay
    const delaysMinutes = doses
      .filter((d) => d.status === "taken" && d.delay_minutes)
      .map((d) => d.delay_minutes);
    const avgDelay =
      delaysMinutes.length > 0
        ? Math.round(delaysMinutes.reduce((a, b) => a + b, 0) / delaysMinutes.length)
        : 0;

    // Get previous month data for comparison
    const prevStartDate = new Date(year, month - 2, 1);
    const prevEndDate = new Date(year, month - 1, 0, 23, 59, 59);

    const { data: prevDoses } = await supabase
      .from("dose_instances")
      .select(`
        *,
        items!inner(user_id)
      `)
      .eq("items.user_id", user.id)
      .gte("due_at", prevStartDate.toISOString())
      .lte("due_at", prevEndDate.toISOString());

    let previousAdherence = 0;
    if (prevDoses && prevDoses.length > 0) {
      const prevTaken = prevDoses.filter((d) => d.status === "taken").length;
      previousAdherence = Math.round((prevTaken / prevDoses.length) * 100);
    }

    const improvementPercent = adherenceRate - previousAdherence;

    // Group by medication
    const medicationStats = doses.reduce((acc: any, dose: any) => {
      const medName = dose.items.name;
      if (!acc[medName]) {
        acc[medName] = { total: 0, taken: 0 };
      }
      acc[medName].total++;
      if (dose.status === "taken") acc[medName].taken++;
      return acc;
    }, {});

    const medicationBreakdown = Object.entries(medicationStats).map(([name, stats]: [string, any]) => ({
      name,
      adherence: Math.round((stats.taken / stats.total) * 100),
      total: stats.total,
      taken: stats.taken,
    }));

    // Get vital signs for the month
    const { data: vitalSigns } = await supabase
      .from("sinais_vitais")
      .select("*")
      .eq("user_id", user.id)
      .gte("data_medicao", startDate.toISOString())
      .lte("data_medicao", endDate.toISOString())
      .order("data_medicao", { ascending: true });

    // Calculate vital signs statistics
    let vitalSignsStats = null;
    if (vitalSigns && vitalSigns.length > 0) {
      const calculateStats = (field: string) => {
        const values = vitalSigns
          .map((v: any) => v[field])
          .filter((v: any) => v !== null && v !== undefined);
        
        if (values.length === 0) return null;
        
        const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        return {
          avg: Math.round(avg * 10) / 10,
          min,
          max,
          count: values.length,
        };
      };

      vitalSignsStats = {
        pressao_sistolica: calculateStats("pressao_sistolica"),
        pressao_diastolica: calculateStats("pressao_diastolica"),
        frequencia_cardiaca: calculateStats("frequencia_cardiaca"),
        temperatura: calculateStats("temperatura"),
        glicemia: calculateStats("glicemia"),
        saturacao_oxigenio: calculateStats("saturacao_oxigenio"),
        peso_kg: calculateStats("peso_kg"),
        totalRecords: vitalSigns.length,
        trends: {},
      };

      // Get previous month vital signs for comparison
      const { data: prevVitalSigns } = await supabase
        .from("sinais_vitais")
        .select("*")
        .eq("user_id", user.id)
        .gte("data_medicao", prevStartDate.toISOString())
        .lte("data_medicao", prevEndDate.toISOString());

      if (prevVitalSigns && prevVitalSigns.length > 0) {
        const calculateTrend = (field: string, currentStats: any) => {
          if (!currentStats) return null;
          
          const prevValues = prevVitalSigns
            .map((v: any) => v[field])
            .filter((v: any) => v !== null && v !== undefined);
          
          if (prevValues.length === 0) return null;
          
          const prevAvg = prevValues.reduce((a: number, b: number) => a + b, 0) / prevValues.length;
          const diff = currentStats.avg - prevAvg;
          const percentChange = Math.round((diff / prevAvg) * 100);
          
          return {
            diff: Math.round(diff * 10) / 10,
            percentChange,
            direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable",
          };
        };

        vitalSignsStats.trends = {
          pressao_sistolica: calculateTrend("pressao_sistolica", vitalSignsStats.pressao_sistolica),
          pressao_diastolica: calculateTrend("pressao_diastolica", vitalSignsStats.pressao_diastolica),
          frequencia_cardiaca: calculateTrend("frequencia_cardiaca", vitalSignsStats.frequencia_cardiaca),
          temperatura: calculateTrend("temperatura", vitalSignsStats.temperatura),
          glicemia: calculateTrend("glicemia", vitalSignsStats.glicemia),
          saturacao_oxigenio: calculateTrend("saturacao_oxigenio", vitalSignsStats.saturacao_oxigenio),
          peso_kg: calculateTrend("peso_kg", vitalSignsStats.peso_kg),
        };
      }
    }

    const report = {
      month,
      year,
      totalDoses,
      takenDoses,
      skippedDoses,
      adherenceRate,
      previousAdherence,
      improvementPercent,
      avgDelayMinutes: avgDelay,
      medicationBreakdown,
      vitalSigns: vitalSignsStats,
      generatedAt: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        message: "Relatório gerado com sucesso",
        report,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Report generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
