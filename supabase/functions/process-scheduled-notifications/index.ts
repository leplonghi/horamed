import { createClient } from "npm:@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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

interface ChannelResult {
  channel: string;
  success: boolean;
  error?: string;
  timestamp: string;
}

async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, any>
): Promise<ChannelResult> {
  const timestamp = new Date().toISOString();
  try {
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${Deno.env.get('FIREBASE_SERVER_KEY')}`,
      },
      body: JSON.stringify({
        to: pushToken,
        notification: { title, body, sound: 'default', badge: 1 },
        data,
        priority: 'high',
        android: {
          priority: 'high',
          notification: { 
            sound: 'default', 
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            channel_id: 'horamed-medicamentos',
          },
        },
        apns: {
          payload: { aps: { sound: 'default', 'content-available': 1 } },
          headers: { 'apns-priority': '10' },
        },
      }),
    });

    const result = await fcmResponse.json();
    
    if (fcmResponse.ok && result.success === 1) {
      return { channel: 'push', success: true, timestamp };
    }
    return { channel: 'push', success: false, error: JSON.stringify(result), timestamp };
  } catch (e: any) {
    return { channel: 'push', success: false, error: e.message, timestamp };
  }
}

async function sendEmail(
  toEmail: string,
  title: string,
  body: string,
  metadata?: any
): Promise<ChannelResult> {
  const timestamp = new Date().toISOString();
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");
  const fromEmail = Deno.env.get("SMTP_FROM_EMAIL");

  if (!smtpHost || !smtpUser || !smtpPassword || !fromEmail) {
    return { channel: 'email', success: false, error: 'SMTP not configured', timestamp };
  }

  try {
    const client = new SmtpClient();

    if (smtpPort === 465) {
      await client.connectTLS({
        hostname: smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPassword,
      });
    } else {
      await client.connect({
        hostname: smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPassword,
      });
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://app.horamed.net';
    const doseUrl = metadata?.dose_id ? `${appUrl}/hoje?dose=${metadata.dose_id}` : appUrl;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 28px; font-weight: 700; color: #10B981; }
    .title { font-size: 22px; color: #1f2937; margin: 24px 0 12px; font-weight: 600; }
    .body { font-size: 17px; color: #4b5563; line-height: 1.6; }
    .cta { display: block; text-align: center; margin: 28px 0; }
    .cta a { 
      display: inline-block;
      background: #10B981; 
      color: white; 
      text-decoration: none; 
      padding: 14px 32px; 
      border-radius: 12px; 
      font-weight: 600;
      font-size: 16px;
    }
    .footer { margin-top: 32px; font-size: 13px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💊 HoraMed</div>
    </div>
    <h1 class="title">${title}</h1>
    <p class="body">${body}</p>
    <div class="cta">
      <a href="${doseUrl}">Registrar dose</a>
    </div>
    <p class="footer">
      Este é um lembrete automático do HoraMed.<br>
      Sua saúde no horário certo.
    </p>
  </div>
</body>
</html>`;

    await client.send({
      from: fromEmail,
      to: toEmail,
      subject: `💊 ${title}`,
      content: body,
      html: emailHtml,
    });

    await client.close();
    return { channel: 'email', success: true, timestamp };
  } catch (e: any) {
    return { channel: 'email', success: false, error: e.message, timestamp };
  }
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  title: string,
  body: string,
  data: Record<string, any>
): Promise<ChannelResult> {
  const timestamp = new Date().toISOString();
  
  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      return { channel: 'web_push', success: false, error: 'VAPID not configured', timestamp };
    }

    // Send via web-push library or direct implementation
    // For now, we'll mark as not implemented since web push requires complex crypto
    return { channel: 'web_push', success: false, error: 'Web push pending implementation', timestamp };
  } catch (e: any) {
    return { channel: 'web_push', success: false, error: e.message, timestamp };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('[PROCESS-NOTIFY] Starting...');

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('X-Cron-Secret');
    
    if (!cronSecret && !authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch scheduled notifications due now
    const now = new Date().toISOString();
    const { data: scheduledNotifications, error: fetchError } = await supabaseAdmin
      .from('notification_logs')
      .select('*')
      .eq('delivery_status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(100);

    if (fetchError) {
      console.error('[PROCESS-NOTIFY] Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch', details: fetchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      console.log('[PROCESS-NOTIFY] No notifications to process');
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PROCESS-NOTIFY] Processing ${scheduledNotifications.length} notifications`);

    let successCount = 0;
    let failureCount = 0;
    let fallbackCount = 0;

    for (const notification of scheduledNotifications as NotificationLog[]) {
      try {
        console.log(`[PROCESS-NOTIFY] Processing ${notification.id} for user ${notification.user_id}`);

        // Mark as processing to avoid duplicate sends
        await supabaseAdmin.from('notification_logs').update({
          delivery_status: 'processing',
        }).eq('id', notification.id);

        // Get user preferences
        const { data: preferences } = await supabaseAdmin
          .from('notification_preferences')
          .select('push_enabled, push_token, email_enabled, whatsapp_enabled, whatsapp_number')
          .eq('user_id', notification.user_id)
          .maybeSingle();

        // Get user email
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(notification.user_id);
        const userEmail = user?.email;

        // Get web push subscription
        const { data: pushSubscription } = await supabaseAdmin
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', notification.user_id)
          .maybeSingle();

        const results: ChannelResult[] = [];
        const notificationData = { 
          notificationId: notification.id,
          doseId: notification.dose_id || '',
          type: notification.notification_type 
        };

        // 1. Try Push (FCM)
        if (preferences?.push_enabled && preferences?.push_token) {
          const pushResult = await sendPushNotification(
            preferences.push_token,
            notification.title,
            notification.body,
            notificationData
          );
          results.push(pushResult);
          console.log(`[PROCESS-NOTIFY] Push: ${pushResult.success ? 'OK' : pushResult.error}`);
        }

        // 2. Try Web Push if available
        if (pushSubscription?.endpoint) {
          const webPushResult = await sendWebPush(
            pushSubscription,
            notification.title,
            notification.body,
            notificationData
          );
          results.push(webPushResult);
          console.log(`[PROCESS-NOTIFY] Web Push: ${webPushResult.success ? 'OK' : webPushResult.error}`);
        }

        // Check if any push succeeded
        const pushSuccess = results.some(r => r.success && (r.channel === 'push' || r.channel === 'web_push'));

        // 3. Email as fallback if push failed, or if email is explicitly enabled
        const shouldSendEmail = (preferences?.email_enabled !== false && userEmail) && 
          (!pushSuccess || notification.metadata?.priority === 'high');
        
        if (shouldSendEmail) {
          const emailResult = await sendEmail(
            userEmail!,
            notification.title,
            notification.body,
            { dose_id: notification.dose_id }
          );
          results.push(emailResult);
          console.log(`[PROCESS-NOTIFY] Email${!pushSuccess ? ' (fallback)' : ''}: ${emailResult.success ? 'OK' : emailResult.error}`);
          
          if (!pushSuccess && emailResult.success) {
            fallbackCount++;
          }
        }

        const anySuccess = results.some(r => r.success);
        
        await supabaseAdmin.from('notification_logs').update({
          delivery_status: anySuccess ? 'delivered' : 'failed',
          sent_at: anySuccess ? new Date().toISOString() : null,
          error_message: anySuccess ? null : results.map(r => `${r.channel}: ${r.error}`).join('; '),
          metadata: { 
            ...notification.metadata, 
            channels: results,
            used_fallback: !pushSuccess && results.some(r => r.channel === 'email' && r.success),
          },
        }).eq('id', notification.id);

        if (anySuccess) successCount++;
        else failureCount++;

        // Track notification metric
        await supabaseAdmin.from('notification_metrics').insert({
          user_id: notification.user_id,
          dose_id: notification.dose_id,
          notification_type: notification.notification_type,
          delivery_status: anySuccess ? 'delivered' : 'failed',
          error_message: anySuccess ? null : results.map(r => `${r.channel}: ${r.error}`).join('; '),
          metadata: { channels: results.map(r => ({ channel: r.channel, success: r.success })) },
        });

      } catch (error: any) {
        console.error(`[PROCESS-NOTIFY] Error ${notification.id}:`, error.message);
        await supabaseAdmin.from('notification_logs').update({
          delivery_status: 'failed',
          error_message: error.message,
        }).eq('id', notification.id);
        failureCount++;
      }
    }

    const duration = Date.now() - startTime;
    
    // Log aggregate telemetry
    await supabaseAdmin.from('app_metrics').insert({
      event_name: 'notifications_processed',
      event_data: {
        total: scheduledNotifications.length,
        success: successCount,
        failed: failureCount,
        fallback_used: fallbackCount,
        duration_ms: duration,
      },
    });

    console.log(`[PROCESS-NOTIFY] Done in ${duration}ms. Success: ${successCount}, Failed: ${failureCount}, Fallback: ${fallbackCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: scheduledNotifications.length,
        successful: successCount,
        failed: failureCount,
        fallback_used: fallbackCount,
        duration_ms: duration,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[PROCESS-NOTIFY] Fatal error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
