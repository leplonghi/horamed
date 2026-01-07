import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) throw new Error('Not authenticated');

    const { medicationName } = await req.json();

    // Simulação de preços de farmácias (em produção, integrar com APIs reais)
    const pharmacies = [
      { name: 'Drogasil', price: Math.random() * 50 + 10, link: `https://www.drogasil.com.br/search?w=${encodeURIComponent(medicationName)}`, delivery: true, distance: Math.random() * 5 },
      { name: 'Droga Raia', price: Math.random() * 50 + 10, link: `https://www.drogaraia.com.br/search?w=${encodeURIComponent(medicationName)}`, delivery: true, distance: Math.random() * 5 },
      { name: 'Pacheco', price: Math.random() * 50 + 10, link: `https://www.drogariaspacheco.com.br/search?w=${encodeURIComponent(medicationName)}`, delivery: true, distance: Math.random() * 5 },
      { name: 'Pague Menos', price: Math.random() * 50 + 10, link: `https://www.paguemenos.com.br/busca?q=${encodeURIComponent(medicationName)}`, delivery: true, distance: Math.random() * 5 },
      { name: 'Onofre', price: Math.random() * 50 + 10, link: `https://www.onofre.com.br/busca?q=${encodeURIComponent(medicationName)}`, delivery: false, distance: Math.random() * 5 },
    ];

    // Ordenar por preço
    pharmacies.sort((a, b) => a.price - b.price);

    const lowestPrice = pharmacies[0].price;
    const highestPrice = pharmacies[pharmacies.length - 1].price;
    const savings = highestPrice - lowestPrice;

    return new Response(JSON.stringify({
      medication: medicationName,
      pharmacies: pharmacies.map(p => ({
        ...p,
        price: parseFloat(p.price.toFixed(2)),
        distance: parseFloat(p.distance.toFixed(1)),
      })),
      savings: parseFloat(savings.toFixed(2)),
      lowestPrice: parseFloat(lowestPrice.toFixed(2)),
      highestPrice: parseFloat(highestPrice.toFixed(2)),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
