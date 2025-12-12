import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const requestSchema = z.object({
  medicationName: z.string().min(1).max(200),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[MEDICATION-INFO] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = requestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.error("[MEDICATION-INFO] Validation error:", parseResult.error.message);
      return new Response(
        JSON.stringify({ error: "Invalid request", details: parseResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { medicationName } = parseResult.data;
    console.log("[MEDICATION-INFO] Fetching info for:", medicationName);

    const systemPrompt = `Você é um assistente de saúde especializado em informações sobre medicamentos brasileiros.
Responda SEMPRE em português brasileiro.
Forneça informações concisas e úteis sobre o medicamento solicitado.
NÃO forneça dosagens específicas ou recomendações de uso - apenas informações gerais.
Sempre recomende consultar um médico ou farmacêutico para orientações específicas.`;

    const userPrompt = `Forneça informações sobre o medicamento "${medicationName}".
Inclua:
1. Para que serve (indicação principal)
2. Classe terapêutica
3. Princípio ativo (se diferente do nome comercial)
4. Cuidados gerais importantes

Responda de forma concisa e objetiva. Use no máximo 3-4 frases para cada item.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "medication_info",
              description: "Return structured medication information",
              parameters: {
                type: "object",
                properties: {
                  indication: {
                    type: "string",
                    description: "Para que serve o medicamento (indicação principal)"
                  },
                  therapeuticClass: {
                    type: "string",
                    description: "Classe terapêutica do medicamento"
                  },
                  activeIngredient: {
                    type: "string",
                    description: "Princípio ativo do medicamento"
                  },
                  warnings: {
                    type: "string",
                    description: "Cuidados gerais importantes"
                  }
                },
                required: ["indication", "therapeuticClass", "activeIngredient", "warnings"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "medication_info" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("[MEDICATION-INFO] Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("[MEDICATION-INFO] Payment required");
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para o serviço de IA." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("[MEDICATION-INFO] AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar informações" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("[MEDICATION-INFO] Response received");

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const medicationInfo = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({ success: true, data: medicationInfo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback to content if no tool call
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      return new Response(
        JSON.stringify({ success: true, data: { description: content } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Não foi possível obter informações" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[MEDICATION-INFO] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});