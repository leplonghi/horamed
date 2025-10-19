import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, filePath, mimeType, categoriaSlug } = await req.json();

    if (!documentId || !filePath || !mimeType) {
      return new Response(
        JSON.stringify({ error: "documentId, filePath e mimeType são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    // Usar Lovable AI para extração de metadados via OCR simulado
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    let extractedData = {
      title: "",
      issued_at: null,
      expires_at: null,
      provider: "",
      categoria_slug: categoriaSlug || "outro",
      ocr_text: "",
      meta: {}
    };

    // Se for imagem ou PDF, tentar extrair com IA
    if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
      const prompt = `Você é um assistente médico especializado em extrair informações de documentos de saúde.
      
Analise este documento médico e extraia as seguintes informações em formato JSON:
- title: título ou nome do documento/exame/procedimento
- issued_at: data de emissão (formato YYYY-MM-DD)
- expires_at: data de validade/vencimento se houver (formato YYYY-MM-DD)
- provider: nome do prestador de serviço/laboratório/clínica
- categoria: classifique como "exame", "receita", "vacinacao", "consulta" ou "outro"
- ocr_text: texto extraído do documento
- meta: informações adicionais relevantes

Retorne APENAS um objeto JSON válido, sem markdown ou texto adicional.`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                content: `Documento: ${filePath}. Tipo: ${mimeType}. Por favor, extraia os metadados.` 
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "{}";
          
          // Tentar parsear JSON da resposta
          try {
            const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
            extractedData = {
              title: parsed.title || "",
              issued_at: parsed.issued_at || null,
              expires_at: parsed.expires_at || null,
              provider: parsed.provider || "",
              categoria_slug: parsed.categoria || categoriaSlug || "outro",
              ocr_text: parsed.ocr_text || "",
              meta: parsed.meta || {}
            };
          } catch (e) {
            console.error("Erro ao parsear resposta IA:", e);
          }
        }
      } catch (error) {
        console.error("Erro ao chamar IA:", error);
      }
    }

    // Obter categoria_id a partir do slug
    const { data: categoria } = await supabaseClient
      .from("categorias_saude")
      .select("id")
      .eq("slug", extractedData.categoria_slug)
      .single();

    // Atualizar documento com metadados extraídos
    const { error: updateError } = await supabaseClient
      .from("documentos_saude")
      .update({
        title: extractedData.title || "Documento sem título",
        issued_at: extractedData.issued_at,
        expires_at: extractedData.expires_at,
        provider: extractedData.provider,
        categoria_id: categoria?.id || null,
        ocr_text: extractedData.ocr_text,
        meta: extractedData.meta,
        updated_at: new Date().toISOString()
      })
      .eq("id", documentId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro em extrair-metadados-documento:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
