import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find ALL customers by email (there might be multiple)
    const customers = await stripe.customers.list({ email: user.email, limit: 10 });
    
    if (customers.data.length === 0) {
      console.log("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false, synced: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Found ${customers.data.length} customer(s) for email ${user.email}`);
    
    // Check for active subscriptions across ALL customers with this email
    let activeSubscription = null;
    let customerId = null;

    for (const customer of customers.data) {
      console.log(`Checking customer: ${customer.id}`);
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });
      
      if (subscriptions.data.length > 0) {
        activeSubscription = subscriptions.data[0];
        customerId = customer.id;
        console.log(`Found active subscription: ${activeSubscription.id} for customer: ${customerId}`);
        break;
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (activeSubscription && customerId) {
      console.log("Updating database with subscription:", activeSubscription.id);

      // Update subscription in database
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          plan_type: "premium",
          status: "active",
          stripe_customer_id: customerId,
          stripe_subscription_id: activeSubscription.id,
          expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        throw updateError;
      }

      console.log("Successfully updated subscription to premium for user:", user.id);

      return new Response(JSON.stringify({ 
        subscribed: true, 
        plan_type: "premium",
        synced: true,
        subscription_id: activeSubscription.id,
        customer_id: customerId
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.log("No active subscription found for any customer with this email");
      return new Response(JSON.stringify({ subscribed: false, synced: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("Sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
