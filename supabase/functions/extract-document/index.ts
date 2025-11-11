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
          details: "O arquivo deve ser legível e conter os dados da receita completos.",
          suggestion: "Verifique: 1) Formato do arquivo, 2) Qualidade da imagem, 3) Documento completo"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if PDF
    const isPDF = normalized.startsWith('data:application/pdf');
    if (isPDF) {
      console.log("📄 PDF detected - will be processed directly by AI model");
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

    // Specialized prompt for prescription documents - Expert AI extraction
    const prescriptionPrompt = `Você é um ESPECIALISTA MÉDICO em análise de DOCUMENTOS DE SAÚDE brasileiros (receitas, exames, vacinas, consultas).
${isPDF ? '⚠️ IMPORTANTE: Este é um arquivo PDF. Leia TODO o conteúdo do documento com máxima atenção.' : ''}
Sua tarefa é extrair TODOS os dados da receita com PRECISÃO MÁXIMA, palavra por palavra.

═══════════════════════════════════════════════════════════════
📋 INSTRUÇÕES DE EXTRAÇÃO
═══════════════════════════════════════════════════════════════

**COMPORTAMENTO OBRIGATÓRIO**:
✓ Extrair LITERALMENTE o que está escrito no documento
✓ Se um campo não existir ou não for legível, retornar null
✓ NUNCA inventar, adivinhar ou inferir dados que não estão no documento
✓ Para PDFs: analisar APENAS a primeira página
✓ Manter acentuação, pontuação e formatação originais dos nomes

═══════════════════════════════════════════════════════════════
📝 CAMPOS OBRIGATÓRIOS DA RECEITA
═══════════════════════════════════════════════════════════════

1. **prescriber_name** (string): 
   - Nome COMPLETO do médico prescritor exatamente como aparece
   - Incluir título (Dr., Dra.) se presente
   - Exemplo: "Dr. João Silva Santos"

2. **prescriber_registration** (string):
   - CRM COMPLETO com número E sigla do estado
   - Formato: "CRM 12345/SP" ou "CRM-SP 12345"
   - Se não houver estado, marcar como null

3. **patient_name** (string):
   - Nome COMPLETO do paciente
   - Exatamente como está escrito na receita
   - Se não estiver legível ou ausente: null

4. **issued_at** (string YYYY-MM-DD):
   - Data de emissão da receita
   - Converter para formato ISO: ano-mês-dia
   - Exemplos: "15/03/2024" → "2024-03-15"
   - Se ausente ou ilegível: usar data atual

5. **expires_at** (string YYYY-MM-DD):
   - Data de validade explícita OU calcular issued_at + 30 dias
   - Para receitas controladas: issued_at + 30 dias
   - Para receitas simples: issued_at + 180 dias (6 meses)
   - Formato ISO: "YYYY-MM-DD"

6. **category** (string):
   - SEMPRE: "receita"

7. **title** (string):
   - Formato: "Receita Médica - [Nome do Médico]"
   - Exemplo: "Receita Médica - Dr. João Silva"

8. **provider** (string ou null):
   - Nome da clínica, hospital ou consultório
   - Extrair do cabeçalho do documento
   - Se não houver: null

═══════════════════════════════════════════════════════════════
💊 MEDICAMENTOS PRESCRITOS (array "prescriptions")
═══════════════════════════════════════════════════════════════

Para CADA medicamento prescrito, criar um objeto com:

- **name_commercial** (string, OBRIGATÓRIO):
  → Nome comercial do medicamento EXATAMENTE como escrito
  → Manter maiúsculas/minúsculas originais
  → Exemplo: "Dipirona Sódica", "Amoxicilina", "RIVOTRIL"

- **generic_name** (string ou null):
  → Princípio ativo se mencionado entre parênteses
  → Exemplo: se escrito "Dipirona (dipirona sódica)", extrair "dipirona sódica"
  → Se não mencionado: null

- **dose_text** (string):
  → Dosagem COMPLETA com unidade
  → Exemplos: "500mg", "20mg/ml", "25mg", "1g"
  → Se não especificada: null

- **form** (string):
  → Forma farmacêutica do medicamento
  → Valores comuns: "comprimido", "cápsula", "xarope", "solução oral", 
    "pomada", "creme", "gotas", "injetável", "supositório"
  → Usar sempre minúsculas
  → Se não especificada: null

- **frequency** (string):
  → Posologia EXATA como prescrita
  → Exemplos: "8 em 8 horas", "2x ao dia", "1 comprimido pela manhã",
    "1 colher de chá a cada 6 horas", "aplicar 2x ao dia", "se necessário"
  → Manter formato original
  → Se não especificada: null

- **duration_days** (number ou null):
  → Duração do tratamento convertida para DIAS INTEIROS
  → Exemplos de conversão:
    • "por 7 dias" → 7
    • "durante 2 semanas" → 14
    • "por 1 mês" → 30
    • "uso contínuo" → null
    • "se necessário" → null
  → Se não especificada: null

- **instructions** (string ou null):
  → Instruções ESPECÍFICAS deste medicamento
  → Exemplos: "tomar com água", "em jejum", "após as refeições",
    "evitar exposição ao sol", "não consumir álcool"
  → Se não houver: null

═══════════════════════════════════════════════════════════════
📌 INSTRUÇÕES GERAIS DO MÉDICO
═══════════════════════════════════════════════════════════════

9. **instructions** (string ou null):
   - Observações gerais do médico que não são específicas de um medicamento
   - Recomendações adicionais, retornos, exames
   - Se não houver: null

═══════════════════════════════════════════════════════════════
✅ VALIDAÇÃO E QUALIDADE
═══════════════════════════════════════════════════════════════

**REGRAS CRÍTICAS**:
1. ❌ NUNCA retornar dados inventados ou assumidos
2. ✅ Usar null para campos ausentes ou ilegíveis  
3. ✅ Extrair TODOS os medicamentos prescritos (não apenas o primeiro)
4. ✅ Manter formato EXATO dos textos (acentos, maiúsculas)
5. ✅ Para CRM: OBRIGATÓRIO incluir número + UF
6. ✅ Para datas: converter sempre para formato ISO (YYYY-MM-DD)
7. ✅ Para duration_days: converter texto para número de dias
8. ✅ Se encontrar abreviações: manter como está (ex: "comp." = comprimido)

═══════════════════════════════════════════════════════════════
📤 FORMATO DE RETORNO (JSON)
═══════════════════════════════════════════════════════════════

Retornar APENAS JSON puro (sem markdown, sem \`\`\`json):

{
  "category": "receita",
  "title": "Receita Médica - Dr. [Nome]",
  "issued_at": "YYYY-MM-DD",
  "expires_at": "YYYY-MM-DD",
  "prescriber_name": "Nome completo do médico",
  "prescriber_registration": "CRM XXXXX/UF",
  "patient_name": "Nome completo do paciente",
  "provider": "Nome da clínica/hospital ou null",
  "prescriptions": [
    {
      "name_commercial": "Nome do medicamento",
      "generic_name": "Princípio ativo ou null",
      "dose_text": "Dosagem com unidade",
      "form": "forma farmacêutica",
      "frequency": "Posologia exata",
      "duration_days": 10,
      "instructions": "Instruções específicas ou null"
    }
  ],
  "instructions": "Observações gerais do médico ou null"
}`;

    // General document prompt (for non-prescription documents)
    const generalPrompt = `Você é um assistente médico especializado em extrair informações PRECISAS de documentos de saúde.
${isPDF ? '⚠️ IMPORTANTE: Este é um arquivo PDF. Leia TODO o conteúdo do documento com máxima atenção, palavra por palavra.' : ''}

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
      console.error("❌ AI API Error:", response.status, errorText);
      
      // Log API error
      try {
        await supabase.from('document_extraction_logs').insert({
          user_id: user.id,
          file_path: 'inline_extraction',
          mime_type: isPDF ? 'application/pdf' : 'image/jpeg',
          pages_count: 1,
          confidence_score: 0,
          extraction_type: 'api_error',
          status: 'failed',
          error_message: `AI API ${response.status}: ${errorText.substring(0, 200)}`,
          processing_time_ms: Date.now() - startTime
        });
      } catch (logErr) {
        console.error('Failed to log API error:', logErr);
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Muitas requisições. Aguarde alguns segundos e tente novamente.",
            retryAfter: 5
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 400 && errorText.includes('extract')) {
        return new Response(
          JSON.stringify({ 
            error: "Falha ao extrair imagem do documento",
            message: "O modelo de IA não conseguiu processar este arquivo.",
            details: "Tente converter o PDF para imagem de alta qualidade antes de enviar.",
            suggestion: "Use um scanner ou aplicativo de foto com boa iluminação"
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ AI Response received successfully");
    console.log("Response size:", JSON.stringify(data).length, "bytes");

    const content = data.choices?.[0]?.message?.content || "";
    
    if (!content) {
      console.error("❌ Empty response from AI");
      throw new Error("Resposta vazia da IA. Tente novamente.");
    }
    
    console.log("Content length:", content.length, "characters");
    
    // Parse JSON from response
    let extractedInfo;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error("❌ No JSON found in AI response");
        console.error("Response content:", content.substring(0, 500));
        throw new Error("No JSON found in AI response");
      }
      
      extractedInfo = JSON.parse(jsonMatch[0]);
      console.log("✅ JSON parsed successfully");
      
      // Validate required fields
      if (!extractedInfo.title) {
        console.warn("⚠️ Missing title, using default");
        extractedInfo.title = "Documento de Saúde";
      }
      if (!extractedInfo.category) {
        console.warn("⚠️ Missing category, using default");
        extractedInfo.category = "outro";
      }
      
      console.log("📊 Extracted data:", {
        category: extractedInfo.category,
        title: extractedInfo.title,
        hasPrescriptions: !!extractedInfo.prescriptions,
        prescriptionCount: extractedInfo.prescriptions?.length || 0,
        hasPatientName: !!extractedInfo.patient_name,
        hasPrescriberName: !!extractedInfo.prescriber_name
      });
    } catch (e) {
      console.error("❌ Failed to parse AI response:", e);
      console.error("Raw content:", content.substring(0, 1000));
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

    console.log(`📈 Extraction metrics:`, {
      confidence: confidence.toFixed(2),
      status,
      processingTime: `${processingTime}ms`,
      category: extractedInfo.category,
      isPDF: isPDF ? 'yes' : 'no'
    });

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
