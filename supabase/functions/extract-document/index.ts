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

    const prompt = `Você é um assistente médico especializado em extrair informações de documentos de saúde.

Analise este documento médico e extraia as seguintes informações em formato JSON:
- title: título ou nome do documento/exame/procedimento (string, obrigatório)
- issued_at: data de emissão em formato YYYY-MM-DD (string ou null)
- expires_at: data de validade/vencimento se houver em formato YYYY-MM-DD (string ou null)
- provider: nome do prestador de serviço/laboratório/clínica (string ou null)
- category: classifique como "exame", "receita", "vacinacao", "consulta" ou "outro" (string)
- extracted_values: array de objetos com valores numéricos encontrados no formato:
  [{"parameter": "Hemoglobina", "value": 14.5, "unit": "g/dL", "reference_range": "12-16"}]
  (array vazio se não houver valores numéricos)

IMPORTANTE para exames laboratoriais:
- Extraia TODOS os valores numéricos com seus parâmetros, valores, unidades e faixas de referência
- Se for um exame de sangue, glicemia, colesterol, etc., sempre preencha extracted_values

Retorne APENAS um objeto JSON válido, sem markdown ou texto adicional.
Exemplo: {
  "title": "Hemograma Completo", 
  "issued_at": "2024-01-15", 
  "expires_at": null, 
  "provider": "Laboratório Central", 
  "category": "exame",
  "extracted_values": [
    {"parameter": "Hemoglobina", "value": 14.5, "unit": "g/dL", "reference_range": "12-16"},
    {"parameter": "Leucócitos", "value": 7500, "unit": "/mm³", "reference_range": "4000-11000"}
  ]
}`;

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
              { type: "text", text: "Extraia as informações deste documento médico:" },
              { type: "image_url", image_url: { url: image } },
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
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response, handling markdown code blocks
    let extractedInfo;
    try {
      const jsonMatch = content.match(/```json\n?(.*?)\n?```/s) || content.match(/\{.*\}/s);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      extractedInfo = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Failed to parse AI response:", content);
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
