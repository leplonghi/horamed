import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
