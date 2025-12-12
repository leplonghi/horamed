import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planType = 'monthly' } = await req.json();
    console.log(`[CREATE-CHECKOUT] Creating checkout for plan: ${planType}`);
    
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

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log(`[CREATE-CHECKOUT] User authenticated: ${user.id}`);

    // Get or create Stripe customer
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log(`[CREATE-CHECKOUT] Created new customer: ${customerId}`);

      await supabaseClient
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    } else {
      console.log(`[CREATE-CHECKOUT] Using existing customer: ${customerId}`);
    }

    // Use actual Stripe price IDs
    const priceId = planType === 'annual' 
      ? 'price_1SYEWmAY2hnWxlHuNegLluyC' // Annual: R$ 199,90/ano
      : 'price_1SYEVNAY2hnWxlHujMBQSYTt'; // Monthly: R$ 19,90/mês
    
    console.log(`[CREATE-CHECKOUT] Using price ID: ${priceId}`);

    // Production domain configuration
    const appDomain = Deno.env.get('APP_DOMAIN') || req.headers.get('origin') || 'https://app.horamed.net';
    
    // Create checkout session with 7-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          plan_type: planType,
        },
      },
      success_url: `${appDomain}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appDomain}/assinatura/cancelado`,
      metadata: {
        supabase_user_id: user.id,
        plan_type: planType,
      },
    });

    console.log(`[CREATE-CHECKOUT] Session created: ${session.id}`);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
