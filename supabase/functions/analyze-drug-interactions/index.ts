import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) throw new Error('Not authenticated');

    // Buscar medicamentos ativos do usuário
    const { data: items } = await supabaseClient
      .from('items')
      .select('id, name, category')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ 
        insights: [],
        message: 'Nenhum medicamento ativo encontrado' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const insights = [];

    // Verificar interações conhecidas no banco
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const { data: interactions } = await supabaseClient
          .from('drug_interactions')
          .select('*')
          .or(`and(drug_a.ilike.%${items[i].name}%,drug_b.ilike.%${items[j].name}%),and(drug_a.ilike.%${items[j].name}%,drug_b.ilike.%${items[i].name}%)`);

        if (interactions && interactions.length > 0) {
          for (const interaction of interactions) {
            insights.push({
              type: 'drug_interaction',
              severity: interaction.interaction_type === 'major' ? 'critical' : 'warning',
              title: `Interação detectada: ${items[i].name} + ${items[j].name}`,
              description: interaction.description,
              recommendation: interaction.recommendation,
              medications: [items[i].name, items[j].name]
            });
          }
        }
      }
    }

    // Se houver muitos medicamentos, usar IA para análise mais profunda
    if (items.length >= 3 && !insights.length) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (LOVABLE_API_KEY) {
        const medicationList = items.map(i => i.name).join(', ');
        
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'Você é um farmacêutico especializado em interações medicamentosas. Analise os medicamentos e identifique possíveis interações PERIGOSAS. Seja DIRETO e PRÁTICO. Retorne apenas se houver riscos REAIS e IMPORTANTES.'
              },
              {
                role: 'user',
                content: `Analise estas medicações e identifique APENAS interações CRÍTICAS ou IMPORTANTES: ${medicationList}. Retorne em formato JSON com array de objetos contendo: severity (critical/warning/info), title, description, recommendation, medications (array).`
              }
            ],
            temperature: 0.3,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiContent = aiData.choices?.[0]?.message?.content;
          
          if (aiContent) {
            try {
              const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                const aiInsights = JSON.parse(jsonMatch[0]);
                insights.push(...aiInsights.map((i: any) => ({
                  ...i,
                  type: 'drug_interaction'
                })));
              }
            } catch (e) {
              console.error('Failed to parse AI response:', e);
            }
          }
        }
      }
    }

    // Salvar insights no banco
    for (const insight of insights) {
      await supabaseClient
        .from('health_insights')
        .insert({
          user_id: user.id,
          insight_type: 'drug_interaction',
          title: insight.title,
          description: insight.description,
          severity: insight.severity,
          metadata: {
            recommendation: insight.recommendation,
            medications: insight.medications
          }
        });
    }

    return new Response(JSON.stringify({ 
      insights,
      total: insights.length,
      message: insights.length > 0 
        ? `${insights.length} interação(ões) detectada(s)` 
        : 'Nenhuma interação perigosa detectada'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});