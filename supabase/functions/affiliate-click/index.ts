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
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      userId = user?.id || null;
    }

    const { medication_id, medication_name } = await req.json();

    // Buscar afiliado ativo (por enquanto pega o primeiro)
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('enabled', true)
      .limit(1)
      .single();

    if (!affiliate) {
      throw new Error('No affiliate configured');
    }

    // Construir URL com UTM
    const searchQuery = encodeURIComponent(medication_name || 'medicamentos');
    const utmParams = new URLSearchParams({
      utm_source: affiliate.utm_source,
      utm_medium: 'app',
      utm_campaign: 'restock',
      utm_content: medication_id || 'general'
    });

    const affiliateUrl = `${affiliate.base_url}?q=${searchQuery}&${utmParams.toString()}`;

    // Registrar evento
    await supabase.from('affiliate_events').insert({
      user_id: userId,
      affiliate_id: affiliate.id,
      medication_id: medication_id || null,
      event_type: 'click',
      utm_params: Object.fromEntries(utmParams)
    });

    // Registrar métrica
    if (userId) {
      await supabase.from('app_metrics').insert({
        user_id: userId,
        event_name: 'affiliate_clicked',
        event_data: { 
          affiliate_name: affiliate.name,
          medication_id,
          medication_name 
        }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      url: affiliateUrl 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
