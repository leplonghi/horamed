import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationLog {
  id: string;
  user_id: string;
  dose_id: string | null;
  notification_type: string;
  title: string;
  body: string;
  scheduled_at: string;
  metadata: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled notifications processing...');

    // Verify authentication (cron secret or auth token)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('X-Cron-Secret');
    
    if (!cronSecret && !authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Fetch scheduled notifications that are due
    const now = new Date().toISOString();
    const { data: scheduledNotifications, error: fetchError } = await supabaseAdmin
      .from('notification_logs')
      .select('*')
      .eq('delivery_status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(100); // Process up to 100 notifications per run

    if (fetchError) {
      console.error('Error fetching scheduled notifications:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notifications', details: fetchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      console.log('No scheduled notifications to process');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No notifications to process' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${scheduledNotifications.length} notifications to process`);

    let successCount = 0;
    let failureCount = 0;

    // Process each notification
    for (const notification of scheduledNotifications as NotificationLog[]) {
      try {
        console.log(`Processing notification ${notification.id} for user ${notification.user_id}`);

        // Get user's push token
        const { data: preferences, error: prefError } = await supabaseAdmin
          .from('notification_preferences')
          .select('push_enabled, push_token')
          .eq('user_id', notification.user_id)
          .single();

        if (prefError || !preferences) {
          console.error(`No preferences found for user ${notification.user_id}:`, prefError);
          await supabaseAdmin.from('notification_logs').update({
            delivery_status: 'failed',
            error_message: 'User notification preferences not found',
          }).eq('id', notification.id);
          failureCount++;
          continue;
        }

        if (!preferences.push_enabled || !preferences.push_token) {
          console.log(`User ${notification.user_id} has push notifications disabled or no token`);
          await supabaseAdmin.from('notification_logs').update({
            delivery_status: 'skipped',
            error_message: 'Push notifications disabled or token missing',
          }).eq('id', notification.id);
          failureCount++;
          continue;
        }

        // Send via FCM
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${Deno.env.get('FIREBASE_SERVER_KEY')}`,
          },
          body: JSON.stringify({
            to: preferences.push_token,
            notification: {
              title: notification.title,
              body: notification.body,
              sound: 'default',
              badge: 1,
            },
            data: {
              notificationId: notification.id,
              doseId: notification.dose_id || '',
              type: notification.notification_type,
              ...(notification.metadata || {}),
            },
            priority: 'high',
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  'content-available': 1,
                },
              },
              headers: {
                'apns-priority': '10',
              },
            },
          }),
        });

        const fcmResult = await fcmResponse.json();

        if (!fcmResponse.ok) {
          console.error(`FCM error for notification ${notification.id}:`, fcmResult);
          await supabaseAdmin.from('notification_logs').update({
            delivery_status: 'failed',
            error_message: JSON.stringify(fcmResult),
          }).eq('id', notification.id);
          failureCount++;
          continue;
        }

        console.log(`Successfully sent notification ${notification.id} via FCM`);
        await supabaseAdmin.from('notification_logs').update({
          delivery_status: 'delivered',
          sent_at: new Date().toISOString(),
        }).eq('id', notification.id);
        successCount++;

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await supabaseAdmin.from('notification_logs').update({
          delivery_status: 'failed',
          error_message: errorMessage,
        }).eq('id', notification.id);
        failureCount++;
      }
    }

    console.log(`Processed ${scheduledNotifications.length} notifications: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: scheduledNotifications.length,
        successful: successCount,
        failed: failureCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-scheduled-notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
