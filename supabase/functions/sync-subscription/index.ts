import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.4.0?target=deno";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find ALL customers by email (there might be multiple)
    const customers = await stripe.customers.list({ email: user.email, limit: 10 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, keeping current subscription");
      return new Response(JSON.stringify({ subscribed: false, synced: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep(`Found ${customers.data.length} customer(s)`, { email: user.email });
    
    // Check for active OR trialing subscriptions across ALL customers
    let activeSubscription: Stripe.Subscription | null = null;
    let canceledSubscription: Stripe.Subscription | null = null;
    let customerId: string | null = null;

    for (const customer of customers.data) {
      logStep(`Checking customer`, { customerId: customer.id });
      
      // Check for active or trialing subscriptions
      const activeSubscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });
      
      if (activeSubscriptions.data.length > 0) {
        activeSubscription = activeSubscriptions.data[0];
        customerId = customer.id;
        logStep(`Found active subscription`, { 
          subscriptionId: activeSubscription.id, 
          customerId,
          status: activeSubscription.status,
          cancelAtPeriodEnd: activeSubscription.cancel_at_period_end
        });
        break;
      }

      // Check for trialing subscriptions
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "trialing",
        limit: 1,
      });
      
      if (trialingSubscriptions.data.length > 0) {
        activeSubscription = trialingSubscriptions.data[0];
        customerId = customer.id;
        logStep(`Found trialing subscription`, { 
          subscriptionId: activeSubscription.id, 
          customerId 
        });
        break;
      }

      // Check for canceled subscriptions (to get end date)
      const canceledSubscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "canceled",
        limit: 1,
      });
      
      if (canceledSubscriptions.data.length > 0 && !canceledSubscription) {
        canceledSubscription = canceledSubscriptions.data[0];
        customerId = customer.id;
        logStep(`Found canceled subscription`, { 
          subscriptionId: canceledSubscription.id,
          canceledAt: canceledSubscription.canceled_at
        });
      }
    }

    if (activeSubscription && customerId) {
      logStep("Updating database with active subscription", { 
        subscriptionId: activeSubscription.id 
      });

      // Determine if subscription is canceled but still active until period end
      const isCanceledButActive = activeSubscription.cancel_at_period_end;
      const periodEnd = activeSubscription.current_period_end 
        ? new Date(activeSubscription.current_period_end * 1000).toISOString()
        : null;
      const canceledAt = activeSubscription.canceled_at 
        ? new Date(activeSubscription.canceled_at * 1000).toISOString()
        : null;

      // Determine if on trial
      const isTrialing = activeSubscription.status === "trialing";
      const trialEnd = activeSubscription.trial_end 
        ? new Date(activeSubscription.trial_end * 1000).toISOString()
        : null;

      // Upsert subscription in database (insert or update)
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan_type: "premium",
          status: isTrialing ? "trial" : "active",
          stripe_customer_id: customerId,
          stripe_subscription_id: activeSubscription.id,
          started_at: new Date(activeSubscription.start_date * 1000).toISOString(),
          expires_at: isCanceledButActive ? periodEnd : null,
          trial_ends_at: trialEnd,
          trial_used: isTrialing || !!trialEnd,
          canceled_at: canceledAt,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        });

      if (updateError) {
        logStep("Error updating subscription", { error: updateError.message });
        throw updateError;
      }

      logStep("Successfully updated subscription to premium", { 
        userId: user.id,
        isTrialing,
        isCanceledButActive,
        periodEnd
      });

      return new Response(JSON.stringify({ 
        subscribed: true, 
        plan_type: "premium",
        status: isTrialing ? "trial" : "active",
        synced: true,
        subscription_id: activeSubscription.id,
        customer_id: customerId,
        expires_at: isCanceledButActive ? periodEnd : null,
        trial_ends_at: trialEnd,
        canceled_at: canceledAt
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // No active subscription - check if we need to downgrade
      logStep("No active subscription found, checking if downgrade needed");
      
      // Get current subscription from database
      const { data: currentSub } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (currentSub && currentSub.plan_type === "premium") {
        logStep("Downgrading from premium to free", { 
          previousPlan: currentSub.plan_type,
          stripeSubscriptionId: currentSub.stripe_subscription_id
        });

        // Downgrade to free plan
        const { error: downgradeError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            plan_type: "free",
            status: "active",
            stripe_subscription_id: null,
            expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days free
            canceled_at: canceledSubscription?.canceled_at 
              ? new Date(canceledSubscription.canceled_at * 1000).toISOString()
              : new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (downgradeError) {
          logStep("Error downgrading subscription", { error: downgradeError.message });
          throw downgradeError;
        }

        logStep("Successfully downgraded to free plan", { userId: user.id });

        return new Response(JSON.stringify({ 
          subscribed: false, 
          plan_type: "free",
          synced: true,
          downgraded: true,
          message: "Subscription expired or canceled, downgraded to free plan"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      logStep("User already on free plan or no subscription");
      return new Response(JSON.stringify({ subscribed: false, synced: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
