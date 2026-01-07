import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[UPDATE-PAYMENT-METHOD] Starting...');
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log(`[UPDATE-PAYMENT-METHOD] User: ${user.id}`);

    // Get customer ID from subscription
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      throw new Error('No Stripe customer found');
    }

    console.log(`[UPDATE-PAYMENT-METHOD] Customer: ${subscription.stripe_customer_id}`);

    // Get return URL from request origin or use app domain
    const origin = req.headers.get('origin') || 'https://app.horamed.net';
    const returnUrl = `${origin}/assinatura?payment_updated=true`;

    // Create a checkout session specifically for updating payment method
    const session = await stripe.checkout.sessions.create({
      customer: subscription.stripe_customer_id,
      mode: 'setup',
      payment_method_types: ['card'],
      success_url: returnUrl,
      cancel_url: `${origin}/assinatura`,
      metadata: {
        user_id: user.id,
        subscription_id: subscription.stripe_subscription_id || '',
      },
    });

    console.log(`[UPDATE-PAYMENT-METHOD] Session created: ${session.id}`);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('[UPDATE-PAYMENT-METHOD] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
