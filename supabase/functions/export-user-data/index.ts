import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    console.log('Exporting data for user:', user.id);

    // Fetch all user data with proper error handling
    const profileData = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    const userProfilesData = await supabase.from('user_profiles').select('*').eq('user_id', user.id);
    const itemsData = await supabase.from('items').select('*').eq('user_id', user.id);
    
    // Get schedules through items
    const { data: items } = itemsData;
    const itemIds = items?.map(i => i.id) || [];
    const schedulesData = itemIds.length > 0 
      ? await supabase.from('schedules').select('*').in('item_id', itemIds)
      : { data: [], error: null };
    
    const doseInstancesData = itemIds.length > 0
      ? await supabase.from('dose_instances').select('*').in('item_id', itemIds)
      : { data: [], error: null };
    
    const stockData = itemIds.length > 0
      ? await supabase.from('stock').select('*').in('item_id', itemIds)
      : { data: [], error: null };
    
    const healthHistoryData = await supabase.from('health_history').select('*').eq('user_id', user.id);
    const medicalExamsData = await supabase.from('medical_exams').select('*').eq('user_id', user.id);
    const documentosData = await supabase.from('documentos_saude').select('*').eq('user_id', user.id);
    const compartilhamentosData = await supabase.from('compartilhamentos_doc').select('*').eq('user_id', user.id);
    const eventosData = await supabase.from('eventos_saude').select('*').eq('user_id', user.id);
    const healthInsightsData = await supabase.from('health_insights').select('*').eq('user_id', user.id);
    const consentsData = await supabase.from('consents').select('*').eq('user_id', user.id);
    const subscriptionData = await supabase.from('subscriptions').select('*').eq('user_id', user.id);
    const notificationPrefsData = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle();
    const notificationMetricsData = await supabase.from('notification_metrics').select('*').eq('user_id', user.id).limit(100);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profileData.data || null,
      user_profiles: userProfilesData.data || [],
      medications: itemsData.data || [],
      schedules: schedulesData.data || [],
      dose_history: doseInstancesData.data || [],
      stock: stockData.data || [],
      health_history: healthHistoryData.data || [],
      medical_exams: medicalExamsData.data || [],
      health_documents: documentosData.data || [],
      shared_documents: compartilhamentosData.data || [],
      health_events: eventosData.data || [],
      health_insights: healthInsightsData.data || [],
      consents: consentsData.data || [],
      subscription: subscriptionData.data || [],
      notification_preferences: notificationPrefsData.data || null,
      notification_metrics: notificationMetricsData.data || [],
      
      data_summary: {
        total_medications: itemsData.data?.length || 0,
        total_doses_recorded: doseInstancesData.data?.length || 0,
        total_documents: documentosData.data?.length || 0,
        total_exams: medicalExamsData.data?.length || 0,
        total_profiles: (userProfilesData.data?.length || 0) + 1,
      }
    };

    console.log('Export completed successfully');

    return new Response(
      JSON.stringify(exportData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="horamed-export-${new Date().toISOString().split('T')[0]}.json"`
        } 
      }
    );

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
