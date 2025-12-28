import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limits per plan (daily extractions)
const RATE_LIMITS = {
  free: 5,
  premium: 50,
};

// Max file size in MB
const MAX_FILE_SIZE_MB = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // 1. Authenticate user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse and validate input
    const { image } = await req.json();
    if (!image || typeof image !== 'string') {
      return new Response(
        JSON.stringify({ error: "Image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Validate file size
    const base64Data = image.split(',')[1] || image;
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (sizeInBytes > maxSizeBytes) {
      console.warn(`File too large: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB from user ${user.id}`);
      return new Response(
        JSON.stringify({ 
          error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE_MB}MB`,
          size_mb: (sizeInBytes / 1024 / 1024).toFixed(2)
        }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Validate MIME type
    if (image.startsWith('data:')) {
      const mimeMatch = image.match(/^data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : '';
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      
      if (mimeType && !allowedTypes.includes(mimeType)) {
        return new Response(
          JSON.stringify({ 
            error: `Tipo de arquivo inválido: ${mimeType}. Permitidos: JPEG, PNG, WebP`,
            received_type: mimeType
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 5. Check rate limit
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabaseClient
      .from('document_extraction_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('extraction_type', 'exam')
      .gte('created_at', today);

    const { data: sub } = await supabaseClient
      .from('subscriptions')
      .select('plan_type')
      .eq('user_id', user.id)
      .single();

    const planType = sub?.plan_type || 'free';
    const dailyLimit = planType === 'premium' ? RATE_LIMITS.premium : RATE_LIMITS.free;
    
    if (count !== null && count >= dailyLimit) {
      console.warn(`Rate limit exceeded for user ${user.id}: ${count}/${dailyLimit}`);
      return new Response(
        JSON.stringify({ 
          error: 'Limite diário de extrações atingido',
          limit: dailyLimit,
          used: count
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Process exam image
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log(`Processing exam for user ${user.id}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um assistente especializado em extrair informações de exames médicos.
Analise a imagem do exame e extraia:
1. Tipo de exame (hemograma, glicemia, colesterol, etc.)
2. Data do exame
3. Valores principais e seus resultados
4. Valores de referência quando disponíveis
5. Observações importantes

Retorne APENAS um JSON válido no formato:
{
  "exam_type": "tipo do exame",
  "exam_date": "data no formato YYYY-MM-DD",
  "results": [
    {
      "parameter": "nome do parâmetro",
      "value": "valor",
      "reference": "valor de referência",
      "unit": "unidade"
    }
  ],
  "notes": "observações importantes"
}

Se não conseguir identificar, retorne um JSON com campos vazios.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise este exame médico e extraia as informações solicitadas."
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      // Log failure
      await supabaseClient.from('document_extraction_logs').insert({
        user_id: user.id,
        extraction_type: 'exam',
        status: 'failed',
        file_path: 'inline',
        mime_type: 'image/jpeg',
        processing_time_ms: Date.now() - startTime,
        error_message: `API error: ${response.status}`
      });
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: "No content in AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse exam info" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Log successful extraction
    await supabaseClient.from('document_extraction_logs').insert({
      user_id: user.id,
      extraction_type: 'exam',
      status: 'success',
      file_path: 'inline',
      mime_type: 'image/jpeg',
      processing_time_ms: Date.now() - startTime
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-exam function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
