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

    // Buscar histórico de doses dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: doseHistory } = await supabaseClient
      .from('dose_instances')
      .select(`
        *,
        items!inner(name, category)
      `)
      .eq('items.user_id', user.id)
      .gte('due_at', thirtyDaysAgo.toISOString())
      .order('due_at', { ascending: false });

    if (!doseHistory || doseHistory.length === 0) {
      return new Response(JSON.stringify({ 
        insights: [],
        message: 'Dados insuficientes para análise' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const insights: any[] = [];

    // Análise de padrões de adesão
    const adherenceByDay: { [key: string]: { total: number; taken: number } } = {};
    
    doseHistory.forEach(dose => {
      const dayOfWeek = new Date(dose.due_at).toLocaleDateString('pt-BR', { weekday: 'long' });
      if (!adherenceByDay[dayOfWeek]) {
        adherenceByDay[dayOfWeek] = { total: 0, taken: 0 };
      }
      adherenceByDay[dayOfWeek].total++;
      if (dose.status === 'taken') adherenceByDay[dayOfWeek].taken++;
    });

    // Identificar dias com baixa adesão
    Object.entries(adherenceByDay).forEach(([day, stats]) => {
      const rate = stats.taken / stats.total;
      if (rate < 0.7 && stats.total >= 5) {
        insights.push({
          type: 'adherence_pattern',
          severity: rate < 0.5 ? 'critical' : 'warning',
          title: `Baixa adesão às ${day}s`,
          description: `Você esquece medicação em ${Math.round((1 - rate) * 100)}% das vezes às ${day}s`,
          recommendation: `Configure alarmes adicionais para ${day}s ou ajuste horários`,
          metadata: {
            day,
            rate: Math.round(rate * 100),
            total: stats.total
          }
        });
      }
    });

    // Análise de horários problemáticos
    const hourlyAdherence: { [key: number]: { total: number; taken: number } } = {};
    
    doseHistory.forEach(dose => {
      const hour = new Date(dose.due_at).getHours();
      if (!hourlyAdherence[hour]) {
        hourlyAdherence[hour] = { total: 0, taken: 0 };
      }
      hourlyAdherence[hour].total++;
      if (dose.status === 'taken') hourlyAdherence[hour].taken++;
    });

    Object.entries(hourlyAdherence).forEach(([hour, stats]) => {
      const rate = stats.taken / stats.total;
      if (rate < 0.6 && stats.total >= 3) {
        insights.push({
          type: 'adherence_pattern',
          severity: 'warning',
          title: `Horário problemático: ${hour}h`,
          description: `Taxa de adesão de apenas ${Math.round(rate * 100)}% às ${hour}h`,
          recommendation: `Considere mudar medicações das ${hour}h para outro horário`,
          metadata: {
            hour: parseInt(hour),
            rate: Math.round(rate * 100)
          }
        });
      }
    });

    // Análise com IA para insights mais profundos
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (LOVABLE_API_KEY && insights.length > 0) {
      const summaryData = {
        totalDoses: doseHistory.length,
        takenDoses: doseHistory.filter(d => d.status === 'taken').length,
        patterns: insights.map(i => ({
          type: i.type,
          title: i.title,
          description: i.description
        }))
      };

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
              content: 'Você é um analista de saúde especializado em adesão a tratamentos. Seja DIRETO, PRÁTICO e MOTIVADOR.'
            },
            {
              role: 'user',
              content: `Com base nestes dados: ${JSON.stringify(summaryData)}. Forneça 1-2 insights PRÁTICOS e ACIONÁVEIS para melhorar adesão. Retorne em formato JSON com array contendo: severity (info), title, description, recommendation.`
            }
          ],
          temperature: 0.7,
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
                type: 'predictive_alert'
              })));
            }
          } catch (e) {
            console.error('Failed to parse AI response:', e);
          }
        }
      }
    }

    // Salvar insights
    for (const insight of insights) {
      await supabaseClient
        .from('health_insights')
        .insert({
          user_id: user.id,
          insight_type: insight.type,
          title: insight.title,
          description: insight.description,
          severity: insight.severity,
          metadata: insight.metadata || {}
        });
    }

    return new Response(JSON.stringify({ 
      insights,
      total: insights.length,
      adherenceRate: Math.round((doseHistory.filter(d => d.status === 'taken').length / doseHistory.length) * 100)
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