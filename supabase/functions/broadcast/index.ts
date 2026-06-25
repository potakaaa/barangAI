// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: broadcast
// Sends a Telegram broadcast to all citizens attached to an incident.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const apiBase = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
  const res = await fetch(`${apiBase}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[broadcast] Telegram sendMessage failed ${res.status}: ${body}`);
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { incidentId, message } = await req.json();

    if (!incidentId || !message) {
      return new Response(JSON.stringify({ error: "Missing incidentId or message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dbClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all reports attached to this incident, joined with raw_messages
    const { data: reports, error } = await dbClient
      .from("reports")
      .select("raw_messages!inner(sender_ref)")
      .eq("incident_id", incidentId);

    if (error) {
      console.error("[broadcast] Database error fetching reports:", error);
      throw error;
    }

    if (!reports || reports.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduplicate sender numbers so we don't spam someone who sent 5 messages
    const uniqueSenders = [...new Set(reports.map((r: any) => r.raw_messages.sender_ref))];

    // Broadcast to all unique senders
    const promises = uniqueSenders.map((sender) => sendTelegramMessage(sender, message));
    await Promise.allSettled(promises);

    // Log the action
    await dbClient.from("system_logs").insert({
      message: `Broadcast sent to ${uniqueSenders.length} citizen(s): "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
      incident_id: incidentId,
    });

    return new Response(JSON.stringify({ success: true, count: uniqueSenders.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[broadcast] Function failed:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
