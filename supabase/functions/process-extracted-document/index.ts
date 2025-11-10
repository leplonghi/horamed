import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { documentId, extractedData } = await req.json();

    if (!documentId || !extractedData) {
      return new Response(
        JSON.stringify({ error: "documentId and extractedData are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing document:", documentId, "with data:", extractedData);

    // Get document info
    const { data: documento, error: docError } = await supabase
      .from("documentos_saude")
      .select("*, categorias_saude(*)")
      .eq("id", documentId)
      .single();

    if (docError || !documento) {
      throw new Error("Document not found");
    }

    // Update document with extracted data
    const { error: updateError } = await supabase
      .from("documentos_saude")
      .update({
        title: extractedData.title || documento.title,
        issued_at: extractedData.issued_at || documento.issued_at,
        expires_at: extractedData.expires_at || documento.expires_at,
        provider: extractedData.provider || documento.provider,
        meta: { ...documento.meta, extracted: extractedData },
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("Error updating document:", updateError);
      throw updateError;
    }

    let savedRecords: any = {};

    // Process based on category
    const category = extractedData.category || documento.categorias_saude?.slug;

    if (category === "exame" && extractedData.extracted_values?.length > 0) {
      // Create exam record
      const { data: exame, error: exameError } = await supabase
        .from("exames_laboratoriais")
        .insert({
          user_id: user.id,
          profile_id: documento.profile_id,
          documento_id: documentId,
          data_exame: extractedData.issued_at || new Date().toISOString().split('T')[0],
          laboratorio: extractedData.provider,
        })
        .select()
        .single();

      if (exameError) {
        console.error("Error creating exam:", exameError);
      } else if (exame) {
        savedRecords.exame = exame;

        // Create exam values
        const valores = extractedData.extracted_values.map((v: any) => ({
          exame_id: exame.id,
          parametro: v.parameter,
          valor: v.value,
          valor_texto: v.value?.toString(),
          unidade: v.unit,
          referencia_texto: v.reference_range,
        }));

        const { error: valoresError } = await supabase
          .from("valores_exames")
          .insert(valores);

        if (valoresError) {
          console.error("Error creating exam values:", valoresError);
        } else {
          savedRecords.valores_count = valores.length;
        }
      }
    } else if (category === "consulta") {
      // Create consultation record
      const { data: consulta, error: consultaError } = await supabase
        .from("consultas_medicas")
        .insert({
          user_id: user.id,
          profile_id: documento.profile_id,
          documento_id: documentId,
          data_consulta: extractedData.issued_at 
            ? new Date(extractedData.issued_at).toISOString()
            : new Date().toISOString(),
          local: extractedData.provider,
          observacoes: extractedData.notes,
          status: "realizada",
        })
        .select()
        .single();

      if (consultaError) {
        console.error("Error creating consultation:", consultaError);
      } else {
        savedRecords.consulta = consulta;
      }
    } else if (category === "vacinacao") {
      // Create vaccination event
      const { data: evento, error: eventoError } = await supabase
        .from("eventos_saude")
        .insert({
          user_id: user.id,
          profile_id: documento.profile_id,
          type: "vacinacao",
          due_date: extractedData.issued_at || new Date().toISOString().split('T')[0],
          title: extractedData.title || "Vacinação",
          notes: extractedData.provider ? `Aplicada em: ${extractedData.provider}` : null,
          related_document_id: documentId,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (eventoError) {
        console.error("Error creating vaccination event:", eventoError);
      } else {
        savedRecords.evento = evento;
      }
    } else if (category === "receita" && extractedData.medications?.length > 0) {
      // Create medication items from prescription
      console.log('Creating medication items from prescription:', extractedData.medications);
      
      const medications = extractedData.medications.map((med: any) => {
        // Parse treatment dates
        let treatmentStartDate = null;
        let treatmentEndDate = null;
        let treatmentDurationDays = null;

        if (med.start_date) {
          treatmentStartDate = med.start_date;
        }

        if (med.duration_days) {
          treatmentDurationDays = parseInt(med.duration_days);
          if (treatmentStartDate && treatmentDurationDays) {
            const startDate = new Date(treatmentStartDate);
            startDate.setDate(startDate.getDate() + treatmentDurationDays);
            treatmentEndDate = startDate.toISOString().split('T')[0];
          }
        }

        return {
          user_id: user.id,
          profile_id: documento.profile_id,
          name: med.name,
          dose_text: med.dosage || null,
          category: 'medicamento',
          treatment_duration_days: treatmentDurationDays,
          total_doses: med.total_doses ? parseInt(med.total_doses) : null,
          treatment_start_date: treatmentStartDate,
          treatment_end_date: treatmentEndDate,
          notes: [
            med.frequency ? `Frequência: ${med.frequency}` : null,
            extractedData.provider ? `Prescrito por: ${extractedData.provider}` : null,
          ].filter(Boolean).join('\n'),
          is_active: true,
        };
      });

      const { data: items, error: itemsError } = await supabase
        .from("items")
        .insert(medications)
        .select();

      if (itemsError) {
        console.error("Error creating medications:", itemsError);
      } else {
        console.log('Successfully created medication items:', items?.length || 0);
        savedRecords.medications = items;
        savedRecords.medications_count = items?.length || 0;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Dados extraídos e salvos com sucesso",
        extractedData,
        savedRecords,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in process-extracted-document:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process extracted document" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});