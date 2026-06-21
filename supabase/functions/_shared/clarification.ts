// ─────────────────────────────────────────────────────────────────────────────
// Clarification Manager
// Database operations for the pending_clarifications table.
// Handles creating, looking up, and resolving follow-up questions.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type {
  PendingClarification,
  MissingField,
  Channel,
  ConcernType,
  Language,
  ClarificationResult,
} from "./types.ts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Clarifications older than this are considered expired and ignored. */
const CLARIFICATION_TTL_HOURS = 24;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface ClarificationManager {
  /**
   * Check if a sender has a pending (non-expired) clarification.
   * Returns the most recent one, or null.
   */
  getPending(senderRef: string): Promise<PendingClarification | null>;

  /**
   * Create a new pending clarification linked to an existing report.
   */
  create(params: {
    reportId: string;
    ticketNumber: string;
    senderRef: string;
    channel: Channel;
    missingFields: MissingField[];
    originalText: string;
    reportSummary: string;
    concernType: ConcernType;
    originalLanguage: Language;
  }): Promise<PendingClarification>;

  /**
   * Mark a pending clarification as resolved and update the linked report
   * with the extracted field values.
   */
  resolve(
    clarificationId: string,
    reportId: string,
    updates: Record<string, unknown>
  ): Promise<void>;

  /**
   * Expire old pending clarifications that are past the TTL.
   * Called opportunistically — not critical if it fails.
   */
  expireStale(): Promise<void>;
}

/**
 * Creates a ClarificationManager backed by Supabase.
 */
export function createClarificationManager(
  supabaseUrl: string,
  serviceRoleKey: string
): ClarificationManager {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  return {
    // ── getPending ───────────────────────────────────────────────────────────
    async getPending(senderRef: string): Promise<PendingClarification | null> {
      const cutoff = new Date(
        Date.now() - CLARIFICATION_TTL_HOURS * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await supabase
        .from("pending_clarifications")
        .select("*")
        .eq("sender_ref", senderRef)
        .eq("status", "pending")
        .gt("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[clarification] getPending query failed:", error.message);
        return null; // Non-fatal — fall through to normal pipeline
      }

      if (!data) return null;

      return {
        id: data.id,
        reportId: data.report_id,
        ticketNumber: data.ticket_number,
        senderRef: data.sender_ref,
        channel: data.channel as Channel,
        missingFields: data.missing_fields as MissingField[],
        originalText: data.original_text,
        reportSummary: data.report_summary,
        concernType: data.concern_type as ConcernType,
        originalLanguage: data.original_language as Language,
        status: data.status,
        createdAt: data.created_at,
        resolvedAt: data.resolved_at,
      };
    },

    // ── create ───────────────────────────────────────────────────────────────
    async create(params): Promise<PendingClarification> {
      const { data, error } = await supabase
        .from("pending_clarifications")
        .insert({
          report_id: params.reportId,
          ticket_number: params.ticketNumber,
          sender_ref: params.senderRef,
          channel: params.channel,
          missing_fields: params.missingFields,
          original_text: params.originalText,
          report_summary: params.reportSummary,
          concern_type: params.concernType,
          original_language: params.originalLanguage,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        throw new Error(
          `Failed to create pending clarification: ${error.message}`
        );
      }

      return {
        id: data.id,
        reportId: data.report_id,
        ticketNumber: data.ticket_number,
        senderRef: data.sender_ref,
        channel: data.channel as Channel,
        missingFields: data.missing_fields as MissingField[],
        originalText: data.original_text,
        reportSummary: data.report_summary,
        concernType: data.concern_type as ConcernType,
        originalLanguage: data.original_language as Language,
        status: data.status,
        createdAt: data.created_at,
        resolvedAt: data.resolved_at,
      };
    },

    // ── resolve ──────────────────────────────────────────────────────────────
    async resolve(
      clarificationId: string,
      reportId: string,
      updates: Record<string, unknown>
    ): Promise<void> {
      // Step 1: Update the report with the extracted fields
      if (Object.keys(updates).length > 0) {
        const { error: reportErr } = await supabase
          .from("reports")
          .update(updates)
          .eq("id", reportId);

        if (reportErr) {
          throw new Error(
            `Failed to update report with clarification data: ${reportErr.message}`
          );
        }
      }

      // Step 2: Mark the clarification as resolved
      const { error: clarErr } = await supabase
        .from("pending_clarifications")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", clarificationId);

      if (clarErr) {
        // Non-fatal — report is already updated
        console.error(
          "[clarification] Failed to mark as resolved:",
          clarErr.message
        );
      }
    },

    // ── expireStale ──────────────────────────────────────────────────────────
    async expireStale(): Promise<void> {
      const cutoff = new Date(
        Date.now() - CLARIFICATION_TTL_HOURS * 60 * 60 * 1000
      ).toISOString();

      const { error } = await supabase
        .from("pending_clarifications")
        .update({ status: "expired" })
        .eq("status", "pending")
        .lt("created_at", cutoff);

      if (error) {
        console.error(
          "[clarification] Failed to expire stale records:",
          error.message
        );
      }
    },
  };
}
