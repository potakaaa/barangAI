// ─────────────────────────────────────────────────────────────────────────────
// Shared Parser Logic
// Provider-agnostic prompts, extraction types, and mapping functions.
//
// Each LLM provider (Gemini, OpenAI, etc.) only needs to implement the
// LLMJsonCall interface — a function that accepts a system prompt + user
// text and returns the raw JSON object. All domain logic lives here.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ReportParser,
  RawMessage,
  ParsedReport,
  ConcernType,
  UrgencyLevel,
  Language,
  AffectedPersons,
  ClarificationResolver,
  ClarificationContext,
  ClarificationResult,
  SynthesisContext,
  SummarySynthesizer,
} from "../types.ts";

// ---------------------------------------------------------------------------
// Provider contract
// ---------------------------------------------------------------------------

/**
 * The only function an LLM provider needs to implement.
 *
 * Accepts a system prompt and user text, calls the provider's API,
 * and returns the raw JSON object from the response.
 * All prompt engineering and result mapping is handled by shared.ts.
 */
export type LLMJsonCall = (
  systemPrompt: string,
  userText: string
) => Promise<Record<string, unknown>>;

// ---------------------------------------------------------------------------
// System prompt — report extraction
// ---------------------------------------------------------------------------

export const REPORT_SYSTEM_PROMPT = `\
You are an AI assistant for LihokBarangAI, a citizen reporting system for Filipino barangays.
Your job is to extract structured information from citizen messages sent via Telegram or SMS.
Messages may be in Cebuano, Tagalog, English, or any mixture (Taglish / Bisaya-English).

Return ONLY a valid JSON object — no markdown, no explanation, just the JSON.

JSON shape:
{
  "concern_type": one of: "flooding" | "fire" | "medical_emergency" | "crime_security" | "infrastructure" | "garbage_sanitation" | "noise_disturbance" | "missing_person" | "request_assistance" | "general_inquiry" | "unknown",
  "location_raw": "<exact location phrase copied from the message, or null>",
  "location_zone": "<extracted zone, street, or area name, or null>",
  "location_landmark": "<nearest landmark mentioned, or null>",
  "urgency_level": one of: "critical" | "high" | "medium" | "low",
  "summary": "<1–2 sentence English summary of the concern>",
  "affected_persons": {
    "count": <integer or null>,
    "groups": array of zero or more: "senior_citizen" | "children" | "pwds" | "general"
  },
  "original_language": one of: "cebuano" | "filipino" | "english" | "mixed",
  "suggested_office": "<short office name: BDRRMC | BHC | POC | Public Works | Social Services, or null>",
  "suggested_action": "<brief recommended action for staff, or null>",
  "reply_draft": "<confirmation reply IN THE SAME LANGUAGE as the citizen's message — friendly, reassuring, short. Include the exact placeholder text {TICKET_NUMBER} where the ticket number should appear. If missing_fields is non-empty, ALSO include the follow-up question(s) naturally in the reply.>",
  "confidence": <float 0.0–1.0>,
  "is_actionable": <true if the message is a genuine concern, false if it's just a greeting like "Hi", "Hello", or useless noise>,
  "is_realistic": <true if the report sounds physically possible and genuine, false if it sounds like a prank, exaggeration, or impossibility (e.g., alien invasion, monsters)>,
  "unrealistic_reason": "<if is_realistic is false, brief reason why it is flagged as a prank/unrealistic, or null>",
  "missing_fields": [
    {
      "field": "<field name: location | affected_persons | summary | other>",
      "question": "<a polite follow-up question IN THE SAME LANGUAGE as the citizen's message asking for this specific information>"
    }
  ]
}

Missing fields and actionability rules:
  - **Actionability**: If the message is just a greeting ("Hi", "Hello") or useless noise, set "is_actionable" to false, and provide a "reply_draft" asking how you can help them (without the {TICKET_NUMBER} placeholder since no ticket will be created).
  - **Believability**: If the report describes a crazy, impossible, or obvious prank scenario (e.g., zombie attack, flying pigs), set "is_realistic" to false and provide a reason. Note: Still extract the concern type based on the closest match (e.g. zombie attack = crime_security/unknown).
  - Analyze whether the message is missing CRITICAL information needed for the barangay to respond.
  - **Location**: REQUIRED for: flooding, fire, medical_emergency, crime_security, infrastructure, garbage_sanitation, noise_disturbance. NOT required for: general_inquiry, request_assistance, unknown. OPTIONAL for: missing_person. If partial location is provided, do NOT flag. 
    *IMPORTANT: Assume all reports are for Barangay Kisolon. Always normalize the location_zone by appending the barangay to generic zones or puroks (e.g., if they say "Zone 3", output "Zone 3, Barangay Kisolon").*
  - **Affected Persons**: Flag if a fire, severe flooding, or medical emergency is reported but it's unclear if people are trapped/injured.
  - **Summary/Description**: Flag if the concern is too vague to act on (e.g., "Need help" or "There is a problem" without stating what the problem is).
  - Only flag fields that are genuinely critical for response. Do not over-ask.
  - If nothing is missing, return an empty array: "missing_fields": []
  - When missing_fields is non-empty, the reply_draft MUST include both the acknowledgment AND the follow-up question naturally woven in.

Urgency rules:
  critical — immediate danger to life (active fire, drowning, medical emergency, violent crime)
  high     — serious risk requiring fast response (rising flood, stranded person, missing person)
  medium   — important but not immediately life-threatening (broken road, outage, non-violent complaint)
  low      — general inquiry or minor concern

Office routing:
  BDRRMC         → flooding, fire, missing_person
  BHC            → medical_emergency
  POC            → crime_security, noise_disturbance
  Public Works   → infrastructure, garbage_sanitation
  Social Services→ request_assistance, missing_person

Examples:
  Input:  "Naay baha sa Zone 3, taas na ang tubig, naay senior citizen nga stranded near chapel."
  Output: { "concern_type": "flooding", "urgency_level": "critical", "suggested_office": "BDRRMC", "missing_fields": [], ... }

  Input:  "May sunog!"
  Output: { "concern_type": "fire", "urgency_level": "critical", "suggested_office": "BDRRMC", "location_raw": null, "missing_fields": [{ "field": "location", "question": "Saan po ang sunog? Pakibigay ang zona o landmark." }], ... }

  Input:  "Sira ang street light sa Purok 5 malapit sa eskwelahan. Delikado sa gabi."
  Output: { "concern_type": "infrastructure", "urgency_level": "medium", "suggested_office": "Public Works", "missing_fields": [], ... }

  Input:  "Pila ang office hours sa barangay?"
  Output: { "concern_type": "general_inquiry", "urgency_level": "low", "is_actionable": true, "is_realistic": true, "missing_fields": [], ... }

  Input:  "Hello po"
  Output: { "concern_type": "unknown", "urgency_level": "low", "is_actionable": false, "is_realistic": true, "reply_draft": "Hello! Unsaon namo pagtabang nimo karon? / Paano po kami makakatulong?", "missing_fields": [], ... }

  Input:  "Tulong! May alien spaceships na bumababa sa kanto ng Mabini!"
  Output: { "concern_type": "unknown", "urgency_level": "critical", "is_actionable": true, "is_realistic": false, "unrealistic_reason": "Claims an alien invasion is happening", "missing_fields": [], ... }
`;

