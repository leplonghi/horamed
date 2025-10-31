import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { phoneNumber, message, instanceId, apiToken } = await req.json();

    if (!phoneNumber || !message || !instanceId || !apiToken) {
      throw new Error('Missing required fields');
    }

    // Formatar número para padrão internacional (remover caracteres especiais)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    // Enviar via Green API
    const greenApiUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;
    
    const response = await fetch(greenApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: `${formattedPhone}@c.us`,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Green API error:', errorText);
      throw new Error(`Green API error: ${response.status}`);
    }

    const result = await response.json();

    // Registrar métrica de entrega
    await supabaseClient.from('notification_metrics').insert({
      user_id: user.id,
      notification_type: 'whatsapp',
      delivery_status: 'sent',
      metadata: {
        message_id: result.idMessage,
        phone: formattedPhone,
      },
    });

    console.log('WhatsApp sent successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.idMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Tentar registrar métrica de erro
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        
        if (user) {
          await supabaseClient.from('notification_metrics').insert({
            user_id: user.id,
            notification_type: 'whatsapp',
            delivery_status: 'failed',
            error_message: errorMessage,
          });
        }
      }
    } catch (metricError) {
      console.error('Failed to log error metric:', metricError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
