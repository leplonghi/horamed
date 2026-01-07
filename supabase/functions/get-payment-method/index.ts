import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.4.0?target=deno";
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
    console.log('[GET-PAYMENT-METHOD] Starting...');
    
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

    console.log(`[GET-PAYMENT-METHOD] User: ${user.id}`);

    // Get customer ID from subscription
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ paymentMethod: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`[GET-PAYMENT-METHOD] Customer: ${subscription.stripe_customer_id}`);

    // Get default payment method
    const customer = await stripe.customers.retrieve(subscription.stripe_customer_id);
    
    if (customer.deleted) {
      return new Response(
        JSON.stringify({ paymentMethod: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method as string | null;
    
    if (!defaultPaymentMethodId) {
      // Try to get from subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: subscription.stripe_customer_id,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const activeSubscription = subscriptions.data[0];
        const paymentMethodId = activeSubscription.default_payment_method as string | null;
        
        if (paymentMethodId) {
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
          
          if (paymentMethod.card) {
            return new Response(
              JSON.stringify({
                paymentMethod: {
                  last4: paymentMethod.card.last4,
                  brand: paymentMethod.card.brand,
                  expMonth: paymentMethod.card.exp_month,
                  expYear: paymentMethod.card.exp_year,
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
        }
      }

      return new Response(
        JSON.stringify({ paymentMethod: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);
    
    if (!paymentMethod.card) {
      return new Response(
        JSON.stringify({ paymentMethod: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`[GET-PAYMENT-METHOD] Found card: **** ${paymentMethod.card.last4}`);

    return new Response(
      JSON.stringify({
        paymentMethod: {
          last4: paymentMethod.card.last4,
          brand: paymentMethod.card.brand,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('[GET-PAYMENT-METHOD] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
