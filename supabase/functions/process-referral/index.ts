import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { action, referralCode, deviceFingerprint, ipAddress } = await req.json();
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    console.log(`[PROCESS-REFERRAL] Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'validate_signup': {
        // Validate referral on signup
        const { data: result, error } = await supabaseAdmin.rpc('validate_referral_signup', {
          p_referred_user_id: user.id,
          p_referral_code: referralCode,
          p_device_fingerprint: deviceFingerprint,
          p_ip_address: ipAddress || '0.0.0.0',
        });

        if (error) {
          console.error('[PROCESS-REFERRAL] Validation error:', error);
          throw error;
        }

        console.log('[PROCESS-REFERRAL] Validation result:', result);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      case 'complete_onboarding': {
        // Complete onboarding and activate referral benefits
        const { data: result, error } = await supabaseAdmin.rpc('complete_referral_onboarding', {
          p_user_id: user.id,
        });

        if (error) {
          console.error('[PROCESS-REFERRAL] Onboarding error:', error);
          throw error;
        }

        console.log('[PROCESS-REFERRAL] Onboarding result:', result);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      case 'get_stats': {
        // Get referral statistics for dashboard
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('referral_code')
          .eq('user_id', user.id)
          .single();

        const { data: referrals } = await supabaseClient
          .from('referrals')
          .select('*')
          .eq('referrer_user_id', user.id);

        const { data: goals } = await supabaseClient
          .from('referral_goals')
          .select('*')
          .eq('user_id', user.id);

        const { data: discount } = await supabaseClient
          .from('referral_discounts')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const result = {
          referralCode: profile?.referral_code,
          referrals: referrals || [],
          goals: goals || [],
          discount: discount || null,
        };

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[PROCESS-REFERRAL] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
