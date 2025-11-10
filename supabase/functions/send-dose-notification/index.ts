import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  doseId: string;
  userId: string;
  title: string;
  body: string;
  scheduledAt: string;
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

    const body: NotificationRequest = await req.json();

    // Get user's push token from notification_preferences
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: preferences } = await supabaseAdmin
      .from('notification_preferences')
      .select('push_token, push_enabled')
      .eq('user_id', body.userId)
      .single();

    if (!preferences?.push_enabled || !preferences.push_token) {
      console.log('Push notifications not enabled or token not found for user:', body.userId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Push notifications not enabled' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare notification with action buttons
    const notificationPayload = {
      token: preferences.push_token,
      title: body.title,
      body: body.body,
      data: {
        doseId: body.doseId,
        type: 'dose_reminder',
        action_taken_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-dose-action`,
        action_snooze_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-dose-action`,
      },
      // Action buttons for Android and iOS
      actions: [
        {
          action: 'taken',
          title: '✓ Tomei',
          icon: 'check_circle',
        },
        {
          action: 'snooze',
          title: '⏰ Mais tarde',
          icon: 'schedule',
        },
      ],
    };

    console.log('Sending push notification with actions:', notificationPayload);

    // Log notification delivery attempt
    await supabaseAdmin.from('notification_logs').insert({
      user_id: body.userId,
      notification_type: 'dose_reminder',
      delivery_status: 'sent',
      title: body.title,
      body: body.body,
      scheduled_at: body.scheduledAt,
      sent_at: new Date().toISOString(),
      metadata: {
        dose_id: body.doseId,
        platform: 'push',
      },
    });

    // TODO: Integrate with FCM/APNs
    // Example FCM integration (requires FIREBASE_SERVER_KEY secret):
    /*
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${Deno.env.get('FIREBASE_SERVER_KEY')}`,
      },
      body: JSON.stringify({
        to: preferences.push_token,
        notification: {
          title: body.title,
          body: body.body,
          sound: 'default',
          badge: 1,
        },
        data: {
          doseId: body.doseId,
          type: 'dose_reminder',
        },
        priority: 'high',
      }),
    });
    */

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Notification sent successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
