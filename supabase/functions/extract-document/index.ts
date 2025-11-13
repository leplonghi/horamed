import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate and clean base64 image
function validateAndCleanBase64(image: string): string {
  try {
    // Remove any whitespace
    let cleaned = image.trim();
    
    // Check if it's already a data URL
    if (cleaned.startsWith('data:')) {
      // Validate it has the correct format
      const match = cleaned.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
      if (!match) {
        throw new Error("Invalid data URL format");
      }
      return cleaned;
    }
    
    // If it's raw base64, add the data URL prefix
    // Try to detect if it's valid base64
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    if (!base64Regex.test(cleaned.substring(0, 100))) {
      throw new Error("Invalid base64 format");
    }
    
    // Default to JPEG if no prefix
    return `data:image/jpeg;base64,${cleaned}`;
  } catch (error) {
    console.error("Base64 validation error:", error);
    throw new Error("Invalid image format");
  }
}

// Check image size (base64 length as proxy for size)
function checkImageSize(base64String: string): void {
  // Remove data URL prefix to get actual base64
  const base64Data = base64String.split(',')[1] || base64String;
  
  // Rough estimate: base64 is ~1.33x the original size
  const estimatedSizeInBytes = (base64Data.length * 3) / 4;
  const estimatedSizeInMB = estimatedSizeInBytes / (1024 * 1024);
  
  console.log(`Estimated image size: ${estimatedSizeInMB.toFixed(2)} MB`);
  
  // Warn if image is large (over 10MB)
  if (estimatedSizeInMB > 10) {
    console.warn(`Large image detected: ${estimatedSizeInMB.toFixed(2)} MB - may cause processing issues`);
  }
  
  // Reject if over 20MB
  if (estimatedSizeInMB > 20) {
    throw new Error(`Image too large: ${estimatedSizeInMB.toFixed(2)} MB. Maximum size is 20MB.`);
  }
}

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

    console.log("Validating image format...");
    
    // Validate and clean the image
    let processedImage: string;
    try {
      processedImage = validateAndCleanBase64(image);
      checkImageSize(processedImage);
    } catch (validationError: any) {
      console.error("Image validation failed:", validationError.message);
      return new Response(
        JSON.stringify({ 
          error: `Formato de imagem inválido: ${validationError.message}`,
          hint: "Envie uma imagem PNG ou JPEG válida com menos de 20MB"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const prompt = `Você é um assistente médico especializado em extrair informações PRECISAS de documentos de saúde.

Analise CUIDADOSAMENTE este documento e extraia as seguintes informações em formato JSON:

**CAMPOS COMUNS (obrigatórios):**
1. **title**: Nome EXATO do documento como aparece no cabeçalho
2. **category**: Tipo do documento - "exame" | "receita" | "vacinacao" | "consulta" | "outro"
3. **issued_at**: Data de emissão/coleta (YYYY-MM-DD)
4. **expires_at**: Data de validade (YYYY-MM-DD) ou null
5. **provider**: Nome do laboratório/clínica/hospital
6. **confidence_score**: Score de 0 a 1 baseado na qualidade da extração

**CAMPOS ESPECÍFICOS POR TIPO:**

Se category = "exame":
  - "extracted_values": Array de TODOS os parâmetros do exame
    Formato: [{"parameter": "Nome", "value": 14.5, "unit": "g/dL", "reference_range": "12-16", "status": "normal|high|low"}]

Se category = "receita":
  - "prescriptions": Array de medicamentos prescritos
    Formato: [{"drug_name": "Amoxicilina", "dose": "500mg", "frequency": "8/8h", "duration_days": 7, "observations": "com alimento"}]
  - "doctor_name": Nome do médico prescritor
  - "doctor_registration": CRM do médico

Se category = "vacinacao":
  - "vaccine_name": Nome da vacina (ex: "COVID-19", "Influenza")
  - "dose_number": Número da dose (ex: "1ª dose", "2ª dose", "Reforço")
  - "application_date": Data da aplicação (YYYY-MM-DD)
  - "next_dose_date": Próxima dose se indicado (YYYY-MM-DD) ou null
  - "vaccination_location": Local de aplicação
  - "batch_number": Lote da vacina se disponível

Se category = "consulta":
  - "doctor_name": Nome do médico
  - "specialty": Especialidade médica
  - "diagnosis": Diagnóstico ou hipótese diagnóstica
  - "notes": Observações e recomendações do médico
  - "followup_date": Data de retorno se indicado (YYYY-MM-DD) ou null

**REGRAS CRÍTICAS:**
- Leia TODO o documento antes de classificar
- Não confunda tipos: exame ≠ atestado ≠ receita ≠ vacina
- Para exames: extracted_values NUNCA vazio, sempre extraia TODOS os valores
- Para receitas: prescriptions NUNCA vazio, liste TODOS os medicamentos
- Seja PRECISO com datas (coleta ≠ emissão ≠ validade)
- confidence_score: 1.0 se todos os campos preenchidos, < 0.7 se informações faltando

Retorne APENAS um objeto JSON válido, sem markdown.

Exemplo de receita:
{
  "title": "Receita - Antibiótico",
  "category": "receita",
  "issued_at": "2024-01-15",
  "expires_at": "2024-02-15",
  "provider": "Clínica São Lucas",
  "confidence_score": 0.95,
  "prescriptions": [
    {"drug_name": "Amoxicilina", "dose": "500mg", "frequency": "8/8h", "duration_days": 7, "observations": "Tomar com alimento"}
  ],
  "doctor_name": "Dr. João Silva",
  "doctor_registration": "CRM 12345"
}`;

    console.log("Sending request to AI API...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Analise este documento de saúde COM ATENÇÃO e extraia TODAS as informações com PRECISÃO. Leia o documento TODO antes de responder:" 
              },
              { type: "image_url", image_url: { url: processedImage } },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API Error:", errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Muitas requisições. Aguarde alguns segundos e tente novamente.",
            retryable: true
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 400) {
        // More user-friendly error for bad requests
        return new Response(
          JSON.stringify({ 
            error: "Não foi possível processar esta imagem. Tente tirar uma foto mais nítida ou usar outra imagem.",
            hint: "Certifique-se de que a imagem está bem iluminada e o documento está completamente visível."
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content || "";
    console.log("Raw content:", content);
    
    // Parse JSON from response, handling markdown code blocks
    let extractedInfo;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to find JSON object in the content
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }
      
      extractedInfo = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!extractedInfo.title) {
        console.warn("Missing title in extracted data");
        extractedInfo.title = "Documento de Saúde";
      }
      if (!extractedInfo.category) {
        console.warn("Missing category in extracted data");
        extractedInfo.category = "outro";
      }
      
      // Set confidence score if not provided
      if (!extractedInfo.confidence_score) {
        // Auto-calculate based on filled fields
        const requiredFields = ["title", "category", "issued_at", "provider"];
        const filledFields = requiredFields.filter(f => extractedInfo[f as keyof typeof extractedInfo]);
        extractedInfo.confidence_score = filledFields.length / requiredFields.length;
      }
      
      // Initialize type-specific arrays
      if (!extractedInfo.extracted_values) extractedInfo.extracted_values = [];
      if (!extractedInfo.prescriptions) extractedInfo.prescriptions = [];
      
      console.log("Successfully extracted:", JSON.stringify(extractedInfo, null, 2));
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      console.error("Parse error:", e);
      throw new Error("Failed to parse document information from AI response");
    }

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
