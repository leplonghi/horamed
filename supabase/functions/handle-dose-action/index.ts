import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DoseActionRequest {
  doseId: string;
  action: 'taken' | 'snooze';
  userId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: DoseActionRequest = await req.json();
    const { doseId, action, userId } = body;

    console.log('Processing dose action:', { doseId, action, userId });

    // Get dose details
    const { data: dose, error: doseError } = await supabaseAdmin
      .from('dose_instances')
      .select(`
        id,
        due_at,
        item_id,
        items!inner (
          user_id,
          name,
          current_stock,
          dose_per_take
        )
      `)
      .eq('id', doseId)
      .single();

    if (doseError || !dose) {
      console.error('Dose not found:', doseError);
      return new Response(
        JSON.stringify({ error: 'Dose not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const itemData = Array.isArray(dose.items) ? dose.items[0] : dose.items;

    if (action === 'taken') {
      // Mark dose as taken
      const { error: updateError } = await supabaseAdmin
        .from('dose_instances')
        .update({
          status: 'taken',
          taken_at: new Date().toISOString(),
        })
        .eq('id', doseId);

      if (updateError) {
        console.error('Error updating dose:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to mark dose as taken' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update stock if needed
      if (itemData.current_stock !== null && itemData.dose_per_take) {
        const newStock = Math.max(0, itemData.current_stock - itemData.dose_per_take);
        await supabaseAdmin
          .from('items')
          .update({ current_stock: newStock })
          .eq('id', dose.item_id);
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
