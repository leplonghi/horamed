import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from "npm:@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  doseId?: string;
  title: string;
  body: string;
  type: 'dose_reminder' | 'stock_alert' | 'missed_dose';
}

interface NotificationResult {
  channel: string;
  success: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[MULTI-CHANNEL] Starting notification dispatch...');

  try {
    const { userId, doseId, title, body, type }: NotificationRequest = await req.json();

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user preferences and email
    const { data: preferences } = await supabaseAdmin
      .from('notification_preferences')
      .select('push_token, push_enabled, email_enabled, whatsapp_enabled, whatsapp_number')
      .eq('user_id', userId)
      .single();

    // Get user email from auth
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
    const userEmail = user?.email;

    const results: NotificationResult[] = [];

    // 1. Try Push Notification (FCM)
    if (preferences?.push_enabled && preferences?.push_token) {
      console.log('[MULTI-CHANNEL] Sending push notification...');
      try {
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${Deno.env.get('FIREBASE_SERVER_KEY')}`,
          },
          body: JSON.stringify({
            to: preferences.push_token,
            notification: { title, body, sound: 'default', badge: 1 },
            data: { doseId, type },
            priority: 'high',
          }),
        });

        const fcmResult = await fcmResponse.json();
        
        if (fcmResponse.ok && fcmResult.success === 1) {
          results.push({ channel: 'push', success: true });
          console.log('[MULTI-CHANNEL] Push sent successfully');
        } else {
          results.push({ channel: 'push', success: false, error: JSON.stringify(fcmResult) });
          console.log('[MULTI-CHANNEL] Push failed:', fcmResult);
        }
      } catch (e: any) {
        results.push({ channel: 'push', success: false, error: e.message });
        console.error('[MULTI-CHANNEL] Push error:', e.message);
      }
    }

    // 2. Try Email (SMTP) - as backup or if email_enabled
    const emailEnabled = preferences?.email_enabled !== false; // Default to true
    if (emailEnabled && userEmail) {
      console.log('[MULTI-CHANNEL] Sending email to', userEmail);
      try {
        const smtpHost = Deno.env.get("SMTP_HOST");
        const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
        const smtpUser = Deno.env.get("SMTP_USER");
        const smtpPassword = Deno.env.get("SMTP_PASSWORD");
        const fromEmail = Deno.env.get("SMTP_FROM_EMAIL");

        if (smtpHost && smtpUser && smtpPassword && fromEmail) {
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
    .cta { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
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
            to: userEmail,
            subject: `HoraMed: ${title}`,
            content: body,
            html: emailHtml,
          });

          await client.close();
          results.push({ channel: 'email', success: true });
          console.log('[MULTI-CHANNEL] Email sent successfully');
        } else {
          results.push({ channel: 'email', success: false, error: 'SMTP not configured' });
        }
      } catch (e: any) {
        results.push({ channel: 'email', success: false, error: e.message });
        console.error('[MULTI-CHANNEL] Email error:', e.message);
      }
    }

    // 3. Try WhatsApp (Evolution API) if enabled
    if (preferences?.whatsapp_enabled && preferences?.whatsapp_number) {
      console.log('[MULTI-CHANNEL] Sending WhatsApp...');
      try {
        const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
        const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

        if (evolutionUrl && evolutionKey) {
          const waResponse = await fetch(`${evolutionUrl}/message/sendText/horamed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionKey,
            },
            body: JSON.stringify({
              number: preferences.whatsapp_number,
              text: `*${title}*\n\n${body}\n\n_HoraMed - Sua saúde no horário certo_`,
            }),
          });

          if (waResponse.ok) {
            results.push({ channel: 'whatsapp', success: true });
            console.log('[MULTI-CHANNEL] WhatsApp sent successfully');
          } else {
            const waError = await waResponse.text();
            results.push({ channel: 'whatsapp', success: false, error: waError });
          }
        }
      } catch (e: any) {
        results.push({ channel: 'whatsapp', success: false, error: e.message });
        console.error('[MULTI-CHANNEL] WhatsApp error:', e.message);
      }
    }

    // Log notification result
    const anySuccess = results.some(r => r.success);
    await supabaseAdmin.from('notification_logs').insert({
      user_id: userId,
      notification_type: type,
      delivery_status: anySuccess ? 'delivered' : 'failed',
      title,
      body,
      scheduled_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      dose_id: doseId || null,
      metadata: { channels: results },
    });

    const duration = Date.now() - startTime;
    console.log(`[MULTI-CHANNEL] Completed in ${duration}ms. Results:`, results);

    return new Response(
      JSON.stringify({ 
        success: anySuccess, 
        results,
        duration_ms: duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[MULTI-CHANNEL] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
