import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";

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

    console.log(`[STRIPE-WEBHOOK] Event received: ${event.type}`);

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

        console.log(`[STRIPE-WEBHOOK] Processing checkout for user ${userId}, plan: ${planType}`);

        // Update subscription to premium
        await supabaseAdmin
          .from('subscriptions')
          .update({
            plan_type: 'premium',
            status: 'active',
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            expires_at: null,
          })
          .eq('user_id', userId);

        // Process referral subscription (after 7 days validation is done via cron/manual check)
        const { data: referral } = await supabaseAdmin
          .from('referrals')
          .select('*')
          .eq('referred_user_id', userId)
          .in('status', ['pending', 'signup_completed'])
          .single();

        if (referral) {
          const referralPlanType = planType === 'annual' ? 'premium_annual' : 'premium_monthly';
          
          // Update referral status
          await supabaseAdmin
            .from('referrals')
            .update({
              status: 'active',
              plan_type: referralPlanType,
              activated_at: new Date().toISOString(),
            })
            .eq('id', referral.id);

          // Add discount to referrer (15% per referral, max 90%)
          const discountValue = 15;
          
          await supabaseAdmin
            .from('referral_discounts')
            .upsert({
              user_id: referral.referrer_user_id,
              discount_percent: discountValue,
              cycles_used: 0,
              max_cycles: 6,
              valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            }, {
              onConflict: 'user_id',
            });

          // Update discount if exists (accumulative)
          const { data: existingDiscount } = await supabaseAdmin
            .from('referral_discounts')
            .select('*')
            .eq('user_id', referral.referrer_user_id)
            .single();

          if (existingDiscount) {
            const newDiscount = Math.min((existingDiscount.discount_percent || 0) + discountValue, 90);
            await supabaseAdmin
              .from('referral_discounts')
              .update({
                discount_percent: newDiscount,
                cycles_used: 0, // Reset when new discount added
              })
              .eq('user_id', referral.referrer_user_id);
          }

          // Create reward record
          await supabaseAdmin
            .from('referral_rewards')
            .insert({
              referral_id: referral.id,
              reward_type: 'discount',
              reward_value: discountValue,
              status: 'granted',
              granted_at: new Date().toISOString(),
            });

          // Update goals
          const goalType = planType === 'annual' ? 'annual_subs_3' : 'monthly_subs_5';
          const targetCount = planType === 'annual' ? 3 : 5;

          await supabaseAdmin
            .from('referral_goals')
            .upsert({
              user_id: referral.referrer_user_id,
              goal_type: goalType,
              current_count: 1,
              target_count: targetCount,
            }, {
              onConflict: 'user_id,goal_type',
            });

          // Increment goal count
          await supabaseAdmin.rpc('check_and_grant_referral_goals', {
            p_user_id: referral.referrer_user_id,
          });

          console.log(`[STRIPE-WEBHOOK] Referral activated for referrer ${referral.referrer_user_id}`);
        }

        console.log(`[STRIPE-WEBHOOK] Upgraded user ${userId} to premium`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by customer ID
        const { data: subData } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (subData) {
          // Check if user has referral discount to apply
          const { data: discountData } = await supabaseAdmin
            .from('referral_discounts')
            .select('*')
            .eq('user_id', subData.user_id)
            .single();

          if (discountData && discountData.discount_percent > 0 && discountData.cycles_used < discountData.max_cycles) {
            // Create Stripe coupon for next invoice
            try {
              const coupon = await stripe.coupons.create({
                percent_off: discountData.discount_percent,
                duration: 'once',
                metadata: {
                  user_id: subData.user_id,
                  referral_discount: 'true',
                },
              });

              // Get active subscription
              const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'active',
                limit: 1,
              });

              if (subscriptions.data.length > 0) {
                // Apply coupon to next invoice
                await stripe.subscriptions.update(subscriptions.data[0].id, {
                  coupon: coupon.id,
                });

                // Update cycles used
                await supabaseAdmin
                  .from('referral_discounts')
                  .update({
                    cycles_used: discountData.cycles_used + 1,
                    stripe_coupon_id: coupon.id,
                  })
                  .eq('user_id', subData.user_id);

                console.log(`[STRIPE-WEBHOOK] Applied ${discountData.discount_percent}% discount coupon for user ${subData.user_id}`);
              }
            } catch (couponError) {
              console.error('[STRIPE-WEBHOOK] Error creating coupon:', couponError);
            }
          }
      }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(`[STRIPE-WEBHOOK] Payment failed for customer ${customerId}`);

        // Find user by customer ID
        const { data: subData } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (subData) {
          // Mark subscription as past_due (not cancelled yet)
          await supabaseAdmin
            .from('subscriptions')
            .update({ 
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', subData.user_id);

          console.log(`[STRIPE-WEBHOOK] Marked subscription as past_due for user ${subData.user_id}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

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

          console.log(`[STRIPE-WEBHOOK] Updated subscription status for user ${subData.user_id} to ${status}`);
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
          // Check if cancellation is within 7 days (fraud prevention)
          const createdAt = new Date(subscription.created * 1000);
          const now = new Date();
          const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

          if (daysSinceCreation < 7) {
            // Early cancellation - log fraud and revoke benefits
            console.log(`[STRIPE-WEBHOOK] Early cancellation detected for user ${subData.user_id}`);
            
            await supabaseAdmin
              .from('referral_fraud_logs')
              .insert({
                user_id: subData.user_id,
                fraud_type: 'early_cancellation',
                details: {
                  days_since_creation: daysSinceCreation,
                  subscription_id: subscription.id,
                },
                action_taken: 'rewards_revoked',
              });

            // Find and revoke referral
            const { data: referral } = await supabaseAdmin
              .from('referrals')
              .select('*')
              .eq('referred_user_id', subData.user_id)
              .eq('status', 'active')
              .single();

            if (referral) {
              await supabaseAdmin
                .from('referrals')
                .update({ status: 'revoked' })
                .eq('id', referral.id);

              // Revoke rewards
              await supabaseAdmin
                .from('referral_rewards')
                .update({ status: 'revoked' })
                .eq('referral_id', referral.id);

              // Reduce referrer's discount
              const { data: discountData } = await supabaseAdmin
                .from('referral_discounts')
                .select('*')
                .eq('user_id', referral.referrer_user_id)
                .single();

              if (discountData) {
                const newDiscount = Math.max(discountData.discount_percent - 15, 0);
                await supabaseAdmin
                  .from('referral_discounts')
                  .update({ discount_percent: newDiscount })
                  .eq('user_id', referral.referrer_user_id);
              }
            }
          }

          // Downgrade to free plan
          await supabaseAdmin
            .from('subscriptions')
            .update({
              plan_type: 'free',
              status: 'active',
              stripe_subscription_id: null,
              expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('user_id', subData.user_id);

          console.log(`[STRIPE-WEBHOOK] Downgraded user ${subData.user_id} to free plan`);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error:', error);
    
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
