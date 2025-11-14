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
- prescriptions: Array com TODOS os medicamentos:
  [{"drug_name":"Amoxicilina","dose":"500mg","frequency":"8/8h","duration_days":7}]
- doctor_name: Nome completo do médico
- doctor_registration: CRM ou registro profissional

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
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    console.log("Sending to AI (PDF detection:", isPDF, ")");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: [
          { role: "system", content: PROMPT },
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Analise este documento de saúde e extraia TODAS as informações em formato JSON:" 
              },
              { 
                type: "image_url", 
                image_url: { url: processedImage } 
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.error("AI Error:", response.status);
      return new Response(
        JSON.stringify({ error: "Erro ao processar imagem" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
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
