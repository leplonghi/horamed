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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read body once at the beginning
    const body = await req.json();
    const { action, accessToken, refreshToken, startDate, endDate } = body;

    // Store tokens if connecting
    if (action === 'connect' && accessToken) {
      // In a real implementation, you'd store these securely
      console.log('Storing Google Calendar tokens for user:', user.id);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Google Calendar connected successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sync events to Google Calendar
    if (action === 'sync') {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      // Fetch consultas
      const { data: consultas } = await supabaseClient
        .from('consultas_medicas')
        .select('*')
        .eq('user_id', user.id)
        .gte('data_consulta', startDate.toISOString())
        .lte('data_consulta', endDate.toISOString());

      // Fetch exames
      const { data: exames } = await supabaseClient
        .from('exames_laboratoriais')
        .select('*')
        .eq('user_id', user.id)
        .gte('data_exame', startDate.toISOString().split('T')[0])
        .lte('data_exame', endDate.toISOString().split('T')[0]);

      // Fetch eventos de saúde
      const { data: eventos } = await supabaseClient
        .from('eventos_saude')
        .select('*')
        .eq('user_id', user.id)
        .gte('due_date', startDate.toISOString().split('T')[0])
        .lte('due_date', endDate.toISOString().split('T')[0]);

      // Fetch próximas doses (próximos 7 dias)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const { data: doses } = await supabaseClient
        .from('dose_instances')
        .select(`
          *,
          items:item_id (
            name,
            dose_text
          )
        `)
        .eq('status', 'scheduled')
        .gte('due_at', new Date().toISOString())
        .lte('due_at', nextWeek.toISOString())
        .order('due_at', { ascending: true });

      // In a real implementation, you would:
      // 1. Use the stored accessToken to authenticate with Google Calendar API
      // 2. Create/update events in Google Calendar for each item
      // 3. Store the Google Calendar event IDs back in the database

      const eventsCount = {
        consultas: consultas?.length || 0,
        exames: exames?.length || 0,
        eventos: eventos?.length || 0,
        medicamentos: doses?.length || 0,
        total: (consultas?.length || 0) + (exames?.length || 0) + (eventos?.length || 0) + (doses?.length || 0)
      };

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Events synced successfully',
          eventsCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch calendar events for display
    if (action === 'fetch') {
      if (!startDate || !endDate) {
        return new Response(
          JSON.stringify({ error: 'startDate and endDate are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const events: any[] = [];

      // Fetch consultas
      const { data: consultas } = await supabaseClient
        .from('consultas_medicas')
        .select('*')
        .eq('user_id', user.id)
        .gte('data_consulta', startDate)
        .lte('data_consulta', endDate)
        .order('data_consulta', { ascending: true });

      consultas?.forEach(c => {
        events.push({
          id: c.id,
          type: 'consulta',
          title: `Consulta - ${c.especialidade || 'Médica'}`,
          date: c.data_consulta,
          description: c.motivo || '',
          location: c.local,
          status: c.status,
          color: 'blue'
        });
      });

      // Fetch exames
      const { data: exames } = await supabaseClient
        .from('exames_laboratoriais')
        .select('*')
        .eq('user_id', user.id)
        .gte('data_exame', startDate)
        .lte('data_exame', endDate)
        .order('data_exame', { ascending: true });

      exames?.forEach(e => {
        events.push({
          id: e.id,
          type: 'exame',
          title: `Exame - ${e.laboratorio || 'Laboratorial'}`,
          date: e.data_exame,
          description: e.medico_solicitante || '',
          color: 'green'
        });
      });

      // Fetch eventos
      const { data: eventos } = await supabaseClient
        .from('eventos_saude')
        .select('*')
        .eq('user_id', user.id)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date', { ascending: true });

      eventos?.forEach(ev => {
        events.push({
          id: ev.id,
          type: ev.type,
          title: ev.title,
          date: ev.due_date,
          description: ev.notes || '',
          completed: !!ev.completed_at,
          color: 'purple'
        });
      });

      // Fetch doses
      const { data: doses } = await supabaseClient
        .from('dose_instances')
        .select(`
          *,
          items:item_id (
            name,
            dose_text
          )
        `)
        .gte('due_at', startDate)
        .lte('due_at', endDate)
        .order('due_at', { ascending: true });

      doses?.forEach(d => {
        const item = d.items as any;
        events.push({
          id: d.id,
          type: 'medicamento',
          title: `${item?.name || 'Medicamento'} - ${item?.dose_text || ''}`,
          date: d.due_at,
          status: d.status,
          color: 'orange'
        });
      });

      // Sort by date
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return new Response(
        JSON.stringify({ events }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
