import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  token: z.string().min(1).max(255),
});

// Simple in-memory rate limiter (10 requests per IP per hour for medical data)
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(clientIP) || [];
  const recentRequests = requests.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  rateLimiter.set(clientIP, [...recentRequests, now]);
  
  // Clean up old entries periodically
  if (rateLimiter.size > 1000) {
    for (const [ip, timestamps] of rateLimiter.entries()) {
      if (timestamps.every(t => now - t > RATE_LIMIT_WINDOW_MS)) {
        rateLimiter.delete(ip);
      }
    }
  }
  
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIP)) {
      console.log(`[visualizar-historico] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const parsed = requestSchema.safeParse(await req.json());

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request', details: parsed.error.issues }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { token } = parsed.data;
    const userAgent = req.headers.get('user-agent') || 'unknown';

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
      // Log failed access attempt
      console.log(`[visualizar-historico] Invalid token attempt from IP: ${clientIP}`);
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

    // Log access attempt to audit_logs for security tracking
    await supabaseAdmin.from('audit_logs').insert({
      user_id: share.user_id,
      action: 'medical_share_accessed',
      resource: 'medical_shares',
      resource_id: share.id,
      ip_address: clientIP !== 'unknown' ? clientIP : null,
      user_agent: userAgent,
      metadata: {
        token_id: share.id,
        access_count: (share.views_count || 0) + 1,
        profile_id: share.profile_id
      }
    });

    // Incrementar views
    await supabaseAdmin
      .from('medical_shares')
      .update({ views_count: (share.views_count || 0) + 1 })
      .eq('id', share.id);

    // Buscar dados do usuário (limit sensitive fields)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, nickname, avatar_url, birth_date')
      .eq('user_id', share.user_id)
      .single();

    // Buscar medicamentos
    const { data: items } = await supabaseAdmin
      .from('items')
      .select(`
        id, name, dose_text, category, notes, with_food,
        schedules(id, times, freq_type, days_of_week)
      `)
      .eq('user_id', share.user_id)
      .eq('is_active', true);

    // Buscar consultas (últimos 90 dias apenas)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data: consultas } = await supabaseAdmin
      .from('consultas_medicas')
      .select('id, data_consulta, especialidade, medico_nome, local, status')
      .eq('user_id', share.user_id)
      .gte('data_consulta', ninetyDaysAgo.toISOString())
      .order('data_consulta', { ascending: false })
      .limit(10);

    // Buscar exames (últimos 90 dias)
    const { data: exames } = await supabaseAdmin
      .from('exames_laboratoriais')
      .select(`
        id, data_exame, laboratorio,
        valores_exames(parametro, valor, unidade, status)
      `)
      .eq('user_id', share.user_id)
      .gte('data_exame', ninetyDaysAgo.toISOString())
      .order('data_exame', { ascending: false })
      .limit(10);

    // Buscar documentos (metadata only, no file paths for security)
    const { data: documentos } = await supabaseAdmin
      .from('documentos_saude')
      .select('id, title, issued_at, provider, categorias_saude(label)')
      .eq('user_id', share.user_id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Buscar sinais vitais (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: sinais } = await supabaseAdmin
      .from('sinais_vitais')
      .select('id, data_medicao, pressao_sistolica, pressao_diastolica, frequencia_cardiaca, peso_kg, glicemia')
      .eq('user_id', share.user_id)
      .gte('data_medicao', thirtyDaysAgo.toISOString())
      .order('data_medicao', { ascending: false })
      .limit(20);

    // Buscar doses (últimos 14 dias only for adherence summary)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: doses } = await supabaseAdmin
      .from('dose_instances')
      .select('id, due_at, status, taken_at, items(name)')
      .in('item_id', (items || []).map(i => i.id))
      .gte('due_at', fourteenDaysAgo.toISOString())
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
