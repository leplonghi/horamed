import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditLogRequest {
  action: string;
  resource: string;
  resource_id?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: AuditLogRequest = await req.json();

    // Validate input
    if (!body.action || body.action.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.resource || body.resource.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid resource' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to bypass RLS and insert audit log
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract and validate IP address
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    
    console.log('IP headers:', { forwardedFor, realIP });
    
    // Get first IP from x-forwarded-for chain
    let clientIP: string | null = null;
    if (forwardedFor) {
      const firstIP = forwardedFor.split(',')[0].trim();
      // Validate IP format (basic IPv4/IPv6 check)
      if (/^[\d.:a-fA-F]+$/.test(firstIP) && firstIP.length <= 45) {
        clientIP = firstIP;
      }
    } else if (realIP && /^[\d.:a-fA-F]+$/.test(realIP) && realIP.length <= 45) {
      clientIP = realIP;
    }
    
    console.log('Using IP:', clientIP || 'null');

    const { error: insertError } = await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: body.action,
      resource: body.resource,
      resource_id: body.resource_id || null,
      metadata: body.metadata || {},
      ip_address: clientIP, // Will be null if invalid
      user_agent: req.headers.get('user-agent') || null,
    });

    if (insertError) {
      console.error('Failed to insert audit log:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to log action' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Audit log error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
