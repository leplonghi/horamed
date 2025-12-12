import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const whatsappSchema = z.object({
  phoneNumber: z.string().min(10).max(20).regex(/^[\d+\-\s()]+$/, "Invalid phone number format"),
  message: z.string().min(1).max(4096),
  instanceName: z.string().min(1).max(100),
});

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

    // Validate input
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = whatsappSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      console.error('[SEND-WHATSAPP] Validation error:', parseResult.error.message);
      return new Response(
        JSON.stringify({ error: 'Invalid request data', details: parseResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phoneNumber, message, instanceName } = parseResult.data;

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      throw new Error('Evolution API credentials not configured');
    }

    // Format phone number to international format (remove special characters)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    console.log('Sending WhatsApp message via Evolution API:', {
      instance: instanceName,
      phone: formattedPhone,
      messageLength: message.length
    });

    // Send via Evolution API
    const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API error:', errorText);
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Log delivery metric
    await supabaseClient.from('notification_metrics').insert({
      user_id: user.id,
      notification_type: 'whatsapp',
      delivery_status: 'sent',
      metadata: {
        message_id: result.key?.id,
        phone: formattedPhone,
        instance: instanceName,
      },
    });

    console.log('WhatsApp sent successfully via Evolution API:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.key?.id,
        remoteJid: result.key?.remoteJid
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Try to log error metric
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