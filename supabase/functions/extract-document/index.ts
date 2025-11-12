import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const prompt = `Você é um assistente médico especializado em extrair informações PRECISAS de documentos de saúde.

Analise CUIDADOSAMENTE este documento e extraia as seguintes informações em formato JSON:

1. **title**: Nome EXATO do exame/documento como aparece no cabeçalho (obrigatório)
   - Exemplos: "Hemograma Completo", "Glicemia de Jejum", "Atestado Médico"

2. **issued_at**: Data de COLETA/EMISSÃO do documento em formato YYYY-MM-DD
   - Procure por: "Data de coleta", "Data do exame", "Data de emissão", "Coletado em"
   - Se houver múltiplas datas, use a data de COLETA do exame ou emissão do documento

3. **expires_at**: Data de validade (YYYY-MM-DD) - APENAS se explicitamente mencionada
   - Receitas médicas geralmente têm validade
   - Deixe null se não houver validade explícita

4. **provider**: Nome COMPLETO do laboratório/clínica/hospital
   - Procure no cabeçalho ou rodapé do documento
   - Exemplos: "Laboratório Sabin", "Hospital Albert Einstein", "Clínica São Lucas"
   - Se não encontrar, retorne null

5. **category**: Classifique CORRETAMENTE o tipo de documento:
   - "exame": Exames laboratoriais, de imagem, etc. (hemograma, glicemia, raio-x, etc.)
   - "receita": Prescrições médicas com medicamentos
   - "vacinacao": Cartões ou certificados de vacinação
   - "consulta": Relatórios ou resumos de consultas médicas
   - "outro": Atestados, declarações, etc.

6. **extracted_values**: Array de TODOS os valores numéricos encontrados (OBRIGATÓRIO para exames):
   - Formato: {"parameter": "Nome do Parâmetro", "value": 14.5, "unit": "g/dL", "reference_range": "12-16"}
   - Extraia TODOS os parâmetros do exame com seus valores, unidades e faixas de referência
   - Para exames de sangue, sempre haverá múltiplos valores

REGRAS CRÍTICAS:
- Leia TODO o documento antes de responder
- NÃO confunda tipos de documentos (exame ≠ atestado ≠ receita)
- Seja PRECISO com datas - verifique o contexto ("coleta", "emissão", "validade")
- SEMPRE procure o nome do laboratório no cabeçalho/rodapé
- Para exames laboratoriais, extracted_values NUNCA deve estar vazio

Retorne APENAS um objeto JSON válido, sem markdown ou texto adicional.

Exemplo de exame laboratorial:
{
  "title": "Hemograma Completo",
  "issued_at": "2024-01-15",
  "expires_at": null,
  "provider": "Laboratório Sabin",
  "category": "exame",
  "extracted_values": [
    {"parameter": "Hemoglobina", "value": 14.5, "unit": "g/dL", "reference_range": "12-16"},
    {"parameter": "Leucócitos", "value": 7500, "unit": "/mm³", "reference_range": "4000-11000"},
    {"parameter": "Plaquetas", "value": 250000, "unit": "/mm³", "reference_range": "150000-400000"}
  ]
}`;

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
              { type: "image_url", image_url: { url: image } },
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
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      if (!extractedInfo.extracted_values) {
        extractedInfo.extracted_values = [];
      }
      
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
