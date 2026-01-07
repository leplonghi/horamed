import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

    // Check subscription and enforce limits
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("plan_type, status")
      .eq("user_id", user.id)
      .single();

    const isPremium = subscription?.plan_type === "premium" && subscription?.status === "active";

    // Count user's documents
    const { count } = await supabaseClient
      .from("documentos_saude")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Enforce limit for free users
    if (!isPremium && count && count >= 5) {
      return new Response(
        JSON.stringify({ 
          error: "Limite de documentos atingido", 
          requiresUpgrade: true 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Usar Lovable AI para extração de metadados via OCR
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
      const prompt = `Você é um assistente médico especializado em extrair informações PRECISAS de documentos de saúde.

Analise CUIDADOSAMENTE este documento e extraia as seguintes informações em formato JSON:

1. **title**: Nome EXATO do exame/documento como aparece no cabeçalho
2. **issued_at**: Data de COLETA/EMISSÃO (formato YYYY-MM-DD) - procure por "Data de coleta", "Data do exame", etc.
3. **expires_at**: Data de validade (YYYY-MM-DD) - APENAS se explicitamente mencionada
4. **provider**: Nome COMPLETO do laboratório/clínica (procure no cabeçalho/rodapé)
5. **categoria**: "exame" (laboratoriais/imagem), "receita", "vacinacao", "consulta", ou "outro"
6. **ocr_text**: Texto completo extraído do documento
7. **meta**: Informações adicionais relevantes (médico solicitante, observações, etc.)

REGRAS:
- NÃO confunda tipos de documentos (exame ≠ atestado ≠ receita)
- Seja PRECISO com datas - verifique o contexto
- SEMPRE procure o nome do laboratório
- Para exames, extraia valores numéricos importantes

Retorne APENAS JSON válido sem markdown.`;

      try {
        // Get file URL from storage
        const { data: urlData } = await supabaseClient.storage
          .from('cofre-saude')
          .createSignedUrl(filePath, 300); // 5 min expiry

        if (!urlData?.signedUrl) {
          throw new Error("Failed to get signed URL");
        }

        // Download file
        const fileResponse = await fetch(urlData.signedUrl);
        const fileBuffer = await fileResponse.arrayBuffer();
        const base64File = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
        const dataUrl = `data:${mimeType};base64,${base64File}`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                    text: "Analise este documento COM ATENÇÃO e extraia as informações com PRECISÃO:"
                  },
                  {
                    type: "image_url",
                    image_url: { url: dataUrl }
                  }
                ]
              }
            ],
            temperature: 0.1,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "{}";
          console.log("AI extraction result:", content);
          
          // Parse JSON response
          try {
            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
            
            extractedData = {
              title: parsed.title || "Documento sem título",
              issued_at: parsed.issued_at || null,
              expires_at: parsed.expires_at || null,
              provider: parsed.provider || "",
              categoria_slug: parsed.categoria || categoriaSlug || "outro",
              ocr_text: parsed.ocr_text || "",
              meta: parsed.meta || {}
            };
            console.log("Extracted data:", extractedData);
          } catch (e) {
            console.error("Erro ao parsear resposta IA:", e, "Content:", content);
          }
        } else {
          const errorText = await aiResponse.text();
          console.error("AI API error:", errorText);
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
