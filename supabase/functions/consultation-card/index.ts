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
    const { action, token, profile_id, hours = 48 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'create') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Missing authorization header');

      const { data: { user }, error: userError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (userError || !user) throw new Error('Unauthorized');

      const cardToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

      const { data: card, error: cardError } = await supabase
        .from('consultation_cards')
        .insert({
          user_id: user.id,
          profile_id: profile_id || null,
          token: cardToken,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (cardError) throw cardError;

      const cardUrl = `${req.headers.get('origin')}/consulta/${cardToken}`;

      // Log metric
      await supabase.from('app_metrics').insert({
        user_id: user.id,
        event_name: 'consultation_qr_created',
        event_data: { profile_id, hours }
      });

      return new Response(JSON.stringify({ 
        success: true, 
        cardUrl,
        expiresAt,
        token: cardToken
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'view') {
      // Visualizar cartão (público)
      const { data: card, error: cardError } = await supabase
        .from('consultation_cards')
        .select('*')
        .eq('token', token)
        .is('revoked_at', null)
        .single();

      if (cardError || !card) throw new Error('Card not found');

      if (new Date(card.expires_at) < new Date()) {
        throw new Error('Card expired');
      }

      // Incrementar views
      await supabase
        .from('consultation_cards')
        .update({ views_count: card.views_count + 1 })
        .eq('id', card.id);

      // Buscar medicamentos ativos
      const { data: medications } = await supabase
        .from('items')
        .select('id, name, dose_text, category, notes')
        .eq('user_id', card.user_id)
        .eq('is_active', true)
        .eq('profile_id', card.profile_id || null);

      // Calcular adesão última semana
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const medicationIds = medications?.map(m => m.id) || [];
      
      let doses: any[] = [];
      if (medicationIds.length > 0) {
        const { data: dosesData } = await supabase
          .from('dose_instances')
          .select('status, item_id')
          .gte('due_at', weekAgo.toISOString())
          .in('item_id', medicationIds);
        doses = dosesData || [];
      }

      const takenCount = doses.filter(d => d.status === 'taken').length || 0;
      const totalCount = doses.length || 1;
      const adherence = Math.round((takenCount / totalCount) * 100);

      // Buscar documentos válidos
      const { data: documents } = await supabase
        .from('documentos_saude')
        .select('title, categoria_id, issued_at, expires_at')
        .eq('user_id', card.user_id)
        .eq('profile_id', card.profile_id || null)
        .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString());

      // Log metric
      await supabase.from('app_metrics').insert({
        user_id: card.user_id,
        event_name: 'consultation_qr_viewed',
        event_data: { card_id: card.id }
      });

      return new Response(JSON.stringify({
        success: true,
        data: {
          medications: medications || [],
          adherence,
          documents: documents || [],
          expiresAt: card.expires_at
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'revoke') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Missing authorization header');

      const { data: { user }, error: userError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (userError || !user) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('consultation_cards')
        .update({ revoked_at: new Date().toISOString() })
        .eq('token', token)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
