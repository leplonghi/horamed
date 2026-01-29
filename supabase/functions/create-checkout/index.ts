import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.4.0?target=deno";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Price IDs by currency - All in account AY2hnWxlHu
const PRICES = {
  BRL: {
    monthly: 'price_1Stun3AY2hnWxlHuDEEMRVTs', // R$ 19,90/mês
    annual: 'price_1SuWEwAY2hnWxlHuG2WrgNhx',  // R$ 199,90/ano
  },
  USD: {
    monthly: 'price_1SturuAY2hnWxlHuHVLxgKae', // $3.99/month
    annual: 'price_1SieJtAY2hnWxlHuAOa6m5nu',  // $39.90/year
  },
};

// Input validation schema
const checkoutSchema = z.object({
  planType: z.enum(['monthly', 'annual']).default('monthly'),
  countryCode: z.string().length(2).default('US'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = checkoutSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      console.error('[CREATE-CHECKOUT] Validation error:', parseResult.error.message);
      return new Response(
        JSON.stringify({ error: 'Invalid input. planType must be monthly or annual.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { planType, countryCode } = parseResult.data;
    
    // Determine currency based on country - ONLY Brazil uses BRL
    const currency = countryCode === 'BR' ? 'BRL' : 'USD';
    const priceId = PRICES[currency][planType];
    
    console.log(`[CREATE-CHECKOUT] Creating checkout - plan: ${planType}, country: ${countryCode}, currency: ${currency}, priceId: ${priceId}`);
    
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

    // Validate existing customer or create new one
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
        console.log(`[CREATE-CHECKOUT] Using existing customer: ${customerId}`);
      } catch (err) {
        console.log(`[CREATE-CHECKOUT] Customer ${customerId} not found in Stripe, creating new one`);
        customerId = null; // Reset to create new customer
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
          country: countryCode,
        },
      });
      customerId = customer.id;
      console.log(`[CREATE-CHECKOUT] Created new customer: ${customerId}`);

      await supabaseClient
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

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
          country: countryCode,
          currency: currency,
        },
      },
      success_url: `${appDomain}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appDomain}/assinatura/cancelado`,
      metadata: {
        supabase_user_id: user.id,
        plan_type: planType,
        country: countryCode,
        currency: currency,
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
