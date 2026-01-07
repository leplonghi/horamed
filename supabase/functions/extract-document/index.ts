import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

const PROMPT = `Analise este documento de saúde (imagem ou PDF) e extraia TODAS as informações em JSON estruturado:

CAMPOS OBRIGATÓRIOS:
- title: Título/Nome do documento (ex: "Hemograma Completo", "Receita Médica")
- category: "exame"|"receita"|"vacinacao"|"consulta"|"outro"
- issued_at: Data de emissão (formato YYYY-MM-DD)
- expires_at: Data de validade/expiração (YYYY-MM-DD) ou null se não aplicável
- provider: Nome da instituição/clínica/hospital/laboratório
- confidence_score: Número entre 0 e 1 indicando confiança na extração (use 0.9+ para documentos muito claros, 0.7-0.9 para razoáveis, <0.7 para duvidosos)

CAMPOS ESPECÍFICOS POR CATEGORIA:

EXAME:
- extracted_values: Array com TODOS os parâmetros encontrados:
  [{"parameter":"Hemoglobina","value":14.5,"unit":"g/dL","reference_range":"12-16","status":"normal"}]
  * status deve ser "normal", "high", "low" ou "critical" baseado na faixa de referência

RECEITA:
- prescriptions: Array com TODOS os medicamentos prescritos:
   [{"drug_name":"Amoxicilina","commercial_name":"Amoxil","dose":"500mg","frequency":"8/8h","duration":"7 dias","duration_days":7,"instructions":"Tomar com água","with_food":true,"is_generic":true,"package_type":"caixa","package_quantity":"21 comprimidos","packages_count":2,"active_ingredient":"Amoxicilina triidratada"}]
   * drug_name: nome do princípio ativo ou medicamento
   * commercial_name: nome comercial do medicamento (se houver)
   * is_generic: true se for genérico, false se for referência/similar
   * package_type: tipo de embalagem (caixa, frasco, envelope, etc)
   * package_quantity: quantidade na embalagem (ex: "30 comprimidos", "120ml", "10 ampolas")
   * packages_count: número de embalagens prescritas (ex: 2 caixas, 1 frasco)
   * active_ingredient: princípio ativo do medicamento
   * duration_days deve ser o número de dias do tratamento
   * with_food: true se deve tomar com alimentos, false ou null caso contrário
   * instructions: instruções adicionais sobre como tomar

IDENTIFICAÇÃO DO EMITENTE (dados da clínica/hospital/consultório):
- emitter_name: Nome da instituição/clínica/hospital
- emitter_address: Endereço completo
- emitter_city: Cidade
- emitter_state: Estado
- emitter_zip: CEP
- emitter_phone: Telefone
- emitter_cnpj: CNPJ da instituição (se houver)

DADOS DO MÉDICO:
- doctor_name: Nome completo do médico
- doctor_registration: CRM ou registro profissional
- doctor_state: Estado do CRM (ex: CRM/SP)
- specialty: Especialidade do médico (se informada)

DADOS DO PACIENTE:
- patient_name: Nome completo do paciente
- patient_age: Idade do paciente
- patient_cpf: CPF do paciente (se informado)
- patient_address: Endereço do paciente (se informado)

OUTROS CAMPOS:
- diagnosis: Diagnóstico ou condição sendo tratada (se informada)
- notes: Observações ou recomendações adicionais do médico
- followup_date: Data de retorno/revisão (YYYY-MM-DD) ou null
- prescription_type: "simples"|"controlada"|"especial" baseado no tipo de receituário

VACINAÇÃO:
- vaccines: Array com TODAS as vacinas encontradas no documento:
  [{"vaccine_name":"BCG","disease_prevention":"Tuberculose","dose_description":"Dose única","application_date":"2024-01-15","next_dose_date":null,"vaccination_location":"UBS Centro","vaccinator_name":"João Silva","batch_number":"L123456","manufacturer":"Butantan","notes":"Sem reações"}]
  * vaccine_name: nome completo da vacina (ex: BCG, Hepatite B, Tríplice Viral)
  * disease_prevention: doença(s) que a vacina previne
  * dose_description: descrição da dose (ex: "1ª dose", "2ª dose", "Reforço", "Dose única")
  * application_date: data da aplicação (YYYY-MM-DD)
  * next_dose_date: data da próxima dose se informada (YYYY-MM-DD) ou null
  * vaccination_location: local onde foi aplicada (posto de saúde, clínica)
  * vaccinator_name: nome do vacinador/profissional
  * vaccinator_registration: registro profissional (COREN, etc)
  * batch_number: número do lote da vacina
  * manufacturer: fabricante da vacina (ex: Butantan, Fiocruz, Pfizer)
  * notes: observações ou reações adversas relatadas

CONSULTA:
- doctor_name: Nome do médico
- specialty: Especialidade médica
- diagnosis: Diagnóstico ou avaliação
- notes: Observações/anotações importantes
- followup_date: Data de retorno (YYYY-MM-DD) ou null

IMPORTANTE:
- Extraia TODO o texto relevante, não apenas parte
- Para PDFs com múltiplas páginas, consolide todas as informações
- Se o documento estiver em português, mantenha os nomes em português
- Use "outro" como category apenas se realmente não se encaixar nas outras
- Retorne APENAS o JSON, sem texto adicional`;

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
    const isPDF = image.includes('application/pdf') || image.startsWith('data:application/pdf');
    if (image.startsWith('data:')) {
      const mimeMatch = image.match(/^data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : '';
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      
      if (mimeType && !allowedTypes.includes(mimeType)) {
        return new Response(
          JSON.stringify({ 
            error: `Tipo de arquivo inválido: ${mimeType}. Permitidos: JPEG, PNG, WebP, PDF`,
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
      .eq('extraction_type', 'document')
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

    // 6. Process document
    let processedImage = image;
    if (!image.startsWith('data:')) {
      processedImage = isPDF ? `data:application/pdf;base64,${image}` : `data:image/jpeg;base64,${image}`;
    }
    
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google AI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing document for user ${user.id} (PDF: ${isPDF})`);
    
    const parts: any[] = [
      { text: PROMPT + "\n\nAnalise este documento de saúde e extraia TODAS as informações em formato JSON:" }
    ];
    
    const base64Content = processedImage.split(',')[1];
    parts.push({
      inline_data: {
        mime_type: isPDF ? "application/pdf" : "image/jpeg",
        data: base64Content
      }
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: parts
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google AI Error:", response.status, errorText);
      
      // Log failure
      await supabaseClient.from('document_extraction_logs').insert({
        user_id: user.id,
        extraction_type: 'document',
        status: 'failed',
        file_path: 'inline',
        mime_type: isPDF ? 'application/pdf' : 'image/jpeg',
        processing_time_ms: Date.now() - startTime,
        error_message: `API error: ${response.status}`
      });
      
      return new Response(
        JSON.stringify({ error: "Erro ao processar documento com Gemini", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("No JSON in response");
    }
    
    const extractedInfo = JSON.parse(jsonMatch[0]);
    
    // Defaults
    if (!extractedInfo.title) extractedInfo.title = "Documento de Saúde";
    if (!extractedInfo.category) extractedInfo.category = "outro";
    if (!extractedInfo.confidence_score) extractedInfo.confidence_score = 0.5;
    if (!extractedInfo.extracted_values) extractedInfo.extracted_values = [];
    if (!extractedInfo.prescriptions) extractedInfo.prescriptions = [];

    // 7. Log successful extraction
    await supabaseClient.from('document_extraction_logs').insert({
      user_id: user.id,
      extraction_type: 'document',
      status: 'success',
      file_path: 'inline',
      mime_type: isPDF ? 'application/pdf' : 'image/jpeg',
      processing_time_ms: Date.now() - startTime,
      confidence_score: extractedInfo.confidence_score
    });

    return new Response(
      JSON.stringify(extractedInfo),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in extract-document:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process document" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
