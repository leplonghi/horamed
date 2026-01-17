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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration is missing");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const userName = profile?.full_name?.split(' ')[0] || 'usuário';

    // Get last 7 days of doses
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data: doses } = await supabase
      .from("dose_instances")
      .select(`
        id, status, due_at, taken_at, delay_minutes,
        items!inner(name, user_id, category)
      `)
      .eq("items.user_id", user.id)
      .gte("due_at", weekAgo.toISOString())
      .order("due_at", { ascending: true });

    if (!doses || doses.length === 0) {
      return new Response(
        JSON.stringify({ 
          summary: "Ainda não há dados suficientes para gerar um resumo semanal. Continue registrando suas doses!",
          metrics: null 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate metrics
    const taken = doses.filter((d: any) => d.status === "taken");
    const missed = doses.filter((d: any) => d.status === "missed");
    const skipped = doses.filter((d: any) => d.status === "skipped");
    const onTime = taken.filter((d: any) => d.delay_minutes !== null && d.delay_minutes <= 15);
    
    const adherenceRate = Math.round((taken.length / doses.length) * 100);
    const onTimeRate = taken.length > 0 ? Math.round((onTime.length / taken.length) * 100) : 0;

    // Group by hour to find patterns
    const hourlyDistribution: { [hour: number]: { total: number, taken: number, missed: number } } = {};
    doses.forEach((d: any) => {
      const hour = new Date(d.due_at).getHours();
      if (!hourlyDistribution[hour]) {
        hourlyDistribution[hour] = { total: 0, taken: 0, missed: 0 };
      }
      hourlyDistribution[hour].total++;
      if (d.status === "taken") hourlyDistribution[hour].taken++;
      if (d.status === "missed") hourlyDistribution[hour].missed++;
    });

    // Find best and worst hours
    let bestHour = -1, worstHour = -1;
    let bestRate = 0, worstRate = 100;
    
    for (const [hour, data] of Object.entries(hourlyDistribution)) {
      if (data.total >= 3) {
        const rate = (data.taken / data.total) * 100;
        if (rate > bestRate) { bestRate = rate; bestHour = parseInt(hour); }
        if (rate < worstRate) { worstRate = rate; worstHour = parseInt(hour); }
      }
    }

    // Group by medication
    const byMedication: { [name: string]: { total: number, taken: number } } = {};
    doses.forEach((d: any) => {
      const name = d.items.name;
      if (!byMedication[name]) byMedication[name] = { total: 0, taken: 0 };
      byMedication[name].total++;
      if (d.status === "taken") byMedication[name].taken++;
    });

    // Group by day of week
    const byDayOfWeek: { [day: number]: { total: number, taken: number } } = {};
    doses.forEach((d: any) => {
      const day = new Date(d.due_at).getDay();
      if (!byDayOfWeek[day]) byDayOfWeek[day] = { total: 0, taken: 0 };
      byDayOfWeek[day].total++;
      if (d.status === "taken") byDayOfWeek[day].taken++;
    });

    // Build context for AI
    const contextData = {
      userName,
      totalDoses: doses.length,
      takenDoses: taken.length,
      missedDoses: missed.length,
      skippedDoses: skipped.length,
      adherenceRate,
      onTimeRate,
      bestHour: bestHour >= 0 ? `${bestHour}:00` : null,
      bestHourRate: bestRate,
      worstHour: worstHour >= 0 ? `${worstHour}:00` : null,
      worstHourRate: worstRate,
      medicationStats: byMedication,
      dayOfWeekStats: byDayOfWeek
    };

    const systemPrompt = `Você é Clara, assistente de saúde do HoraMed. Gere um RESUMO SEMANAL personalizado e motivador.

DADOS DA SEMANA:
- Usuário: ${userName}
- Total de doses: ${contextData.totalDoses}
- Doses tomadas: ${contextData.takenDoses} (${adherenceRate}%)
- Doses perdidas: ${contextData.missedDoses}
- Doses puladas: ${contextData.skippedDoses}
- Taxa de pontualidade: ${onTimeRate}%
${bestHour >= 0 ? `- Melhor horário: ${bestHour}:00 (${Math.round(bestRate)}% de adesão)` : ''}
${worstHour >= 0 ? `- Horário mais difícil: ${worstHour}:00 (${Math.round(worstRate)}% de adesão)` : ''}

ESTATÍSTICAS POR MEDICAMENTO:
${Object.entries(byMedication).map(([name, stats]) => `- ${name}: ${stats.taken}/${stats.total} (${Math.round((stats.taken/stats.total)*100)}%)`).join('\n')}

FORMATO DO RESUMO:
1. Saudação breve com nome
2. Destaque principal da semana (conquista ou ponto de atenção)
3. Análise de padrões (se houver horários melhores/piores)
4. 1-2 sugestões práticas e específicas
5. Mensagem motivacional final

REGRAS:
- Máximo 150 palavras
- Tom gentil e encorajador
- Celebre conquistas, não critique falhas
- Sugestões devem ser acionáveis
- Sem emojis excessivos (máximo 3 no total)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Gere o resumo semanal personalizado." },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      throw new Error("Failed to generate summary");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Não foi possível gerar o resumo.";

    return new Response(
      JSON.stringify({ 
        summary,
        metrics: {
          totalDoses: contextData.totalDoses,
          takenDoses: contextData.takenDoses,
          missedDoses: contextData.missedDoses,
          adherenceRate,
          onTimeRate,
          bestHour: contextData.bestHour,
          worstHour: contextData.worstHour,
          medicationStats: contextData.medicationStats
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Weekly summary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao gerar resumo" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
