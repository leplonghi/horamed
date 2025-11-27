import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-08-27.basil',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log(`Webhook received: ${event.type}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const planType = session.metadata?.plan_type || 'monthly';
        
        if (!userId) {
          throw new Error('No user ID in session metadata');
        }

        console.log(`Processing checkout completion for user ${userId}, plan: ${planType}`);

        // Update subscription to premium
        await supabaseAdmin
          .from('subscriptions')
          .update({
            plan_type: 'premium',
            status: 'active',
            stripe_subscription_id: session.subscription as string,
            expires_at: null,
          })
          .eq('user_id', userId);

        // Activate referrals after successful payment
        const referralPlanType = planType === 'annual' ? 'premium_annual' : 'premium_monthly';
        const { data: activatedReferrals } = await supabaseAdmin
          .from('referrals')
          .update({
            status: 'active',
            plan_type: referralPlanType,
            activated_at: new Date().toISOString(),
          })
          .eq('referred_user_id', userId)
          .eq('status', 'pending')
          .select();

        if (activatedReferrals && activatedReferrals.length > 0) {
          console.log(`Activated ${activatedReferrals.length} referral(s) for user ${userId}`);
        }

        console.log(`Upgraded user ${userId} to premium`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: subData } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (subData) {
          const status = subscription.status === 'active' ? 'active' : 
                        subscription.status === 'canceled' ? 'cancelled' : 'expired';

          await supabaseAdmin
            .from('subscriptions')
            .update({ status })
            .eq('user_id', subData.user_id);

          console.log(`Updated subscription status for user ${subData.user_id} to ${status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: subData } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (subData) {
          // Downgrade to free plan
          await supabaseAdmin
            .from('subscriptions')
            .update({
              plan_type: 'free',
              status: 'active',
              stripe_subscription_id: null,
              expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            })
            .eq('user_id', subData.user_id);

          console.log(`Downgraded user ${subData.user_id} to free plan`);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    
    // Don't expose internal error details to external callers
    const isSignatureError = error instanceof Error && 
      (error.message.includes('signature') || error.message.includes('webhook'));
    
    return new Response(
      JSON.stringify({ 
        error: isSignatureError ? 'Invalid webhook signature' : 'Webhook processing failed' 
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