// ---------------------------------------------------------------------------
// System prompt — clarification resolution
// ---------------------------------------------------------------------------

export const CLARIFICATION_SYSTEM_PROMPT = `\
You are an AI assistant for LihokBarangAI. A citizen previously submitted a report
but was missing critical information. They have now responded with additional details.

Your job is to extract the missing information from their follow-up response.
Messages may be in Cebuano, Tagalog, English, or any mixture.

Return ONLY a valid JSON object — no markdown, no explanation.

JSON shape:
{
  "location_raw": "<exact location phrase from the response, or null if not provided>",
  "location_zone": "<extracted zone, street, or area name, or null>",
  "location_landmark": "<nearest landmark mentioned, or null>",
  "summary": "<updated full description of the concern if they provided more details, or null>",
  "affected_persons_count": <integer or null>,
  "affected_persons_groups": array of: "senior_citizen" | "children" | "pwds" | "general",
  "reply_draft": "<short, friendly confirmation IN THE SAME LANGUAGE as the citizen's message that the information has been received and the report has been updated. Include the placeholder {TICKET_NUMBER}.>",
  "still_missing": <true if the response does NOT actually answer the question, false if it does>
}

Only populate fields that were actually requested AND provided in the response.
Leave all other fields as null.

CRITICAL LOCATION RULE: 
If the follow-up question suggested a specific location (e.g. "Ito po ba yung sunog sa Zone 3, Barangay Kisolon?") and the citizen confirms ("Yes", "Opo", "Mao na"), you MUST extract "Zone 3, Barangay Kisolon" as the location_zone EXACTLY verbatim. Do not rephrase it.
`;

