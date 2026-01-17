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
    
    const supabase = createClient(supabaseUrl!, supabaseKey!, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { period = 30 } = await req.json().catch(() => ({}));

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, birth_date, weight_kg, height_cm")
      .eq("user_id", user.id)
      .single();

    // Get active medications
    const { data: medications } = await supabase
      .from("items")
      .select(`id, name, dose_text, category, notes, stock(units_left)`)
      .eq("user_id", user.id)
      .eq("is_active", true);

    // Get dose history for the period
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    const { data: doses } = await supabase
      .from("dose_instances")
      .select(`status, due_at, taken_at, delay_minutes, items!inner(name, user_id)`)
      .eq("items.user_id", user.id)
      .gte("due_at", startDate.toISOString());

    // Get side effects
    const { data: sideEffects } = await supabase
      .from("side_effects_log")
      .select("*")
      .eq("user_id", user.id)
      .gte("recorded_at", startDate.toISOString());

    // Get weight history
    const { data: weights } = await supabase
      .from("weight_records")
      .select("weight_kg, recorded_at")
      .eq("user_id", user.id)
      .gte("recorded_at", startDate.toISOString())
      .order("recorded_at", { ascending: true });

    // Calculate metrics
    const takenDoses = doses?.filter((d: any) => d.status === "taken") || [];
    const adherenceRate = doses?.length ? Math.round((takenDoses.length / doses.length) * 100) : 0;

    // Group adherence by medication
    const adherenceByMed: { [name: string]: { taken: number, total: number } } = {};
    doses?.forEach((d: any) => {
      const name = d.items.name;
      if (!adherenceByMed[name]) adherenceByMed[name] = { taken: 0, total: 0 };
      adherenceByMed[name].total++;
      if (d.status === "taken") adherenceByMed[name].taken++;
    });

    // Calculate age
    let age = null;
    if (profile?.birth_date) {
      const birthDate = new Date(profile.birth_date);
      age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    }

    // Build report context
    const reportContext = {
      patientName: profile?.full_name || "Paciente",
      age,
      weightKg: profile?.weight_kg,
      heightCm: profile?.height_cm,
      bmi: profile?.weight_kg && profile?.height_cm 
        ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1) 
        : null,
      periodDays: period,
      medications: medications?.map((m: any) => ({
        name: m.name,
        dose: m.dose_text,
        category: m.category,
        stockLeft: m.stock?.[0]?.units_left
      })),
      adherenceRate,
      adherenceByMedication: Object.entries(adherenceByMed).map(([name, stats]) => ({
        name,
        rate: Math.round((stats.taken / stats.total) * 100),
        taken: stats.taken,
        total: stats.total
      })),
      sideEffectsCount: sideEffects?.length || 0,
      sideEffects: sideEffects?.slice(0, 10).map((se: any) => ({
        medication: se.medication_name,
        symptom: se.symptom,
        severity: se.severity,
        date: se.recorded_at
      })),
    weightChange: weights && weights.length >= 2 
        ? (weights[weights.length - 1].weight_kg - weights[0].weight_kg).toFixed(1)
        : null
    };

    // Generate AI report
    const systemPrompt = `Você é um assistente médico gerando um RELATÓRIO DE CONSULTA profissional.

DADOS DO PACIENTE:
- Nome: ${reportContext.patientName}
${age ? `- Idade: ${age} anos` : ''}
${reportContext.weightKg ? `- Peso: ${reportContext.weightKg}kg` : ''}
${reportContext.bmi ? `- IMC: ${reportContext.bmi}` : ''}
${reportContext.weightChange ? `- Variação de peso no período: ${reportContext.weightChange}kg` : ''}

MEDICAMENTOS EM USO:
${reportContext.medications?.map(m => `- ${m.name}${m.dose ? ` (${m.dose})` : ''}${m.category ? ` [${m.category}]` : ''}`).join('\n') || 'Nenhum cadastrado'}

ADESÃO AO TRATAMENTO (${period} dias):
- Taxa geral: ${adherenceRate}%
${reportContext.adherenceByMedication.map(m => `- ${m.name}: ${m.rate}% (${m.taken}/${m.total} doses)`).join('\n')}

${reportContext.sideEffectsCount > 0 ? `EFEITOS ADVERSOS RELATADOS:
${reportContext.sideEffects?.map(se => `- ${se.medication}: ${se.symptom} (${se.severity})`).join('\n')}` : ''}

GERE UM RELATÓRIO ESTRUTURADO CONTENDO:
1. Resumo Executivo (2-3 frases)
2. Medicamentos em Uso (lista com doses)
3. Adesão ao Tratamento (destaque pontos de atenção)
4. Observações Relevantes (efeitos adversos, variação de peso, etc)
5. Pontos para Discussão com o Médico

FORMATO: Texto profissional, objetivo, sem jargão técnico excessivo. Máximo 400 palavras.`;

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
          { role: "user", content: "Gere o relatório de consulta." },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate report");
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "Não foi possível gerar o relatório.";

    return new Response(
      JSON.stringify({ 
        report,
        metrics: {
          periodDays: period,
          adherenceRate,
          medicationsCount: medications?.length || 0,
          sideEffectsCount: reportContext.sideEffectsCount,
          adherenceByMedication: reportContext.adherenceByMedication
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Consultation prep error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao gerar relatório" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
