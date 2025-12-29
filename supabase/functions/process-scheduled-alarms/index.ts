import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push utilities
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    // For web push, we need to use the web-push protocol
    // This is a simplified implementation - for production, consider using a web-push library
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
      },
      body: payload,
    });

    if (!response.ok) {
      console.error(`[WebPush] Failed to send: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[WebPush] Error sending push:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('[Alarms] VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    console.log(`[Alarms] Processing alarms due between ${fiveMinutesAgo.toISOString()} and ${now.toISOString()}`);

    // Fetch alarms that are due
    const { data: dueAlarms, error: alarmsError } = await supabase
      .from('alarms')
      .select('*')
      .eq('enabled', true)
      .lte('scheduled_at', now.toISOString())
      .or(`last_triggered.is.null,last_triggered.lt.${fiveMinutesAgo.toISOString()}`);

    if (alarmsError) {
      console.error('[Alarms] Error fetching alarms:', alarmsError);
      throw alarmsError;
    }

    console.log(`[Alarms] Found ${dueAlarms?.length || 0} due alarms`);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      noSubscription: 0,
    };

    for (const alarm of dueAlarms || []) {
      results.processed++;

      // Get user's push subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', alarm.user_id);

      if (subError) {
        console.error(`[Alarms] Error fetching subscriptions for user ${alarm.user_id}:`, subError);
        results.failed++;
        continue;
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`[Alarms] No push subscriptions for user ${alarm.user_id}`);
        results.noSubscription++;
        continue;
      }

      const payload = JSON.stringify({
        title: alarm.title,
        body: alarm.message || 'Hora do seu lembrete!',
        icon: '/icon-512.png',
        badge: '/favicon.png',
        tag: `alarm-${alarm.id}`,
        data: {
          alarmId: alarm.id,
          url: alarm.url || '/hoje',
          action: alarm.action,
          category: alarm.category,
        },
        actions: [
          { action: 'complete', title: '✓ Feito' },
          { action: 'snooze', title: '⏰ Adiar 10min' },
        ],
        requireInteraction: alarm.require_interaction,
        silent: alarm.silent,
        vibrate: alarm.vibrate ? [200, 100, 200] : undefined,
      });

      let sentToAny = false;
      for (const sub of subscriptions) {
        try {
          // Send push notification
          const sent = await sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload,
            vapidPublicKey,
            vapidPrivateKey
          );
          
          if (sent) {
            sentToAny = true;
            console.log(`[Alarms] Push sent to subscription ${sub.id}`);
          }
        } catch (error) {
          console.error(`[Alarms] Error sending to subscription ${sub.id}:`, error);
        }
      }

      if (sentToAny) {
        results.sent++;

        // Update last_triggered
        await supabase
          .from('alarms')
          .update({ last_triggered: now.toISOString() })
          .eq('id', alarm.id);

        // Handle recurrence
        if (alarm.recurrence !== 'once') {
          const nextScheduled = calculateNextOccurrence(alarm);
          if (nextScheduled) {
            await supabase
              .from('alarms')
              .update({ scheduled_at: nextScheduled.toISOString() })
              .eq('id', alarm.id);
          }
        } else {
          // Disable one-time alarms after triggering
          await supabase
            .from('alarms')
            .update({ enabled: false })
            .eq('id', alarm.id);
        }
      } else {
        results.failed++;
      }
    }

    console.log(`[Alarms] Results:`, results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Alarms] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateNextOccurrence(alarm: any): Date | null {
  const now = new Date();
  const scheduled = new Date(alarm.scheduled_at);

  switch (alarm.recurrence) {
    case 'daily':
      scheduled.setDate(scheduled.getDate() + 1);
      while (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1);
      }
      return scheduled;

    case 'weekly':
      scheduled.setDate(scheduled.getDate() + 7);
      while (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 7);
      }
      return scheduled;

    case 'monthly':
      scheduled.setMonth(scheduled.getMonth() + 1);
      while (scheduled <= now) {
        scheduled.setMonth(scheduled.getMonth() + 1);
      }
      return scheduled;

    default:
      return null;
  }
}