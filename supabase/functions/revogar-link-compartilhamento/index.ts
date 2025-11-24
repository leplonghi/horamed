import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestSchema = z.object({
      token: z.string().min(16, "Token inválido")
    });

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.issues[0].message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { token } = parsed.data;

    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    // Verificar se compartilhamento existe e pertence ao usuário
    const { data: share, error: shareError } = await supabaseClient
      .from("compartilhamentos_doc")
      .select("id, user_id, revoked_at")
      .eq("token", token)
      .single();

    if (shareError || !share) {
      return new Response(
        JSON.stringify({ error: "Compartilhamento não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (share.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (share.revoked_at) {
      return new Response(
        JSON.stringify({ message: "Compartilhamento já estava revogado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Revogar compartilhamento
    const { error: revokeError } = await supabaseClient
      .from("compartilhamentos_doc")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token", token);

    if (revokeError) throw revokeError;

    return new Response(
      JSON.stringify({ success: true, message: "Compartilhamento revogado com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro em revogar-link-compartilhamento:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
