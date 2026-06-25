// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: ingest
// Single entry point for all incoming messages.
//
// This file wires the pipeline stages together. It is the ONLY place that
// reads environment variables and selects concrete implementations.
// To swap a component: change the import + constructor call below.
//
// Flow:
// 1. Adapt the raw webhook payload → RawMessage
// 2. Check if this sender has a pending clarification
//    → YES: resolve it (LLM extracts missing fields, updates report, replies)
//    → NO:  run normal pipeline (parse → store → reply)
// 3. After storing, if the LLM flagged missing fields → create a clarification
// ─────────────────────────────────────────────────────────────────────────────

import { runPipeline } from "../_shared/pipeline.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// ── Adapters (choose one) ────────────────────────────────────────────────────
import { telegramAdapter } from "../_shared/adapters/telegram.ts";
// import { smsAdapter } from "../_shared/adapters/sms.ts";  // ← swap for SMS

// ── Parsers (choose one — both providers export the same interface) ──────────
// import {
//   createOpenAIParser as createParser,
//   createOpenAIClarificationResolver as createClarificationResolverFn,
// } from "../_shared/parsers/openai.ts";
import {
  createParser,
  createClarificationResolverFromLLM,
} from "../_shared/parsers/shared.ts";
import { createGeminiLLMCall } from "../_shared/parsers/gemini.ts";

// ── Storage (choose one) ─────────────────────────────────────────────────────
import { createSupabaseStorage } from "../_shared/storage/supabase.ts";

// ── Reply handlers (choose one, or omit to disable auto-reply) ───────────────
import { createTelegramReplyHandler } from "../_shared/reply/telegram.ts";
// import { createSMSReplyHandler } from "../_shared/reply/sms.ts";  // ← swap for SMS

// ── Clarification ────────────────────────────────────────────────────────────
import { createClarificationManager } from "../_shared/clarification.ts";

// ---------------------------------------------------------------------------
// Environment — resolved once at cold-start, not per-request
// ---------------------------------------------------------------------------

const TELEGRAM_WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ---------------------------------------------------------------------------
// Pipeline + clarification — assembled once at cold-start
// ---------------------------------------------------------------------------

const primaryLLM = createGeminiLLMCall(GEMINI_API_KEY);

