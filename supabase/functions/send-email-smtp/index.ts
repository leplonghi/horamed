import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const emailSchema = z.object({
  to: z.string().email().max(255),
  subject: z.string().min(1).max(500),
  html: z.string().min(1).max(50000),
  text: z.string().max(50000).optional(),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("[SMTP] Starting email send...");

  try {
    // Validate input
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = emailSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      console.error("[SMTP] Validation error:", parseResult.error.message);
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: parseResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, subject, html, text } = parseResult.data;

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPassword || !fromEmail) {
      console.error("[SMTP] Missing SMTP configuration");
      return new Response(
        JSON.stringify({ error: "SMTP not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SMTP] Connecting to ${smtpHost}:${smtpPort}...`);

    const client = new SmtpClient();

    // Connect with TLS (port 465) or STARTTLS (port 587)
    if (smtpPort === 465) {
      await client.connectTLS({
        hostname: smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPassword,
      });
    } else {
      await client.connect({
        hostname: smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPassword,
      });
    }

    console.log(`[SMTP] Connected, sending to ${to}...`);

    await client.send({
      from: fromEmail,
      to: to,
      subject: subject,
      content: text || html.replace(/<[^>]*>/g, ''),
      html: html,
    });

    await client.close();

    const duration = Date.now() - startTime;
    console.log(`[SMTP] Email sent successfully in ${duration}ms`);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent", duration_ms: duration }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[SMTP] Error after ${duration}ms:`, error.message);
    
    return new Response(
      JSON.stringify({ error: error.message, duration_ms: duration }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);