// ─────────────────────────────────────────────────────────────────────────────
// LihokBarangAI — Core Pipeline Types
// All I/O contracts between pipeline stages are defined here.
// Swap a stage by implementing its function type. Nothing else changes.
// ─────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Domain enums
// ---------------------------------------------------------------------------

export type Channel = "telegram" | "sms";

export type ConcernType =
  | "flooding"
  | "fire"
  | "medical_emergency"
  | "crime_security"
  | "infrastructure"
  | "garbage_sanitation"
  | "noise_disturbance"
  | "missing_person"
  | "request_assistance"
  | "general_inquiry"
  | "unknown";

export type UrgencyLevel = "critical" | "high" | "medium" | "low";

export type Language = "cebuano" | "filipino" | "english" | "mixed";

export type ReportStatus =
  | "new"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "dismissed";

export type ParseStatus = "pending" | "processing" | "done" | "failed";

export type ClarificationStatus = "pending" | "resolved" | "expired";

// ---------------------------------------------------------------------------
// Pipeline stage I/O shapes
// ---------------------------------------------------------------------------

/**
 * Stage 1 output — normalized, channel-agnostic representation of an
 * incoming message. Produced by an IngestAdapter.
 */
export interface RawMessage {
  /** Internal UUID generated at ingest time. */
  id: string;
  channel: Channel;
  /** Unique ID from the external platform (Telegram update_id, SMS gateway msg id). */
  externalId: string;
  /** Channel-specific sender reference: Telegram chat_id or E.164 mobile number. */
  senderRef: string;
  text: string;
  receivedAt: string; // ISO 8601
  /** Full original webhook payload — kept for audit/replay. */
  rawPayload: unknown;
  /** Optional string containing a list of currently active incidents to help the LLM ask smart clarification questions. */
  activeIncidentsContext?: string;
}

/**
 * Stage 2 output — structured data extracted by an LLM from a RawMessage.
 * Produced by a ReportParser.
 */
export interface ParsedReport {
  rawMessageId: string;
  citizenRef: string;
  channel: Channel;
  concernType: ConcernType;
  locationRaw: string | null;
  locationZone: string | null;
  locationLandmark: string | null;
  urgencyLevel: UrgencyLevel;
  /** 1–2 sentence English summary of the concern. */
  summary: string;
  affectedPersons: AffectedPersons;
  originalLanguage: Language;
  suggestedOffice: string | null;
  suggestedAction: string | null;
  /**
   * LLM-generated reply draft in the citizen's original language.
   * Contains the placeholder {TICKET_NUMBER} to be substituted at storage time.
   * When missing_fields is non-empty, this should include the follow-up question.
   */
  replyDraft: string | null;
  /** 0.0–1.0 extraction confidence from the LLM. */
  confidence: number;
  /**
   * Fields the LLM determined are missing but important for this concern type.
   * Empty array = report is complete, no follow-up needed.
   */
  missingFields: MissingField[];
  /**
   * True if the message is a genuine concern. False if it is just a greeting ("Hi", "Hello") or useless noise.
   * If false, the report will not be stored in the database, but the replyDraft will still be sent.
   */
  isActionable: boolean;
  /**
   * True if the report sounds physically possible and realistic.
   * False if it sounds like a prank, exaggeration, or impossibility (e.g., alien invasion).
   */
  isRealistic: boolean;
  /** If isRealistic is false, a brief explanation of why the LLM flagged it as unrealistic. */
  unrealisticReason: string | null;
}

/**
 * A field that the LLM flagged as missing from the citizen's message.
 * Contains both the field identifier and a follow-up question in the
 * citizen's language to ask for it.
 */
export interface MissingField {
  /** The report field that's missing (e.g. "location", "affected_persons"). */
  field: string;
  /** Follow-up question in the citizen's original language. */
  question: string;
}

export interface AffectedPersons {
  count: number | null;
  groups: Array<"senior_citizen" | "children" | "pwds" | "general">;
}

/**
 * Stage 3 output — confirmed persisted record.
 * Produced by a ReportStorage implementation.
 */
export interface StoredReport {
  id: string;
  ticketNumber: string;
  rawMessage: RawMessage;
  parsedReport: ParsedReport;
  /** Reply text with {TICKET_NUMBER} substituted. */
  resolvedReplyText: string | null;
  status: ReportStatus;
  isRealistic: boolean;
  unrealisticReason: string | null;
  createdAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Pipeline stage function types
// ---------------------------------------------------------------------------

/**
 * Converts a raw webhook payload into a RawMessage.
 * Returns null to signal "skip" (e.g., non-text Telegram updates).
 * Swap this to change the ingest channel (Telegram → SMS).
 */
export type IngestAdapter = (payload: unknown) => RawMessage | null;

/**
 * Extracts structured data from a RawMessage using an AI/NLP backend.
 * Swap this to change the LLM provider (OpenAI → Gemini → local model).
 */
export type ReportParser = (raw: RawMessage) => Promise<ParsedReport>;

/**
 * Persists a RawMessage + ParsedReport and returns the stored record.
 * Swap this to change the database backend.
 */
export type ReportStorage = (
  raw: RawMessage,
  parsed: ParsedReport
) => Promise<StoredReport>;

/**
 * Sends a reply back to the citizen via the appropriate channel.
 * Optional stage — omit to disable auto-replies.
 * Swap this to change the reply channel (Telegram → SMS).
 */
export type ReplyHandler = (stored: StoredReport) => Promise<void>;

// ---------------------------------------------------------------------------
// Clarification types
// ---------------------------------------------------------------------------

/**
 * A pending follow-up question linked to an already-created report.
 * The report exists with null fields — this tracks that we're waiting
 * for the citizen to fill them in.
 */
export interface PendingClarification {
  id: string;
  reportId: string;
  ticketNumber: string;
  senderRef: string;
  channel: Channel;
  missingFields: MissingField[];
  originalText: string;
  reportSummary: string;
  concernType: ConcernType;
  originalLanguage: Language;
  status: ClarificationStatus;
  createdAt: string;
  resolvedAt: string | null;
}

/**
 * Context bundle passed to the ClarificationResolver so it can
 * make a focused LLM call to extract the missing information.
 */
export interface ClarificationContext {
  originalText: string;
  reportSummary: string;
  concernType: ConcernType;
  missingFields: MissingField[];
  citizenResponse: string;
  originalLanguage: Language;
}

/**
 * Result of resolving a clarification — field updates + confirmation reply.
 */
export interface ClarificationResult {
  /** Key-value pairs to merge into the report row. */
  updates: Record<string, unknown>;
  /** Confirmation reply to send to the citizen (includes {TICKET_NUMBER}). */
  replyDraft: string;
}

/**
 * Extracts missing field values from a citizen's follow-up response.
 * Uses an LLM to interpret the response in context of the original report.
 */
export type ClarificationResolver = (
  ctx: ClarificationContext
) => Promise<ClarificationResult>;

// ---------------------------------------------------------------------------
// Synthesis types
// ---------------------------------------------------------------------------

export interface SynthesisContext {
  currentSummary: string;
  newReportSummary: string;
}

export type SummarySynthesizer = (
  ctx: SynthesisContext
) => Promise<string>;
