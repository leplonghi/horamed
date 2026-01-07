import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret
    const cronSecret = req.headers.get('X-Cron-Secret');
    if (cronSecret !== Deno.env.get('CRON_SECRET')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const notifications = [];

    // 1. LOW STOCK ALERTS (≤ 7 days remaining)
    const { data: lowStock } = await supabaseAdmin
      .from('stock')
      .select(`
        id,
        units_left,
        projected_end_at,
        items!inner (
          id,
          user_id,
          name,
          profile_id
        )
      `)
      .not('projected_end_at', 'is', null)
      .lte('projected_end_at', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());

    if (lowStock && lowStock.length > 0) {
      for (const stock of lowStock) {
        const item = Array.isArray(stock.items) ? stock.items[0] : stock.items;
        const daysLeft = Math.ceil(
          (new Date(stock.projected_end_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        let title = '';
        let priority = 'medium';
        
        if (daysLeft <= 2) {
          title = '🚨 Estoque acabando! Compre agora';
          priority = 'high';
        } else if (daysLeft <= 5) {
          title = '⚠️ Estoque baixo! Apenas alguns dias';
          priority = 'medium';
        } else {
          title = '📦 Estoque ficando baixo';
          priority = 'low';
        }

        const body = `${item.name} - ${stock.units_left} ${stock.units_left === 1 ? 'unidade restante' : 'unidades restantes'}. ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} de tratamento.`;

        notifications.push({
          user_id: item.user_id,
          notification_type: 'low_stock',
          title,
          body,
          scheduled_at: now.toISOString(),
          delivery_status: 'pending',
          metadata: {
            item_id: item.id,
            item_name: item.name,
            units_left: stock.units_left,
            days_left: daysLeft,
            priority,
          },
        });
      }
    }

    // 2. EXPIRING PRESCRIPTIONS (30, 7, and 1 day before expiry)
    const alertDays = [30, 7, 1];
    
    for (const days of alertDays) {
      const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const { data: expiringDocs } = await supabaseAdmin
        .from('documentos_saude')
        .select('id, user_id, profile_id, title, expires_at, meta')
        .eq('categoria_id', 'receita')
        .gte('expires_at', startOfDay.toISOString())
        .lte('expires_at', endOfDay.toISOString());

      if (expiringDocs && expiringDocs.length > 0) {
        for (const doc of expiringDocs) {
          const isPurchased = (doc.meta as any)?.is_purchased === true;
          
          let title = '';
          let body = '';
          
          if (days === 30) {
            title = '📋 Receita vence em 1 mês';
            body = isPurchased 
              ? `${doc.title || 'Sua receita'} vence em 30 dias`
              : `${doc.title || 'Sua receita'} vence em 30 dias e você ainda não comprou os remédios!`;
          } else if (days === 7) {
            title = '⚠️ Receita vence essa semana!';
            body = isPurchased
              ? `${doc.title || 'Sua receita'} vence em 7 dias`
              : `${doc.title || 'Sua receita'} vence em 7 dias. Compre os remédios logo!`;
          } else {
            title = '🚨 Receita vence amanhã!';
            body = isPurchased
              ? `${doc.title || 'Sua receita'} vence amanhã`
              : `${doc.title || 'Sua receita'} vence amanhã! Última chance de comprar os remédios.`;
          }

          notifications.push({
            user_id: doc.user_id,
            notification_type: 'expiring_prescription',
            title,
            body,
            scheduled_at: now.toISOString(),
            delivery_status: 'pending',
            metadata: {
              document_id: doc.id,
              expires_in_days: days,
              is_purchased: isPurchased,
            },
          });
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('notification_logs')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }

      console.log(`Sent ${notifications.length} smart notifications`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${notifications.length} smart notifications`,
        low_stock: lowStock?.length || 0,
        notifications_sent: notifications.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-smart-notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
