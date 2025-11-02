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
    // Verify authentication: either user auth or cron secret
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('X-Cron-Secret');
    
    if (authHeader) {
      // Manual call - verify user authentication
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (cronSecret !== Deno.env.get('CRON_SECRET')) {
      // Automated call - require valid cron secret
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use service role for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const hoje = new Date();
    const em7Dias = new Date(hoje);
    em7Dias.setDate(hoje.getDate() + 7);
    const em15Dias = new Date(hoje);
    em15Dias.setDate(hoje.getDate() + 15);
    const em30Dias = new Date(hoje);
    em30Dias.setDate(hoje.getDate() + 30);

    // 1. Processar documentos com expires_at próximo e criar eventos de renovação
    const { data: documentosVencendo, error: docError } = await supabaseClient
      .from("documentos_saude")
      .select("id, user_id, profile_id, title, expires_at, categoria_id")
      .not("expires_at", "is", null)
      .gte("expires_at", hoje.toISOString().split('T')[0])
      .lte("expires_at", em30Dias.toISOString().split('T')[0]);

    if (!docError && documentosVencendo) {
      for (const doc of documentosVencendo) {
        // Verificar se já existe evento para este documento
        const { data: eventoExistente } = await supabaseClient
          .from("eventos_saude")
          .select("id")
          .eq("related_document_id", doc.id)
          .eq("type", "renovacao_exame")
          .is("completed_at", null)
          .single();

        if (!eventoExistente) {
          // Criar evento de renovação
          await supabaseClient
            .from("eventos_saude")
            .insert({
              user_id: doc.user_id,
              profile_id: doc.profile_id,
              type: "renovacao_exame",
              title: `Renovar: ${doc.title || "Documento"}`,
              due_date: doc.expires_at,
              related_document_id: doc.id,
              notes: "Documento próximo do vencimento"
            });
        }
      }
    }

    // 2. Buscar eventos próximos (7, 15, 30 dias) não completados
    const { data: eventosProximos, error: eventosError } = await supabaseClient
      .from("eventos_saude")
      .select(`
        id, 
        user_id, 
        profile_id, 
        type, 
        title, 
        due_date,
        user_profiles!eventos_saude_profile_id_fkey (name)
      `)
      .is("completed_at", null)
      .gte("due_date", hoje.toISOString().split('T')[0])
      .lte("due_date", em30Dias.toISOString().split('T')[0]);

    if (!eventosError && eventosProximos) {
      const notificacoesEnviadas = [];

      for (const evento of eventosProximos) {
        const dueDate = new Date(evento.due_date);
        const diffDays = Math.floor((dueDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        // Enviar notificação se estiver em 7, 15 ou 30 dias
        if (diffDays === 7 || diffDays === 15 || diffDays === 30) {
          // Buscar preferências de notificação do usuário
          const { data: prefs } = await supabaseClient
            .from("notification_preferences")
            .select("push_enabled, email_enabled")
            .eq("user_id", evento.user_id)
            .single();

          const profileName = "você";
          const mensagem = `Lembrete de saúde: ${evento.title} - Vence em ${diffDays} dias`;

          // Registrar notificação (implementação básica)
          // Em produção, integrar com sistema de push/email real
          notificacoesEnviadas.push({
            user_id: evento.user_id,
            evento_id: evento.id,
            mensagem,
            dias_restantes: diffDays
          });

          console.log(`Notificação: ${mensagem}`);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          documentos_processados: documentosVencendo?.length || 0,
          eventos_verificados: eventosProximos.length,
          notificacoes_enviadas: notificacoesEnviadas.length,
          detalhes: notificacoesEnviadas
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Processamento concluído" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro em agendar-lembretes-saude:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