// ---------------------------------------------------------------------------
// Extraction shape — the raw JSON the LLM returns
// ---------------------------------------------------------------------------

export interface LLMExtraction {
  concern_type: ConcernType;
  location_raw: string | null;
  location_zone: string | null;
  location_landmark: string | null;
  urgency_level: UrgencyLevel;
  summary: string;
  affected_persons: AffectedPersons;
  original_language: Language;
  suggested_office: string | null;
  suggested_action: string | null;
  reply_draft: string | null;
  confidence: number;
  is_actionable?: boolean;
  is_realistic?: boolean;
  unrealistic_reason?: string | null;
  missing_fields: Array<{ field: string; question: string }>;
}

// ---------------------------------------------------------------------------
// Mapping: LLMExtraction → ParsedReport
// ---------------------------------------------------------------------------

/**
 * Maps the raw LLM extraction JSON into a typed ParsedReport.
 * Applies safe defaults for every field — tolerates partial LLM output.
 */
export function extractionToParsedReport(
  raw: RawMessage,
  extracted: LLMExtraction
): ParsedReport {
  return {
    rawMessageId: raw.id,
    citizenRef: raw.senderRef,
    channel: raw.channel,
    concernType: extracted.concern_type ?? "unknown",
    locationRaw: extracted.location_raw ?? null,
    locationZone: extracted.location_zone ?? null,
    locationLandmark: extracted.location_landmark ?? null,
    urgencyLevel: extracted.urgency_level ?? "low",
    summary: extracted.summary ?? "",
    affectedPersons: extracted.affected_persons ?? { count: null, groups: [] },
    originalLanguage: extracted.original_language ?? "mixed",
    suggestedOffice: extracted.suggested_office ?? null,
    suggestedAction: extracted.suggested_action ?? null,
    replyDraft: extracted.reply_draft ?? null,
    confidence: extracted.confidence ?? 0,
    isActionable: extracted.is_actionable ?? true,
    isRealistic: extracted.is_realistic ?? true,
    unrealisticReason: extracted.unrealistic_reason ?? null,
    missingFields: (extracted.missing_fields ?? []).map((f) => ({
      field: f.field,
      question: f.question,
    })),
  };
}

// ---------------------------------------------------------------------------
// Mapping: Clarification LLM output → ClarificationResult
// ---------------------------------------------------------------------------

/**
 * Maps the raw clarification LLM output into a typed ClarificationResult.
 * Filters out null values so only genuinely extracted fields are in `updates`.
 */
