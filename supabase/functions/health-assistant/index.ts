import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: 30 requests per user per minute (authenticated)
const userRateLimiter = new Map<string, number[]>();
const USER_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const USER_RATE_LIMIT_MAX_REQUESTS = 30;

function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const requests = userRateLimiter.get(userId) || [];
  const recentRequests = requests.filter(t => now - t < USER_RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= USER_RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  userRateLimiter.set(userId, [...recentRequests, now]);
  
  // Clean up old entries periodically
  if (userRateLimiter.size > 1000) {
    for (const [id, timestamps] of userRateLimiter.entries()) {
      if (timestamps.every(t => now - t > USER_RATE_LIMIT_WINDOW_MS)) {
        userRateLimiter.delete(id);
      }
    }
  }
  
  return true;
}

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

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration is missing");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader! },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    
    // Require authentication for this endpoint
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Apply rate limiting per user
    if (!checkUserRateLimit(user.id)) {
      console.log(`[health-assistant] Rate limit exceeded for user: ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Limite de requisições atingido. Aguarde um momento e tente novamente." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    let contextInfo = "";
    let quickActions: string[] = [];
    
    // Get health profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("birth_date, weight_kg, height_cm, full_name")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      const userName = profile.full_name?.split(' ')[0] || 'usuário';
      contextInfo += `\nNome do usuário: ${userName}`;
      
      if (profile.birth_date) {
        const birthDate = new Date(profile.birth_date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear() - 
          (today.getMonth() < birthDate.getMonth() || 
           (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
        contextInfo += `\nIdade: ${age} anos`;
        
        if (profile.weight_kg && profile.height_cm) {
          const heightM = profile.height_cm / 100;
          const bmi = (profile.weight_kg / (heightM * heightM)).toFixed(1);
          contextInfo += `\nPeso: ${profile.weight_kg}kg | IMC: ${bmi}`;
        }
      }
    }

    // Get medications with stock info
    const { data: medications } = await supabase
      .from("items")
      .select(`
        id, name, dose_text, with_food, category, notes,
        stock(units_left, units_total, projected_end_at)
      `)
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (medications && medications.length > 0) {
      contextInfo += "\n\n📋 MEDICAMENTOS ATIVOS:";
      const lowStockItems: string[] = [];
      
      medications.forEach((med: any) => {
        const stockInfo = med.stock?.[0];
        let stockStatus = "";
        
        if (stockInfo) {
          const daysLeft = stockInfo.projected_end_at 
            ? Math.ceil((new Date(stockInfo.projected_end_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;
          
          if (daysLeft !== null) {
            if (daysLeft <= 5) {
              stockStatus = ` ⚠️ ESTOQUE CRÍTICO (${daysLeft} dias)`;
              lowStockItems.push(med.name);
            } else if (daysLeft <= 15) {
              stockStatus = ` (${daysLeft} dias de estoque)`;
            }
          }
        }
        
        contextInfo += `\n- ${med.name}${med.dose_text ? ` ${med.dose_text}` : ""}${med.category ? ` [${med.category}]` : ""}${stockStatus}`;
      });
      
      if (lowStockItems.length > 0) {
        quickActions.push(`Alertar sobre estoque baixo de: ${lowStockItems.join(", ")}`);
      }
    }

    // Get today's doses
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: todayDoses } = await supabase
      .from("dose_instances")
      .select(`
        id, status, due_at, taken_at,
        items!inner(name, user_id)
      `)
      .eq("items.user_id", user.id)
      .gte("due_at", todayStart.toISOString())
      .lte("due_at", todayEnd.toISOString())
      .order("due_at", { ascending: true });

    if (todayDoses && todayDoses.length > 0) {
      const pending = todayDoses.filter((d: any) => d.status === "scheduled");
      const taken = todayDoses.filter((d: any) => d.status === "taken");
      const missed = todayDoses.filter((d: any) => d.status === "missed");
      const overdue = pending.filter((d: any) => new Date(d.due_at) < new Date());
      
      contextInfo += `\n\n📅 DOSES DE HOJE:`;
      contextInfo += `\n- Total: ${todayDoses.length} doses`;
      contextInfo += `\n- Tomadas: ${taken.length}`;
      contextInfo += `\n- Pendentes: ${pending.length}`;
      if (overdue.length > 0) {
        contextInfo += `\n- ⚠️ ATRASADAS: ${overdue.length}`;
        const overdueNames = overdue.map((d: any) => d.items.name).join(", ");
        quickActions.push(`Lembrar sobre doses atrasadas: ${overdueNames}`);
      }
      if (missed.length > 0) {
        contextInfo += `\n- Perdidas: ${missed.length}`;
      }

      // Next pending dose
      const nextPending = pending.find((d: any) => new Date(d.due_at) > new Date());
      if (nextPending) {
        const nextTime = new Date(nextPending.due_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        contextInfo += `\n- Próxima dose: ${(nextPending as any).items.name} às ${nextTime}`;
      }
    }

    // Get recent adherence stats (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data: recentDoses } = await supabase
      .from("dose_instances")
      .select("status, items!inner(user_id)")
      .eq("items.user_id", user.id)
      .gte("due_at", weekAgo.toISOString());

    if (recentDoses && recentDoses.length > 0) {
      const takenCount = recentDoses.filter((d: any) => d.status === "taken").length;
      const adherenceRate = Math.round((takenCount / recentDoses.length) * 100);
      contextInfo += `\n\n📊 PROGRESSO (7 dias): ${adherenceRate}% (${takenCount}/${recentDoses.length} doses)`;
      
      if (adherenceRate >= 90) {
        quickActions.push("Parabenizar pelo excelente progresso!");
      } else if (adherenceRate < 70) {
        quickActions.push("Oferecer dicas para melhorar a rotina");
      }
    }

    // Get documents count
    const { count: docsCount } = await supabase
      .from("documentos_saude")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id);

    if (docsCount !== null && docsCount > 0) {
      contextInfo += `\n\n📄 DOCUMENTOS: ${docsCount} salvos na Carteira de Saúde`;
    }

    // Get upcoming vaccines
    const { data: upcomingVaccines } = await supabase
      .from("vaccination_records")
      .select("vaccine_name, next_dose_date")
      .eq("user_id", user.id)
      .not("next_dose_date", "is", null)
      .gte("next_dose_date", new Date().toISOString())
      .order("next_dose_date", { ascending: true })
      .limit(3);

    if (upcomingVaccines && upcomingVaccines.length > 0) {
      contextInfo += `\n\n💉 VACINAS PENDENTES:`;
      upcomingVaccines.forEach((v: any) => {
        const date = new Date(v.next_dose_date).toLocaleDateString('pt-BR');
        contextInfo += `\n- ${v.vaccine_name}: ${date}`;
      });
    }

    const systemPrompt = `Você é Clara, a assistente de organização e acompanhamento do HoraMed.

IDENTIDADE:
- Você NÃO é "uma IA". Você é a Clara, a voz humana do sistema HoraMed.
- Seu papel é ajudar usuários a organizar sua rotina de saúde com clareza, empatia e tranquilidade.

REGRAS OBRIGATÓRIAS:
- Nunca julgue o usuário
- Nunca use tom alarmista
- Nunca diga "errou" ou "esqueceu"
- Nunca diagnostique doenças
- Nunca substitua orientação médica

LINGUAGEM:
- Frases simples e diretas
- Respostas curtas (máximo 3-4 frases, a menos que peçam detalhes)
- Tom calmo, adulto e respeitoso
- Sem emojis
- Sem jargão técnico

POSTURA:
- Acompanha, não cobra
- Organiza, não pressiona
- Explica, não manda

CONHECIMENTO DO APP - USE PARA GUIAR O USUÁRIO:
📍 NAVEGAÇÃO:
- "Hoje" (/hoje): Ver doses do dia, atrasadas e pendentes
- "Rotina" (/rotina): Gerenciar medicamentos, suplementos e estoque
- "Progresso" (/progresso): Ver métricas, relatórios e conquistas
- "Carteira de Saúde" (/carteira-saude): Documentos, receitas, exames
- "Perfil" (/perfil): Conta, configurações, indicar amigos

🎯 AÇÕES COMUNS (guie o usuário):
- Adicionar medicamento: "Toque no botão + na aba Rotina"
- Ver estoque: "Em Rotina, toque no medicamento para ver detalhes"
- Registrar peso: "Em Progresso, você encontra o card de peso"
- Adicionar documento: "Na Carteira de Saúde, toque em Adicionar"
- Indicar amigo: "Em Perfil, acesse Indique e Ganhe"

💡 DICAS QUE VOCÊ PODE OFERECER:
- Como organizar horários de medicamentos
- Importância de manter estoque atualizado
- Como usar a Carteira de Saúde
- Como funciona o programa de indicação

CONTEXTO ATUAL DO USUÁRIO:
${contextInfo || "Usuário ainda não tem dados cadastrados."}

${quickActions.length > 0 ? `\nAÇÕES SUGERIDAS PARA ESTE USUÁRIO:\n${quickActions.map(a => `- ${a}`).join('\n')}` : ''}

INSTRUÇÕES ESPECIAIS:
1. Se o usuário perguntar "onde" ou "como" fazer algo, guie-o com passos claros
2. Se houver doses atrasadas, mencione gentilmente
3. Se o estoque estiver baixo, sugira verificar a farmácia
4. Se o progresso estiver bom, parabenize brevemente
5. Para perguntas clínicas, responda e adicione: "Isso não substitui a orientação de um profissional de saúde."

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua solicitação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Health assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
