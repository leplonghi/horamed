import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

interface ScheduleRequest {
  dose_id?: string;
  user_id?: string;
  mode?: 'single' | 'batch';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Verify authentication: either user auth or cron secret
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('X-Cron-Secret');
    let requestUserId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace('Bearer ', '');
      const { data, error: authError } = await supabaseClient.auth.getClaims(token);
      if (authError || !data?.claims) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      requestUserId = data.claims.sub as string;
    } else if (cronSecret !== Deno.env.get('CRON_SECRET')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body for optional dose_id
    let body: ScheduleRequest = {};
    try {
      body = await req.json();
    } catch {
      // No body provided, will use batch mode
    }

    const { dose_id, user_id, mode = 'batch' } = body;
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log(`[SCHEDULE] Mode: ${mode}, dose_id: ${dose_id || 'all'}, user_id: ${user_id || requestUserId || 'all'}`);

    // Build query based on mode
    let query = supabaseAdmin
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

    // If specific dose_id provided
    if (dose_id && mode === 'single') {
      query = supabaseAdmin
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
        .eq('id', dose_id);
    }

    // If user_id provided (for user-specific scheduling)
    const targetUserId = user_id || requestUserId;
    
    const { data: doses, error: dosesError } = await query;

    if (dosesError) {
      console.error('[SCHEDULE] Error fetching doses:', dosesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch doses', details: dosesError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!doses || doses.length === 0) {
      console.log('[SCHEDULE] No doses to schedule');
      return new Response(
        JSON.stringify({ success: true, message: 'No doses to schedule', scheduled: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter doses by user if needed
    const filteredDoses = targetUserId 
      ? doses.filter(d => {
          const itemData = Array.isArray(d.items) ? d.items[0] : d.items;
          return itemData.user_id === targetUserId;
        })
      : doses;

    // Get users with notification preferences
    const userIds = [...new Set(filteredDoses.map(d => {
      const itemData = Array.isArray(d.items) ? d.items[0] : d.items;
      return itemData.user_id;
    }))];
    
    const { data: preferences } = await supabaseAdmin
      .from('notification_preferences')
      .select('user_id, push_enabled, push_token, email_enabled')
      .in('user_id', userIds);

    // Get existing scheduled notifications to avoid duplicates
    const { data: existingNotifications } = await supabaseAdmin
      .from('notification_logs')
      .select('dose_id, scheduled_at')
      .eq('delivery_status', 'scheduled')
      .in('dose_id', filteredDoses.map(d => d.id));

    const existingSet = new Set(
      existingNotifications?.map(n => `${n.dose_id}_${n.scheduled_at}`) || []
    );

    let scheduledCount = 0;
    const notifications: any[] = [];

    for (const dose of filteredDoses) {
      const itemData = Array.isArray(dose.items) ? dose.items[0] : dose.items;
      const userPrefs = preferences?.find(p => p.user_id === itemData.user_id);
      
      // Skip if user has no notification method enabled
      if (!userPrefs?.push_token && !userPrefs?.email_enabled) {
        console.log(`[SCHEDULE] Skipping dose ${dose.id}: no notification method`);
        continue;
      }

      const dueTime = new Date(dose.due_at);

      // Notification schedule: 5 min before, at time, and 5 min after (reminder)
      const notificationTimes = [
        { offset: 5, title: '⏰ Em 5 minutos: hora do remédio!', priority: 'normal' },
        { offset: 0, title: '🔔 Hora do remédio!', priority: 'high' },
        { offset: -5, title: '⚠️ Lembrete: você tomou?', priority: 'normal' },
      ];

      for (const { offset, title, priority } of notificationTimes) {
        const notificationTime = new Date(dueTime.getTime() - offset * 60000);
        
        // Only schedule future notifications
        if (notificationTime <= now) continue;
        
        // Check for duplicate
        const key = `${dose.id}_${notificationTime.toISOString()}`;
        if (existingSet.has(key)) continue;

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
            priority,
            due_at: dose.due_at,
          },
        });

        existingSet.add(key);
        scheduledCount++;
      }
    }

    // Insert all scheduled notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('notification_logs')
        .insert(notifications);

      if (insertError) {
        console.error('[SCHEDULE] Error inserting notifications:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to schedule notifications', details: insertError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log telemetry
    await supabaseAdmin.from('app_metrics').insert({
      event_name: 'notifications_scheduled',
      event_data: {
        doses_processed: filteredDoses.length,
        notifications_scheduled: scheduledCount,
        mode,
        duration_ms: Date.now() - startTime,
      },
    });

    console.log(`[SCHEDULE] Done: ${scheduledCount} notifications for ${filteredDoses.length} doses in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scheduled ${scheduledCount} notifications`,
        doses_processed: filteredDoses.length,
        scheduled: scheduledCount,
        duration_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SCHEDULE] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
