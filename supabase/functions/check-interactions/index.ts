import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InteractionResult {
  id: string;
  drug_a: string;
  drug_b: string;
  severity: 'low' | 'moderate' | 'high' | 'contraindicated';
  description: string;
  recommendation: string | null;
  mechanism: string | null;
  item_a_name: string;
  item_b_name: string;
  item_a_id: string;
  item_b_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { medications, profile_id, new_medication } = await req.json();

    // Get user's active medications
    let activeItems = medications;
    
    if (!activeItems) {
      const query = supabase
        .from('items')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (profile_id) {
        query.eq('profile_id', profile_id);
      }
      
      const { data: items, error: itemsError } = await query;
      
      if (itemsError) {
        console.error('Error fetching items:', itemsError);
        throw itemsError;
      }
      
      activeItems = items || [];
    }

    // If checking a new medication against existing ones
    if (new_medication) {
      activeItems = [...activeItems, { id: 'new', name: new_medication }];
    }

    if (activeItems.length < 2) {
      return new Response(JSON.stringify({ interactions: [], total: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all medication interactions from database
    const { data: allInteractions, error: interactionsError } = await supabase
      .from('medication_interactions')
      .select('*');

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError);
      throw interactionsError;
    }

    const foundInteractions: InteractionResult[] = [];

    // Check each pair of medications
    for (let i = 0; i < activeItems.length; i++) {
      for (let j = i + 1; j < activeItems.length; j++) {
        const itemA = activeItems[i];
        const itemB = activeItems[j];
        
        const nameA = itemA.name.toLowerCase().trim();
        const nameB = itemB.name.toLowerCase().trim();

        // Search for interactions (check both directions)
        for (const interaction of allInteractions || []) {
          const drugA = interaction.drug_a.toLowerCase();
          const drugB = interaction.drug_b.toLowerCase();

          // Check if medication names contain the drug names
          const matchAB = (nameA.includes(drugA) || drugA.includes(nameA)) && 
                          (nameB.includes(drugB) || drugB.includes(nameB));
          const matchBA = (nameA.includes(drugB) || drugB.includes(nameA)) && 
                          (nameB.includes(drugA) || drugA.includes(nameB));

          if (matchAB || matchBA) {
            foundInteractions.push({
              id: interaction.id,
              drug_a: interaction.drug_a,
              drug_b: interaction.drug_b,
              severity: interaction.severity,
              description: interaction.description,
              recommendation: interaction.recommendation,
              mechanism: interaction.mechanism,
              item_a_name: itemA.name,
              item_b_name: itemB.name,
              item_a_id: itemA.id,
              item_b_id: itemB.id,
            });
            break; // Found an interaction for this pair
          }
        }
      }
    }

    // Sort by severity
    const severityOrder = { contraindicated: 0, high: 1, moderate: 2, low: 3 };
    foundInteractions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Save alerts for high/contraindicated interactions
    for (const interaction of foundInteractions) {
      if (interaction.severity === 'high' || interaction.severity === 'contraindicated') {
        // Check if alert already exists
        const { data: existingAlert } = await supabase
          .from('user_interaction_alerts')
          .select('id')
          .eq('user_id', user.id)
          .eq('interaction_id', interaction.id)
          .eq('item_a_id', interaction.item_a_id)
          .eq('item_b_id', interaction.item_b_id)
          .is('dismissed_at', null)
          .single();

        if (!existingAlert && interaction.item_a_id !== 'new' && interaction.item_b_id !== 'new') {
          await supabase.from('user_interaction_alerts').insert({
            user_id: user.id,
            profile_id: profile_id || null,
            interaction_id: interaction.id,
            item_a_id: interaction.item_a_id,
            item_b_id: interaction.item_b_id,
            severity: interaction.severity,
          });
        }
      }
    }

    console.log(`Found ${foundInteractions.length} interactions for user ${user.id}`);

    return new Response(JSON.stringify({ 
      interactions: foundInteractions, 
      total: foundInteractions.length,
      has_critical: foundInteractions.some(i => i.severity === 'contraindicated' || i.severity === 'high'),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error checking interactions:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});