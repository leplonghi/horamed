import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication: either user auth or cron secret
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('X-Cron-Secret');
    
    if (authHeader) {
      // Manual call - verify user authentication
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
    } else if (cronSecret !== Deno.env.get('CRON_SECRET')) {
      // Automated call - require valid cron secret
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all scheduled doses for the next 24 hours
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: doses, error: dosesError } = await supabaseAdmin
      .from('dose_instances')
      .select(`
        id,
        due_at,
        status,
        item_id,
        items!inner (
          user_id,
          name,
          dose_text,
          with_food
        )
      `)
      .eq('status', 'scheduled')
      .gte('due_at', now.toISOString())
      .lte('due_at', next24h.toISOString());

    if (dosesError) {
      console.error('Error fetching doses:', dosesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch doses' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!doses || doses.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No doses to schedule',
          scheduled: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get users with push notifications enabled
    const userIds = [...new Set(doses.map(d => {
      const itemData = Array.isArray(d.items) ? d.items[0] : d.items;
      return itemData.user_id;
    }))];
    const { data: preferences } = await supabaseAdmin
      .from('notification_preferences')
      .select('user_id, push_enabled, push_token')
      .in('user_id', userIds)
      .eq('push_enabled', true);

    const enabledUsers = new Set(
      preferences?.filter(p => p.push_token).map(p => p.user_id) || []
    );

    let scheduledCount = 0;
    const notifications = [];

    for (const dose of doses) {
      const itemData = Array.isArray(dose.items) ? dose.items[0] : dose.items;
      if (!enabledUsers.has(itemData.user_id)) {
        continue;
      }

      const dueTime = new Date(dose.due_at);
      const minutesUntil = Math.round((dueTime.getTime() - now.getTime()) / 60000);

      // Schedule notifications at: 15 min before, 5 min before, and at dose time
      const notificationTimes = [
        { offset: 15, title: '⏰ Lembrete: Remédio em 15 minutos' },
        { offset: 5, title: '⏰ Lembrete: Remédio em 5 minutos' },
        { offset: 0, title: '⏰ Hora do remédio!' },
      ];

      for (const { offset, title } of notificationTimes) {
        const notificationTime = new Date(dueTime.getTime() - offset * 60000);
        
        // Only schedule future notifications
        if (notificationTime > now) {
          const body = `${itemData.name}${
            itemData.dose_text ? ` - ${itemData.dose_text}` : ''
          }${itemData.with_food ? ' 🍽️ Com alimentos' : ''}`;

          notifications.push({
            user_id: itemData.user_id,
            dose_id: dose.id,
            notification_type: 'dose_reminder',
            title,
            body,
            scheduled_at: notificationTime.toISOString(),
            delivery_status: 'scheduled',
            metadata: {
              item_id: dose.item_id,
              item_name: itemData.name,
              offset_minutes: offset,
            },
          });

          scheduledCount++;
        }
      }
    }

    // Insert all scheduled notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('notification_logs')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
      }
    }

    console.log(`Scheduled ${scheduledCount} notifications for ${doses.length} doses`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scheduled ${scheduledCount} notifications`,
        doses_processed: doses.length,
        scheduled: scheduledCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in schedule-dose-notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
