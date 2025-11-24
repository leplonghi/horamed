import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Gerar token base58-like (URL-safe)
function generateToken(length = 16): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestSchema = z.object({
      documentId: z.string().uuid({ message: "ID do documento inválido" }),
      allowDownload: z.boolean().default(true),
      ttlHours: z.number().int().min(1).max(8760).optional()
    });

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.issues[0].message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { documentId, allowDownload, ttlHours } = parsed.data;

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "documentId é obrigatório" }),
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

    // Verificar se documento pertence ao usuário
    const { data: documento, error: docError } = await supabaseClient
      .from("documentos_saude")
      .select("id, user_id")
      .eq("id", documentId)
      .single();

    if (docError || !documento) {
      return new Response(
        JSON.stringify({ error: "Documento não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (documento.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar plano (Premium pode compartilhar)
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("plan_type, status")
      .eq("user_id", user.id)
      .single();

    const isPremium = subscription?.plan_type === "premium" && subscription?.status === "active";
    
    if (!isPremium) {
      return new Response(
        JSON.stringify({ error: "Recurso exclusivo do plano Premium", requiresUpgrade: true }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar token único
    let token = generateToken(16);
    let tokenExists = true;
    let attempts = 0;

    while (tokenExists && attempts < 5) {
      const { data: existing } = await supabaseClient
        .from("compartilhamentos_doc")
        .select("id")
        .eq("token", token)
        .single();
      
      if (!existing) {
        tokenExists = false;
      } else {
        token = generateToken(16);
        attempts++;
      }
    }

    if (tokenExists) {
      throw new Error("Não foi possível gerar token único");
    }

    // Calcular expires_at se ttlHours fornecido
    let expiresAt = null;
    if (ttlHours && ttlHours > 0) {
      const now = new Date();
      expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000).toISOString();
    }

    // Criar compartilhamento
    const { data: share, error: shareError } = await supabaseClient
      .from("compartilhamentos_doc")
      .insert({
        document_id: documentId,
        user_id: user.id,
        token,
        expires_at: expiresAt,
        allow_download: allowDownload
      })
      .select()
      .single();

    if (shareError) throw shareError;

    const origin = req.headers.get("origin") || Deno.env.get("SUPABASE_URL");
    const shareUrl = `${origin}/compartilhar/${token}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        token, 
        url: shareUrl,
        expires_at: expiresAt,
        allow_download: allowDownload 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro em gerar-link-compartilhamento:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
