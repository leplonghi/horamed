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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { action, email_or_phone, role, token } = await req.json();

    if (action === 'create') {
      // Criar convite
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      const { data: caregiver, error: caregiverError } = await supabase
        .from('caregivers')
        .insert({
          user_id_owner: user.id,
          email_or_phone,
          role: role || 'viewer'
        })
        .select()
        .single();

      if (caregiverError) throw caregiverError;

      const { data: link, error: linkError } = await supabase
        .from('caregiver_links')
        .insert({
          user_id_owner: user.id,
          token: inviteToken,
          expires_at: expiresAt.toISOString(),
          metadata: { caregiver_id: caregiver.id }
        })
        .select()
        .single();

      if (linkError) throw linkError;

      const inviteUrl = `${req.headers.get('origin')}/cuidador/aceitar/${inviteToken}`;

      return new Response(JSON.stringify({ 
        success: true, 
        inviteUrl,
        expiresAt 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'accept') {
      // Aceitar convite
      const { data: link, error: linkError } = await supabase
        .from('caregiver_links')
        .select('*')
        .eq('token', token)
        .is('revoked_at', null)
        .single();

      if (linkError || !link) throw new Error('Invalid or expired link');

      if (new Date(link.expires_at) < new Date()) {
        throw new Error('Link expired');
      }

      const { error: updateError } = await supabase
        .from('caregivers')
        .update({ 
          caregiver_user_id: user.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', link.metadata.caregiver_id);

      if (updateError) throw updateError;

      // Revogar link após aceite
      await supabase
        .from('caregiver_links')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', link.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list') {
      // Listar cuidadores
      const { data: caregivers, error } = await supabase
        .from('caregivers')
        .select('*')
        .eq('user_id_owner', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ caregivers }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'revoke') {
      const { caregiver_id } = await req.json();
      
      const { error } = await supabase
        .from('caregivers')
        .delete()
        .eq('id', caregiver_id)
        .eq('user_id_owner', user.id);

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
