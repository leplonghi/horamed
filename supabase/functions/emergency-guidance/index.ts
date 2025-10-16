import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { medicationName, missedDoses, timeSinceMissed, userLocation } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Buscar orientação com IA
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
            content: 'Você é um farmacêutico especializado em orientações de emergência. Forneça orientações PRÁTICAS, CLARAS e SEGURAS. SEMPRE recomende consultar um médico em caso de dúvida. Seja DIRETO e evite termos muito técnicos.'
          },
          {
            role: 'user',
            content: `EMERGÊNCIA: Paciente esqueceu ${missedDoses} dose(s) de ${medicationName}. Última dose há ${timeSinceMissed}. O que fazer AGORA? Forneça: 1) Ação imediata 2) Quando tomar a próxima 3) Sinais de alerta 4) Quando procurar emergência. Seja OBJETIVO.`
          }
        ],
        temperature: 0.3,
      }),
    });

    let guidance = '';
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      guidance = aiData.choices?.[0]?.message?.content || 'Não foi possível obter orientação. Consulte seu médico imediatamente.';
    } else {
      guidance = 'Não foi possível obter orientação automática. Em caso de dúvida sobre doses perdidas, consulte seu médico ou farmacêutico.';
    }

    // Simular farmácias 24h próximas (em produção, usar API de geolocalização real)
    const nearbyPharmacies = [
      { name: 'Drogasil 24h - Centro', address: 'Av. Principal, 123', distance: 0.8, phone: '(11) 3000-0000', open24h: true },
      { name: 'Droga Raia 24h', address: 'Rua das Flores, 456', distance: 1.2, phone: '(11) 3000-0001', open24h: true },
      { name: 'Pacheco Plantão', address: 'Av. Central, 789', distance: 2.5, phone: '(11) 3000-0002', open24h: true },
    ].sort((a, b) => a.distance - b.distance);

    return new Response(JSON.stringify({
      guidance,
      medication: medicationName,
      missedDoses,
      timeSinceMissed,
      nearbyPharmacies,
      emergencyContacts: [
        { name: 'SAMU', phone: '192' },
        { name: 'Bombeiros', phone: '193' },
        { name: 'Centro de Intoxicações', phone: '0800 722 6001' },
      ]
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
