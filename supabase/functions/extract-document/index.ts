import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isValidDocumentFormat(s: string): boolean {
  return /^data:(image\/(png|jpeg|jpg|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/i.test(s);
}

function maybeNormalizeBase64(s: string): string {
  if (/^[A-Za-z0-9+/=]+$/.test(s)) return `data:image/jpeg;base64,${s}`;
  return s;
}

async function generateImageHash(imageData: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(imageData);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, documentType = 'auto' } = await req.json();

    if (!image || typeof image !== "string") {
      return new Response(
        JSON.stringify({ error: "Envie { image: string }." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalized = maybeNormalizeBase64(image);
    if (!isValidDocumentFormat(normalized)) {
      console.error("Invalid format:", normalized.substring(0, 50));
      return new Response(
        JSON.stringify({ 
          error: "Formato inválido. Envie uma imagem nítida (JPEG, PNG, WEBP) ou PDF de 1 página.",
          details: "O arquivo deve ser legível e conter os dados da receita completos."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if PDF
    const isPDF = normalized.startsWith('data:application/pdf');
    if (isPDF) {
      console.log("PDF detected - will process first page");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageHash = await generateImageHash(normalized);
    console.log("Document hash generated:", imageHash);

    // Check cache for existing extraction
    const { data: cachedData, error: cacheError } = await supabase
      .from("extraction_cache")
      .select("extracted_data")
      .eq("user_id", user.id)
      .eq("image_hash", imageHash)
      .eq("extraction_type", "document")
      .maybeSingle();

    if (cachedData && !cacheError) {
      console.log("Cache hit! Returning cached extraction");
      return new Response(
        JSON.stringify({ ...cachedData.extracted_data, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Cache miss. Processing document...");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Specialized prompt for prescription documents
    const prescriptionPrompt = `Você é um especialista em análise de RECEITAS MÉDICAS. Analise este documento e extraia TODOS os dados estruturados.

**CAMPOS ESSENCIAIS DA RECEITA**:
1. **prescriber_name**: Nome COMPLETO do médico prescritor
2. **prescriber_registration**: CRM completo com UF (ex: "CRM 12345/SP")
3. **patient_name**: Nome COMPLETO do paciente
4. **issued_at**: Data de emissão da receita (formato: YYYY-MM-DD)
5. **expires_at**: Data de validade (se não houver, calcule: issued_at + 30 dias)
6. **category**: SEMPRE "receita"
7. **title**: "Receita Médica - [Nome do Médico]"
8. **provider**: Nome da clínica/hospital (se houver)

**MEDICAMENTOS PRESCRITOS** (array "prescriptions"):
Para CADA medicamento, extraia:
- **name_commercial**: Nome comercial do medicamento (obrigatório)
- **generic_name**: Princípio ativo (se mencionado)
- **dose_text**: Dosagem completa (ex: "500mg", "20mg/ml")
- **form**: Forma farmacêutica (comprimido, cápsula, xarope, pomada, etc)
- **frequency**: Posologia exata (ex: "8 em 8 horas", "2x ao dia", "1x pela manhã")
- **duration_days**: Duração do tratamento em dias inteiros
- **instructions**: Instruções específicas (tomar com água, em jejum, após refeições, etc)

**INSTRUÇÕES GERAIS**:
9. **instructions**: Observações gerais do médico (se houver)

**REGRAS CRÍTICAS**:
- Se for PDF, analise APENAS a primeira página
- Extraia TODOS os medicamentos prescritos
- Para duration_days: se diz "por 10 dias", retorne 10
- Se frequency for "se necessário" ou "SOS", mantenha como está
- Seja PRECISO com CRM (deve incluir número E estado)
- NUNCA invente dados - use null se não encontrar

Retorne APENAS JSON puro, sem markdown:
{
  "category": "receita",
  "title": "Receita Médica - Dr. Nome",
  "issued_at": "YYYY-MM-DD",
  "expires_at": "YYYY-MM-DD",
  "prescriber_name": "Nome completo",
  "prescriber_registration": "CRM XXXXX/UF",
  "patient_name": "Nome do paciente",
  "provider": "Nome da clínica ou null",
  "prescriptions": [
    {
      "name_commercial": "Nome do medicamento",
      "generic_name": "Princípio ativo ou null",
      "dose_text": "Dosagem",
      "form": "Forma farmacêutica",
      "frequency": "Frequência de uso",
      "duration_days": número ou null,
      "instructions": "Instruções específicas ou null"
    }
  ],
  "instructions": "Observações gerais ou null"
}`;

    // General document prompt (for non-prescription documents)
    const generalPrompt = `Você é um assistente médico especializado em extrair informações PRECISAS de documentos de saúde.

Analise CUIDADOSAMENTE este documento e extraia as seguintes informações em formato JSON:

1. **title**: Nome EXATO do exame/documento como aparece no cabeçalho (obrigatório)
2. **issued_at**: Data de COLETA/EMISSÃO do documento (YYYY-MM-DD)
3. **expires_at**: Data de validade (YYYY-MM-DD) - APENAS se explicitamente mencionada
4. **provider**: Nome COMPLETO do laboratório/clínica/hospital
5. **category**: Classifique CORRETAMENTE:
   - "exame": Exames laboratoriais, de imagem
   - "receita": Prescrições médicas
   - "vacinacao": Cartões de vacinação
   - "consulta": Relatórios de consultas
   - "outro": Atestados, declarações
6. **extracted_values**: Array de TODOS os valores numéricos (para exames)
7. **medications**: Array de medicamentos (para receitas)

Retorne APENAS JSON puro, sem markdown.`;

    const prompt = documentType === 'receita' ? prescriptionPrompt : generalPrompt;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Analise este documento COM ATENÇÃO e extraia TODAS as informações com PRECISÃO:" 
              },
              { type: "image_url", image_url: { url: normalized } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API Error:", errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Muitas requisições. Aguarde alguns segundos e tente novamente.",
            retryAfter: 5
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("AI Response received");

    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    let extractedInfo;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }
      
      extractedInfo = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!extractedInfo.title) {
        extractedInfo.title = "Documento de Saúde";
      }
      if (!extractedInfo.category) {
        extractedInfo.category = "outro";
      }
      
      console.log("Extracted data:", JSON.stringify(extractedInfo, null, 2));
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      throw new Error("Erro ao processar resposta da IA. Tente novamente com imagem mais nítida.");
    }

    // Calculate confidence score
    let confidence = 0.85;
    
    if (extractedInfo.category === 'receita') {
      // Stricter validation for prescriptions
      if (!extractedInfo.prescriber_name) confidence -= 0.25;
      if (!extractedInfo.prescriber_registration) confidence -= 0.15;
      if (!extractedInfo.patient_name) confidence -= 0.15;
      if (!extractedInfo.prescriptions || extractedInfo.prescriptions.length === 0) confidence -= 0.3;
      if (!extractedInfo.issued_at) confidence -= 0.15;
    } else {
      if (!extractedInfo.title || !extractedInfo.category) confidence -= 0.2;
      if (!extractedInfo.issued_at) confidence -= 0.15;
      if (!extractedInfo.provider) confidence -= 0.1;
    }

    confidence = Math.max(0, Math.min(1, confidence));
    const status = confidence >= 0.7 ? 'pending_review' : 'failed';
    const processingTime = Date.now() - startTime;

    console.log(`Confidence: ${confidence.toFixed(2)}, Status: ${status}, Time: ${processingTime}ms`);

    // Log extraction attempt
    const logData = {
      user_id: user.id,
      file_path: 'inline_extraction',
      mime_type: isPDF ? 'application/pdf' : 'image/jpeg',
      pages_count: 1,
      confidence_score: confidence,
      extraction_type: extractedInfo.category || 'unknown',
      status: confidence >= 0.7 ? 'success' : 'low_confidence',
      extracted_fields: extractedInfo,
      processing_time_ms: processingTime
    };

    try {
      await supabase
        .from('document_extraction_logs')
        .insert(logData);
      console.log("Extraction logged");
    } catch (logError) {
      console.error("Failed to log extraction:", logError);
    }

    // Save to cache
    try {
      await supabase
        .from("extraction_cache")
        .insert({
          user_id: user.id,
          image_hash: imageHash,
          extraction_type: "document",
          extracted_data: { ...extractedInfo, confidence, status }
        });
      console.log("Saved to cache");
    } catch (cacheError) {
      console.error("Failed to save to cache:", cacheError);
    }

    return new Response(
      JSON.stringify({
        ...extractedInfo,
        confidence,
        status,
        cached: false,
        processingTime: `${processingTime}ms`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error("Error in extract-document:", error);

    // Log failed extraction
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          await supabase
            .from('document_extraction_logs')
            .insert({
              user_id: user.id,
              file_path: 'inline_extraction',
              mime_type: 'unknown',
              pages_count: 1,
              confidence_score: 0,
              extraction_type: 'unknown',
              status: 'failed',
              error_message: error.message,
              processing_time_ms: processingTime
            });
        }
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({ 
        error: "Não foi possível extrair os dados deste documento",
        message: "Por favor, envie uma imagem nítida ou PDF de 1 página com texto legível.",
        details: error.message,
        suggestion: "Tente: 1) Melhor iluminação, 2) Foco adequado, 3) Scanner para PDFs"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