export function clarificationToResult(
  result: Record<string, unknown>
): ClarificationResult {
  const updates: Record<string, unknown> = {};

  if (result.location_raw != null) updates.location_raw = result.location_raw;
  if (result.location_zone != null) updates.location_zone = result.location_zone;
  if (result.location_landmark != null) updates.location_landmark = result.location_landmark;
  if (result.summary != null) updates.summary = result.summary;
  if (result.affected_persons_count != null || result.affected_persons_groups != null) {
    updates.affected_persons = {
      count: result.affected_persons_count ?? null,
      groups: result.affected_persons_groups ?? [],
    };
  }

  return {
    updates,
    replyDraft:
      (result.reply_draft as string) ??
      "✅ Salamat! Na-update na ang imong report {TICKET_NUMBER}.",
  };
}

// ---------------------------------------------------------------------------
// Clarification user prompt builder
// ---------------------------------------------------------------------------

/**
 * Builds the user prompt for a clarification resolution LLM call.
 * Deterministic — same context always produces the same prompt.
 */
export function buildClarificationUserPrompt(
  ctx: ClarificationContext
): string {
  const missingFieldsList = ctx.missingFields
    .map((f) => `- ${f.field}: "${f.question}"`)
    .join("\n");

  return `\
Original report (${ctx.concernType}): "${ctx.originalText}"
Summary: ${ctx.reportSummary}

We asked the citizen the following follow-up question(s):
${missingFieldsList}

The citizen replied: "${ctx.citizenResponse}"

Extract the missing information from their reply.`;
}

// ---------------------------------------------------------------------------
// High-level factories (provider-agnostic)
// ---------------------------------------------------------------------------

/**
 * Creates a ReportParser from any LLM provider.
 *
 * The provider only needs to implement `LLMJsonCall` — this function
 * handles the prompt and result mapping.
 */
export function createParser(llmCall: LLMJsonCall): ReportParser {
  return async (raw: RawMessage): Promise<ParsedReport> => {
    let prompt = REPORT_SYSTEM_PROMPT;
    if (raw.activeIncidentsContext) {
      prompt += `\n\nCURRENTLY ACTIVE INCIDENTS:\n${raw.activeIncidentsContext}\n\nIf the citizen's report might refer to one of these active incidents but lacks a specific location, frame your follow-up question to ask if they are referring to that specific incident (e.g. "Saan po ito? Ito po ba yung sunog sa Zone 3?").`;
    }
    const json = await llmCall(prompt, raw.text);
    return extractionToParsedReport(raw, json as unknown as LLMExtraction);
  };
}

/**
 * Creates a ClarificationResolver from any LLM provider.
 *
 * The provider only needs to implement `LLMJsonCall` — this function
 * handles the prompt building, the call, and the result mapping.
 */
export function createClarificationResolverFromLLM(
  llmCall: LLMJsonCall
): ClarificationResolver {
  return async (ctx: ClarificationContext): Promise<ClarificationResult> => {
    const userPrompt = buildClarificationUserPrompt(ctx);
    const json = await llmCall(CLARIFICATION_SYSTEM_PROMPT, userPrompt);
    return clarificationToResult(json);
  };
}

// ---------------------------------------------------------------------------
// Synthesis logic
// ---------------------------------------------------------------------------

export const SYNTHESIS_SYSTEM_PROMPT = `\
You are an emergency dispatch AI for LihokBarangAI.
Your job is to combine two emergency summaries into a single cohesive summary.
Include all critical details from both.
Return ONLY a valid JSON object — no markdown, no explanation.

JSON shape:
{
  "synthesized_summary": "<1-3 sentence combined summary>"
}
`;

export function createSynthesizerFromLLM(llmCall: LLMJsonCall): SummarySynthesizer {
  return async (ctx: SynthesisContext): Promise<string> => {
    const userText = `Current Summary: "${ctx.currentSummary}"\nNew Supplemental Report: "${ctx.newReportSummary}"\nCombine these into a single cohesive summary.`;
    const json = await llmCall(SYNTHESIS_SYSTEM_PROMPT, userText) as { synthesized_summary?: string };
    return json.synthesized_summary?.trim() || ctx.currentSummary;
  };
}
