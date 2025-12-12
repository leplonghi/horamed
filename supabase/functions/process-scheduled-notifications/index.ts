import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
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
}

async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, any>
): Promise<ChannelResult> {
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
          notification: { sound: 'default', click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        },
        apns: {
          payload: { aps: { sound: 'default', 'content-available': 1 } },
          headers: { 'apns-priority': '10' },
        },
      }),
    });

    const result = await fcmResponse.json();
    
    if (fcmResponse.ok && result.success === 1) {
      return { channel: 'push', success: true };
    }
    return { channel: 'push', success: false, error: JSON.stringify(result) };
  } catch (e: any) {
    return { channel: 'push', success: false, error: e.message };
  }
}

async function sendEmail(
  toEmail: string,
  title: string,
  body: string
): Promise<ChannelResult> {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");
  const fromEmail = Deno.env.get("SMTP_FROM_EMAIL");

  if (!smtpHost || !smtpUser || !smtpPassword || !fromEmail) {
    return { channel: 'email', success: false, error: 'SMTP not configured' };
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

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #3B82F6; }
    .title { font-size: 20px; color: #1f2937; margin: 20px 0 10px; }
    .body { font-size: 16px; color: #4b5563; line-height: 1.6; }
    .footer { margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💊 HoraMed</div>
    </div>
    <h1 class="title">${title}</h1>
    <p class="body">${body}</p>
    <p class="footer">HoraMed - Sua saúde no horário certo</p>
  </div>
</body>
</html>`;

    await client.send({
      from: fromEmail,
      to: toEmail,
      subject: `HoraMed: ${title}`,
      content: body,
      html: emailHtml,
    });

    await client.close();
    return { channel: 'email', success: true };
  } catch (e: any) {
    return { channel: 'email', success: false, error: e.message };
  }
}

async function sendWhatsApp(
  phoneNumber: string,
  title: string,
  body: string
): Promise<ChannelResult> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionUrl || !evolutionKey) {
    return { channel: 'whatsapp', success: false, error: 'Evolution API not configured' };
  }

  try {
    const response = await fetch(`${evolutionUrl}/message/sendText/horamed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: `*${title}*\n\n${body}\n\n_HoraMed - Sua saúde no horário certo_`,
      }),
    });

    if (response.ok) {
      return { channel: 'whatsapp', success: true };
    }
    const errorText = await response.text();
    return { channel: 'whatsapp', success: false, error: errorText };
  } catch (e: any) {
    return { channel: 'whatsapp', success: false, error: e.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('[MULTI-NOTIFY] Starting scheduled notifications processing...');

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

    // Fetch scheduled notifications
    const now = new Date().toISOString();
    const { data: scheduledNotifications, error: fetchError } = await supabaseAdmin
      .from('notification_logs')
      .select('*')
      .eq('delivery_status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('[MULTI-NOTIFY] Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch', details: fetchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      console.log('[MULTI-NOTIFY] No notifications to process');
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[MULTI-NOTIFY] Processing ${scheduledNotifications.length} notifications`);

    let successCount = 0;
    let failureCount = 0;

    for (const notification of scheduledNotifications as NotificationLog[]) {
      try {
        console.log(`[MULTI-NOTIFY] Processing ${notification.id}`);

        // Get user preferences
        const { data: preferences } = await supabaseAdmin
          .from('notification_preferences')
          .select('push_enabled, push_token, email_enabled, whatsapp_enabled, whatsapp_number')
          .eq('user_id', notification.user_id)
          .single();

        // Get user email
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(notification.user_id);
        const userEmail = user?.email;

        const results: ChannelResult[] = [];

        // 1. Try Push
        if (preferences?.push_enabled && preferences?.push_token) {
          const pushResult = await sendPushNotification(
            preferences.push_token,
            notification.title,
            notification.body,
            { 
              notificationId: notification.id,
              doseId: notification.dose_id || '',
              type: notification.notification_type 
            }
          );
          results.push(pushResult);
          console.log(`[MULTI-NOTIFY] Push: ${pushResult.success ? 'OK' : pushResult.error}`);
        }

        // 2. Try Email (default enabled)
        const emailEnabled = preferences?.email_enabled !== false;
        if (emailEnabled && userEmail) {
          const emailResult = await sendEmail(userEmail, notification.title, notification.body);
          results.push(emailResult);
          console.log(`[MULTI-NOTIFY] Email: ${emailResult.success ? 'OK' : emailResult.error}`);
        }

        // 3. Try WhatsApp
        if (preferences?.whatsapp_enabled && preferences?.whatsapp_number) {
          const waResult = await sendWhatsApp(
            preferences.whatsapp_number,
            notification.title,
            notification.body
          );
          results.push(waResult);
          console.log(`[MULTI-NOTIFY] WhatsApp: ${waResult.success ? 'OK' : waResult.error}`);
        }

        const anySuccess = results.some(r => r.success);
        
        await supabaseAdmin.from('notification_logs').update({
          delivery_status: anySuccess ? 'delivered' : 'failed',
          sent_at: anySuccess ? new Date().toISOString() : null,
          error_message: anySuccess ? null : results.map(r => `${r.channel}: ${r.error}`).join('; '),
          metadata: { ...notification.metadata, channels: results },
        }).eq('id', notification.id);

        if (anySuccess) successCount++;
        else failureCount++;

      } catch (error: any) {
        console.error(`[MULTI-NOTIFY] Error ${notification.id}:`, error.message);
        await supabaseAdmin.from('notification_logs').update({
          delivery_status: 'failed',
          error_message: error.message,
        }).eq('id', notification.id);
        failureCount++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[MULTI-NOTIFY] Done in ${duration}ms. Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: scheduledNotifications.length,
        successful: successCount,
        failed: failureCount,
        duration_ms: duration,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[MULTI-NOTIFY] Fatal error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