const pipeline = {
  adapter: telegramAdapter,
  parser:  createParser(primaryLLM),
  storage: createSupabaseStorage(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
  reply:   createTelegramReplyHandler(TELEGRAM_BOT_TOKEN),
};

const clarifications = createClarificationManager(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

const resolveClarification = createClarificationResolverFromLLM(primaryLLM);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Send a Telegram message to a specific chat. */
async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<void> {
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
    console.error(`[ingest] Telegram sendMessage failed ${res.status}: ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // ── Auth: verify Telegram webhook secret ──────────────────────────────────
  const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token");
  if (incomingSecret !== TELEGRAM_WEBHOOK_SECRET) {
    console.warn("[ingest] Rejected request — invalid webhook secret");
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad Request: invalid JSON", { status: 400 });
  }

  // ── Stage 1: Adapt (get sender info before checking clarifications) ───────
  const raw = pipeline.adapter(payload);
  if (raw === null) {
    // Non-text update (photo, sticker, etc.) — not actionable
    return new Response("OK");
  }

  // ── Guard: Token Flood Protection ─────────────────────────────────────────
  if (raw.text.length > 800) {
    console.warn(`[ingest] Message too long from ${raw.senderRef} (${raw.text.length} chars)`);
    await sendTelegramMessage(
      raw.senderRef,
      "⚠️ Taas ra kaayo ang imong mensahe. Palihug mub-a ngadto sa 1-2 ka paragraph.\n\n" +
      "_Masyadong mahaba ang iyong mensahe. Pakiikli sa 1-2 paragraph._"
    );
    return new Response("OK");
  }

  // ── Opportunistic cleanup: expire stale clarifications ────────────────────
  clarifications.expireStale().catch((err) =>
    console.error("[ingest] expireStale failed:", err)
  );

  // ── Check for pending clarification from this sender ──────────────────────
  const pending = await clarifications.getPending(raw.senderRef);

  if (pending) {
    console.log(
      `[ingest] Found pending clarification for ${raw.senderRef} ` +
      `(ticket: ${pending.ticketNumber}, fields: ${pending.missingFields.map((f) => f.field).join(", ")})`
    );

    try {
      // Use focused LLM call to extract the missing fields from the response
      const result = await resolveClarification({
        originalText: pending.originalText,
        reportSummary: pending.reportSummary,
        concernType: pending.concernType,
        missingFields: pending.missingFields,
        citizenResponse: raw.text,
        originalLanguage: pending.originalLanguage,
      });

      // Update the report + mark clarification as resolved
      await clarifications.resolve(pending.id, pending.reportId, result.updates);

      // Send confirmation reply to the citizen
      const replyText = result.replyDraft.replace(
        "{TICKET_NUMBER}",
        pending.ticketNumber
      );
      await sendTelegramMessage(raw.senderRef, replyText);

      console.log(
        `[ingest] ✓ Clarification resolved for ticket ${pending.ticketNumber} ` +
        `(updated: ${Object.keys(result.updates).join(", ")})`
      );
    } catch (err) {
      console.error(
        `[ingest] Clarification resolution failed for ticket ${pending.ticketNumber}:`,
        err instanceof Error ? err.message : String(err)
      );

      // Non-fatal — the original report still exists
      await sendTelegramMessage(
        raw.senderRef,
        `⚠️ Pasensya, wala nako masabtan ang imong tubag. ` +
        `Pwede ba nimo isulti pag-usab?\n\n` +
        `_Paumanhin, hindi ko maintindihan ang iyong sagot. ` +
        `Maaari mo bang ulitin?_`
      );
    }

    return new Response("OK");
  }

  // ── Fetch active incidents for context ──────────────────────────────────────
  let activeIncidentsContext = "";
  try {
    // We create a one-off client here just for this read query.
    // (In a high-throughput system, you might cache this or use a connection pool)
    const dbClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: activeIncidents } = await dbClient
      .from("incidents")
      .select("title, location_zone")
      .eq("status", "open")
      .limit(50); // Gemini 1.5 Flash has a 1M token context, so 50 lines is perfectly safe and cheap

    if (activeIncidents && activeIncidents.length > 0) {
      activeIncidentsContext = activeIncidents
        .map((inc) => `- ${inc.title} (Location: ${inc.location_zone ?? "Unknown"})`)
        .join("\n");
    }
  } catch (err) {
    console.error("[ingest] Failed to fetch active incidents:", err);
  }

  // ── No pending clarification — run normal pipeline ────────────────────────
  const result = await runPipeline(payload, pipeline, { activeIncidentsContext });

  if (result.skipped) {
    // If skipped due to being non-actionable (greeting/noise), just send the generic reply
    if (result.parsed && !result.parsed.isActionable && result.parsed.replyDraft && result.raw) {
      console.log(`[ingest] Handled non-actionable message from ${result.raw.senderRef}: "${result.raw.text}"`);
      await sendTelegramMessage(result.raw.senderRef, result.parsed.replyDraft);
    }
    return new Response("OK");
  }

  if (!result.success) {
    console.error(
      `[ingest] Pipeline failed at stage "${result.failedAt}": ${result.error}`
    );

    // If the pipeline failed after the adapter succeeded, notify the citizen of temporary maintenance
    if (result.raw) {
      try {
        if (result.raw.channel === "telegram" && TELEGRAM_BOT_TOKEN) {
          const maintenanceMessage = 
            `⚠️ *System Notice / Pahibalo:*\n\n` +
            `Pasensya, Dili ko kareply karon kay adunay maintenance na gahitabo.\n\n` +
            `_Paumanhin, hindi ako makasagot ngayon dahil may kasalukuyang maintenance._`;

          await sendTelegramMessage(result.raw.senderRef, maintenanceMessage);
        }
      } catch (replyErr) {
        console.error("[ingest] Error sending maintenance notification:", replyErr);
      }
    }

    return new Response("OK");
  }

  // ── Post-store: check if the LLM flagged any missing fields ───────────────
  const stored = result.stored!;
  const missingFields = stored.parsedReport.missingFields ?? [];

  if (missingFields.length > 0) {
    try {
      await clarifications.create({
        reportId: stored.id,
        ticketNumber: stored.ticketNumber,
        senderRef: stored.rawMessage.senderRef,
        channel: stored.rawMessage.channel,
        missingFields,
        originalText: stored.rawMessage.text,
        reportSummary: stored.parsedReport.summary,
        concernType: stored.parsedReport.concernType,
        originalLanguage: stored.parsedReport.originalLanguage,
      });

      console.log(
        `[ingest] 📝 Created clarification request for ticket ${stored.ticketNumber} ` +
        `(missing: ${missingFields.map((f) => f.field).join(", ")})`
      );
    } catch (err) {
      // Non-fatal — report is already stored, reply is already sent
      console.error(
        "[ingest] Failed to create pending clarification:",
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  console.log(
    `[ingest] ✓ Report stored: ${stored.ticketNumber} ` +
    `(${stored.parsedReport.concernType}, ${stored.parsedReport.urgencyLevel}` +
    `${missingFields.length > 0 ? `, awaiting: ${missingFields.map((f) => f.field).join(", ")}` : ""})`
  );

  return new Response("OK");
});
