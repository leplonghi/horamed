import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter
const rateLimiter = new Map<string, number[]>();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting: 10 requests per IP per minute
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const now = Date.now();
    const requests = rateLimiter.get(clientIP) || [];
    const recentRequests = requests.filter(t => now - t < 60000);
    
    if (recentRequests.length >= 10) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    rateLimiter.set(clientIP, [...recentRequests, now]);
    
    // Clean up old entries periodically
    if (rateLimiter.size > 1000) {
      for (const [ip, timestamps] of rateLimiter.entries()) {
        if (timestamps.every(t => now - t > 60000)) {
          rateLimiter.delete(ip);
        }
      }
    }

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use SERVICE_ROLE_KEY to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate token and get sharing details
    const { data: share, error: shareError } = await supabaseAdmin
      .from("compartilhamentos_doc")
      .select("document_id, expires_at, revoked_at, allow_download")
      .eq("token", token)
      .single();

    if (shareError || !share) {
      return new Response(
        JSON.stringify({ error: "Link de compartilhamento não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if revoked
    if (share.revoked_at) {
      return new Response(
        JSON.stringify({ error: "Este link foi revogado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Este link expirou" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get document details
    const { data: document, error: docError } = await supabaseAdmin
      .from("documentos_saude")
      .select("id, title, issued_at, provider, mime_type, file_path")
      .eq("id", share.document_id)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: "Documento não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate short-lived signed URL (5 minutes)
    const { data: urlData } = await supabaseAdmin.storage
      .from("cofre-saude")
      .createSignedUrl(document.file_path, 300);

    return new Response(
      JSON.stringify({
        success: true,
        document: {
          title: document.title,
          issued_at: document.issued_at,
          provider: document.provider,
          mime_type: document.mime_type,
        },
        signed_url: urlData?.signedUrl || null,
        allow_download: share.allow_download,
        expires_at: share.expires_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[validar-compartilhamento] Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao validar compartilhamento" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
