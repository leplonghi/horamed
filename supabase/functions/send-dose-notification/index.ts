import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const notificationSchema = z.object({
  doseId: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  scheduledAt: z.string().datetime(),
});

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

    // Validate input
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = notificationSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      console.error('[SEND-DOSE-NOTIFICATION] Validation error:', parseResult.error.message);
      return new Response(
        JSON.stringify({ error: 'Invalid request data', details: parseResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = parseResult.data;

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

    // Send push notification via Firebase Cloud Messaging
    try {
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
          // Android-specific settings
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
          // iOS-specific settings
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
        console.error('FCM error:', fcmResult);
        
        // Update log with error
        await supabaseAdmin.from('notification_logs').update({
          delivery_status: 'failed',
          error_message: JSON.stringify(fcmResult),
        }).eq('user_id', body.userId).eq('dose_id', body.doseId);
        
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'FCM delivery failed',
            details: fcmResult
          }),
          { 
            status: fcmResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Push notification sent successfully via FCM:', fcmResult);
      
      // Update log with success
      await supabaseAdmin.from('notification_logs').update({
        delivery_status: 'delivered',
        sent_at: new Date().toISOString(),
      }).eq('user_id', body.userId).eq('dose_id', body.doseId);

    } catch (error) {
      console.error('Error sending FCM notification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update log with error
      await supabaseAdmin.from('notification_logs').update({
        delivery_status: 'failed',
        error_message: errorMessage,
      }).eq('user_id', body.userId).eq('dose_id', body.doseId);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to send push notification',
          message: errorMessage 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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