import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  token: z.string().min(1).max(255),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsed = requestSchema.safeParse(await req.json());

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request', details: parsed.error.issues }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { token } = parsed.data;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar compartilhamento
    const { data: share, error: shareError } = await supabaseAdmin
      .from('medical_shares')
      .select('*')
      .eq('token', token)
      .is('revoked_at', null)
      .single();

    if (shareError || !share) {
      return new Response(JSON.stringify({ error: 'Invalid or expired link' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar expiração
    if (new Date(share.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Link expired' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Incrementar views
    await supabaseAdmin
      .from('medical_shares')
      .update({ views_count: (share.views_count || 0) + 1 })
      .eq('id', share.id);

    // Buscar dados do usuário
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', share.user_id)
      .single();

    // Buscar medicamentos
    const { data: items } = await supabaseAdmin
      .from('items')
      .select(`
        *,
        schedules(*)
      `)
      .eq('user_id', share.user_id)
      .eq('is_active', true);

    // Buscar consultas
    const { data: consultas } = await supabaseAdmin
      .from('consultas_medicas')
      .select('*')
      .eq('user_id', share.user_id)
      .order('data_consulta', { ascending: false })
      .limit(20);

    // Buscar exames
    const { data: exames } = await supabaseAdmin
      .from('exames_laboratoriais')
      .select(`
        *,
        valores_exames(*)
      `)
      .eq('user_id', share.user_id)
      .order('data_exame', { ascending: false })
      .limit(20);

    // Buscar documentos
    const { data: documentos } = await supabaseAdmin
      .from('documentos_saude')
      .select('*, categorias_saude(label)')
      .eq('user_id', share.user_id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Buscar sinais vitais
    const { data: sinais } = await supabaseAdmin
      .from('sinais_vitais')
      .select('*')
      .eq('user_id', share.user_id)
      .order('data_medicao', { ascending: false })
      .limit(50);

    // Buscar doses (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: doses } = await supabaseAdmin
      .from('dose_instances')
      .select(`
        *,
        items(name)
      `)
      .in('item_id', (items || []).map(i => i.id))
      .gte('due_at', thirtyDaysAgo.toISOString())
      .order('due_at', { ascending: false });

    return new Response(JSON.stringify({
      share: {
        created_at: share.created_at,
        expires_at: share.expires_at
      },
      profile,
      medicamentos: items,
      consultas,
      exames,
      documentos,
      sinais_vitais: sinais,
      aderencia: doses
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
