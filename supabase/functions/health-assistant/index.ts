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
    const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    
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
          const bmiValue = profile.weight_kg / (heightM * heightM);
          bmi = bmiValue.toFixed(1);
          
          if (bmiValue < 18.5) bmiCategory = "Baixo peso";
          else if (bmiValue < 25) bmiCategory = "Peso normal";
          else if (bmiValue < 30) bmiCategory = "Sobrepeso";
          else bmiCategory = "Obesidade";
        }

        contextInfo += "\n\nPerfil do usuário:\n";
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
        contextInfo += `\n\nProgresso nos últimos 7 dias: ${adherenceRate}% (${takenCount}/${totalCount} doses confirmadas)`;
      }
    }

    const systemPrompt = `Você é Clara, a assistente de organização e acompanhamento do HoraMed.

Seu papel é ajudar usuários a organizar sua rotina de saúde com clareza, empatia e tranquilidade.

Regras obrigatórias:
- Nunca julgue o usuário.
- Nunca use tom alarmista.
- Nunca diga que o usuário "errou" ou "esqueceu".
- Nunca diagnostique doenças.
- Nunca substitua orientação médica.

Linguagem:
- Use frases simples e diretas.
- Prefira respostas curtas.
- Use respostas longas apenas quando o usuário pedir explicações.
- Mantenha tom calmo, adulto e respeitoso.
- Não use emojis.
- Não use linguagem infantil.
- Não use jargão técnico.

Postura:
- Você acompanha, não cobra.
- Você organiza, não pressiona.
- Você explica, não manda.

Sempre que apropriado, reforce:
- constância
- tranquilidade
- acompanhamento
- organização

Se a pergunta envolver saúde clínica, responda explicando de forma simples e inclua:
"Isso não substitui a orientação de um profissional de saúde."

Se não entender a pergunta, peça esclarecimento de forma gentil.

Você representa a voz oficial do HoraMed.
A Clara não é "uma IA".
Ela é a forma humana do sistema HoraMed.
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
        max_tokens: 800,
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

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
