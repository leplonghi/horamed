import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
- vaccine_name: Nome da vacina
- dose_number: Número da dose (1ª, 2ª, etc)
- application_date: Data da aplicação (YYYY-MM-DD)
- next_dose_date: Data da próxima dose (YYYY-MM-DD) ou null
- vaccination_location: Local onde foi aplicada
- batch_number: Número do lote

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

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(
        JSON.stringify({ error: "Image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Detect if it's a PDF or image
    const isPDF = image.includes('application/pdf') || image.startsWith('data:application/pdf');
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

    console.log("Sending to Google Gemini 2.5 (PDF detection:", isPDF, ")");
    
    // Prepare the request body for Google Gemini API
    const parts: any[] = [
      { text: PROMPT + "\n\nAnalise este documento de saúde e extraia TODAS as informações em formato JSON:" }
    ];
    
    if (isPDF) {
      // For PDFs, send as inline data
      const base64Data = processedImage.split(',')[1];
      parts.push({
        inline_data: {
          mime_type: "application/pdf",
          data: base64Data
        }
      });
    } else {
      // For images
      const base64Data = processedImage.split(',')[1];
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: base64Data
        }
      });
    }

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
