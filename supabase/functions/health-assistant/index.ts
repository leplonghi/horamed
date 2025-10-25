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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user context from request
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader! },
      },
    });

    // Get user's medications and recent doses for context
    const { data: { user } } = await supabase.auth.getUser();
    
    let contextInfo = "";
    if (user) {
      // Get health profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("birth_date, weight_kg, height_cm")
        .eq("user_id", user.id)
        .single();

      if (profile?.birth_date && profile?.weight_kg) {
        const birthDate = new Date(profile.birth_date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear() - 
          (today.getMonth() < birthDate.getMonth() || 
           (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
        
        let bmi = null;
        let bmiCategory = "";
        if (profile.height_cm) {
          const heightM = profile.height_cm / 100;
          bmi = (profile.weight_kg / (heightM * heightM)).toFixed(1);
          
          if (bmi < 18.5) bmiCategory = "Baixo peso";
          else if (bmi < 25) bmiCategory = "Peso normal";
          else if (bmi < 30) bmiCategory = "Sobrepeso";
          else bmiCategory = "Obesidade";
        }

        contextInfo += "\n\nPerfil do paciente:\n";
        contextInfo += `- Idade: ${age} anos\n`;
        contextInfo += `- Peso: ${profile.weight_kg} kg\n`;
        if (bmi) {
          contextInfo += `- IMC: ${bmi} (${bmiCategory})\n`;
        }
      }

      const { data: medications } = await supabase
        .from("items")
        .select("name, dose_text, with_food, notes")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const { data: recentDoses } = await supabase
        .from("dose_instances")
        .select(`
          status,
          due_at,
          taken_at,
          items(name)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("due_at", { ascending: false })
        .limit(20);

      if (medications && medications.length > 0) {
        contextInfo += "\n\nMedicamentos atuais do usuário:\n";
        medications.forEach((med) => {
          contextInfo += `- ${med.name}${med.dose_text ? ` (${med.dose_text})` : ""}${med.with_food ? " - Tomar com alimento" : ""}${med.notes ? ` - Obs: ${med.notes}` : ""}\n`;
        });
      }

      if (recentDoses && recentDoses.length > 0) {
        const takenCount = recentDoses.filter((d) => d.status === "taken").length;
        const totalCount = recentDoses.length;
        const adherenceRate = Math.round((takenCount / totalCount) * 100);
        contextInfo += `\n\nAdesão nos últimos 7 dias: ${adherenceRate}% (${takenCount}/${totalCount} doses tomadas)`;
      }
    }

    const systemPrompt = `Você é um assistente de saúde especializado em medicamentos e adesão ao tratamento. Você ajuda usuários a:
- Entender interações medicamentosas
- Responder dúvidas sobre seus medicamentos
- Sugerir os melhores horários para tomar remédios
- Dar dicas para melhorar a adesão ao tratamento
- Fornecer informações gerais sobre saúde

IMPORTANTE:
- Você NÃO é um médico. Sempre incentive o usuário a consultar seu médico para decisões importantes.
- Seja empático, encorajador e use uma linguagem simples e acessível.
- Mantenha respostas concisas (máximo 3-4 parágrafos).
- Use emojis apropriados para tornar a conversa mais amigável.
- Se perguntado sobre interações medicamentosas, seja específico mas sempre recomende verificar com o médico.
${contextInfo}

Responda em português brasileiro.`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos à sua conta." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua solicitação" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Health assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
