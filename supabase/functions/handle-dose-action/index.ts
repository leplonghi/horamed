import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  doseId: z.string().uuid({ message: 'ID da dose inválido' }),
  action: z.enum(['taken', 'snooze', 'skip'], { 
    invalid_type_error: 'Ação inválida. Use: taken, snooze ou skip' 
  }),
  timestamp: z.string().datetime().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.issues[0].message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { doseId, action, timestamp } = parsed.data;

    // Use service role for internal operations but verify ownership
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing dose action:', { doseId, action, userId: user.id, timestamp });

    // Get dose details and verify ownership
    const { data: dose, error: doseError } = await supabaseAdmin
      .from('dose_instances')
      .select(`
        id,
        due_at,
        item_id,
        items!inner (
          user_id,
          name
        )
      `)
      .eq('id', doseId)
      .single();

    if (doseError || !dose) {
      console.error('Dose not found:', doseError);
      return new Response(
        JSON.stringify({ error: 'Dose não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const itemData = Array.isArray(dose.items) ? dose.items[0] : dose.items;

    // Critical security check: verify dose belongs to authenticated user
    if (itemData.user_id !== user.id) {
      console.warn('Unauthorized dose access attempt:', { userId: user.id, doseOwnerId: itemData.user_id });
      return new Response(
        JSON.stringify({ error: 'Dose não encontrada' }), // Use 404 to prevent enumeration
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'taken') {
      // Mark dose as taken
      const takenAt = timestamp ? new Date(timestamp) : new Date();
      const dueAt = new Date(dose.due_at);
      const delayMinutes = Math.round((takenAt.getTime() - dueAt.getTime()) / 60000);
      
      const { error: updateError } = await supabaseAdmin
        .from('dose_instances')
        .update({
          status: 'taken',
          taken_at: takenAt.toISOString(),
          delay_minutes: delayMinutes,
        })
        .eq('id', doseId);

      if (updateError) {
        console.error('Error updating dose:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to mark dose as taken' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // AUTOMATIC STOCK DEDUCTION WITH PROJECTION RECALCULATION
      // Get stock for this item
      const { data: stockData, error: stockError } = await supabaseAdmin
        .from('stock')
        .select('id, units_left, consumption_history')
        .eq('item_id', dose.item_id)
        .maybeSingle();

      if (!stockError && stockData && stockData.units_left > 0) {
        const newUnitsLeft = Math.max(0, stockData.units_left - 1);
        
        // Add to consumption history
        const consumptionHistory = stockData.consumption_history || [];
        consumptionHistory.push({
          date: takenAt.toISOString(),
          amount: 1,
          reason: 'taken'
        });

        // Calculate projected end date based on consumption
        let projectedEndAt: string | null = null;
        if (newUnitsLeft > 0) {
          // Get daily consumption from last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { count: takenDoses } = await supabaseAdmin
            .from('dose_instances')
            .select('*', { count: 'exact', head: true })
            .eq('item_id', dose.item_id)
            .eq('status', 'taken')
            .gte('taken_at', sevenDaysAgo.toISOString());

          const dailyConsumption = Math.max((takenDoses || 1) / 7, 0.1);
          const daysRemaining = newUnitsLeft / dailyConsumption;
          const projectedEnd = new Date();
          projectedEnd.setDate(projectedEnd.getDate() + daysRemaining);
          projectedEndAt = projectedEnd.toISOString();
        } else {
          projectedEndAt = new Date().toISOString();
        }

        // Update stock with new values and projected end
        await supabaseAdmin
          .from('stock')
          .update({
            units_left: newUnitsLeft,
            consumption_history: consumptionHistory,
            projected_end_at: projectedEndAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', stockData.id);

        console.log(`Stock updated: ${stockData.units_left} -> ${newUnitsLeft}, projected end: ${projectedEndAt}`);
      }

      // Calculate streak
      const { data: streakData } = await supabaseAdmin
        .from('dose_instances')
        .select('due_at, status')
        .eq('item_id', dose.item_id)
        .order('due_at', { ascending: false })
        .limit(30);

      let currentStreak = 0;
      if (streakData) {
        for (const d of streakData) {
          if (d.status === 'taken') currentStreak++;
          else break;
        }
      }

      console.log('Dose marked as taken, streak:', currentStreak);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `✅ ${itemData.name} tomado!`,
          streak: currentStreak,
          medicationName: itemData.name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else if (action === 'skip') {
      // Skip dose
      const { error: updateError } = await supabaseAdmin
        .from('dose_instances')
        .update({
          status: 'skipped',
          skip_reason: 'user_skip',
        })
        .eq('id', doseId);

      if (updateError) {
        console.error('Error skipping dose:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to skip dose' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Dose skipped');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `→ ${itemData.name} pulado`,
          medicationName: itemData.name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'snooze') {
      // Snooze dose by 15 minutes
      const newDueAt = new Date(new Date(dose.due_at).getTime() + 15 * 60 * 1000);
      
      const { error: updateError } = await supabaseAdmin
        .from('dose_instances')
        .update({
          due_at: newDueAt.toISOString(),
        })
        .eq('id', doseId);

      if (updateError) {
        console.error('Error snoozing dose:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to snooze dose' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Dose snoozed to:', newDueAt);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '⏰ Lembrete adiado para daqui 15 minutos',
          newDueAt: newDueAt.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in handle-dose-action:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
