import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, mimeType = 'audio/webm' } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing audio for transcription, mime type:', mimeType);

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }

    // Use Google Gemini API directly with native audio support
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Você é um transcritor de áudio profissional. Transcreva o áudio a seguir para texto em português brasileiro.

REGRAS IMPORTANTES:
- Retorne APENAS o texto transcrito, sem explicações, prefixos ou formatação
- Corrija erros de gramática óbvios
- Use pontuação apropriada
- Se não conseguir entender o áudio, retorne exatamente: [inaudível]
- Não adicione nada além da transcrição`
                },
                {
                  inlineData: {
                    mimeType: mimeType.includes('opus') ? 'audio/webm' : mimeType,
                    data: audio
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2000
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Error details:', JSON.stringify(errorJson, null, 2));
      } catch {
        // Not JSON, already logged
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Gemini response received');
    
    const transcribedText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Clean up the transcription
    let cleanText = transcribedText
      .replace(/^(transcrição|texto|áudio):\s*/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    // Check for inaudible marker
    if (cleanText.toLowerCase().includes('[inaudível]') || cleanText.length < 2) {
      cleanText = '';
    }

    console.log('Transcription result:', cleanText.substring(0, 100) + (cleanText.length > 100 ? '...' : ''));

    return new Response(
      JSON.stringify({ text: cleanText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in voice-to-text:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
