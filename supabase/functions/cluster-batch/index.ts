import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createSynthesizerFromLLM } from "../_shared/parsers/shared.ts";
import { createGeminiLLMCall } from "../_shared/parsers/gemini.ts";

// Ensure environment variables are present
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const primaryLLM = createGeminiLLMCall(GEMINI_API_KEY);
const synthesizeSummaries = createSynthesizerFromLLM(primaryLLM);

/**
 * Generate text embeddings using Google's Gemini API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text }] }
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate embedding: ${await response.text()}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

Deno.serve(async (req: Request) => {
  // Simple auth to ensure only authorized callers (like pg_cron) can run this
  // We use TELEGRAM_WEBHOOK_SECRET since it's already in the .env file
  const EXPECTED_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
  const authHeader = req.headers.get("Authorization");

  if (authHeader !== `Bearer ${EXPECTED_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("[cluster-batch] Starting async report clustering...");

  try {
    // 1. Fetch up to 50 reports that don't have an embedding or aren't assigned to an incident yet.
    // In a real system you might want to fetch reports where `summary_embedding is null` 
    // OR `incident_id is null`.
    const { data: reports, error: fetchErr } = await supabase
      .from("reports")
      .select("id, summary, concern_type, location_zone, summary_embedding, incident_id, urgency_level")
      .is("incident_id", null)
      .limit(50);

    if (fetchErr) throw fetchErr;
    if (!reports || reports.length === 0) {
      console.log("[cluster-batch] No pending reports to cluster.");
      return new Response("OK", { status: 200 });
    }

    // 2. Process each report
    for (const report of reports) {
      let embedding = report.summary_embedding;

      // Generate embedding if missing
      if (!embedding) {
        try {
          // We embed the English summary, effectively bypassing multilingual issues
          embedding = await generateEmbedding(report.summary);

          // Save embedding to DB
          const { error: embUpdateErr } = await supabase
            .from("reports")
            .update({ summary_embedding: JSON.stringify(embedding) })
            .eq("id", report.id);

          if (embUpdateErr) {
            console.error(`[cluster-batch] Error saving embedding for ${report.id}:`, embUpdateErr);
          }
        } catch (embErr) {
          console.error(`[cluster-batch] Failed embedding for report ${report.id}:`, embErr);
          continue; // Skip to next report
        }
      }

      // 3. Search for similar reports / existing incidents
      const { data: similar, error: searchErr } = await supabase.rpc("match_similar_reports", {
        query_embedding: JSON.stringify(embedding),
        match_threshold: 0.70, // Lowered threshold because we are now enforcing strict location matching
        match_count: 5,
        filter_concern_type: report.concern_type,
        filter_location_zone: report.location_zone // We can turn this back on because ingest normalizes the locations!
      });

      if (searchErr) {
        console.error(`[cluster-batch] Search RPC failed for ${report.id}:`, searchErr);
        continue;
      }

      // Note: `match_similar_reports` might return the current report itself (similarity = 1.0).
      // We filter out the exact same report id, and look for others that already have an incident.
      const existingIncidentMatch = similar?.find(s => s.id !== report.id && s.incident_id !== null);

      let targetIncidentId = null;

      if (existingIncidentMatch) {
        // High similarity match found with an existing incident! Cluster them.
        targetIncidentId = existingIncidentMatch.incident_id;
        console.log(`[cluster-batch] Clustered report ${report.id} -> existing incident ${targetIncidentId}`);

        // --- ROLLING SYNTHESIS ---
        try {
          // Fetch current incident title
          const { data: currentIncident } = await supabase
            .from("incidents")
            .select("title")
            .eq("id", targetIncidentId)
            .single();

          if (currentIncident && currentIncident.title) {
            // Strip the concern type prefix like [MEDICAL_EMERGENCY] to avoid duplicate prefixes
            const prefixMatch = currentIncident.title.match(/^\[.*?\]\s*(.*)$/);
            const currentSummary = prefixMatch ? prefixMatch[1] : currentIncident.title;

            // Generate new combined summary using the shared scaffolding
            const updatedSummary = await synthesizeSummaries({ 
              currentSummary, 
              newReportSummary: report.summary 
            });
            const newTitle = `[${report.concern_type.toUpperCase()}] ${updatedSummary}`;

            // Update incident title
            await supabase
              .from("incidents")
              .update({ title: newTitle })
              .eq("id", targetIncidentId);
              
            console.log(`[cluster-batch] Synthesized new title for incident ${targetIncidentId}`);
          }
        } catch (synthErr) {
          console.error(`[cluster-batch] Failed to synthesize summaries for ${targetIncidentId}:`, synthErr);
        }

      } else {
        // No match found. Create a new incident.
        const { data: newIncident, error: incErr } = await supabase
          .from("incidents")
          .insert({
            title: `[${report.concern_type.toUpperCase()}] ${report.summary}`,
            concern_type: report.concern_type,
            location_zone: report.location_zone,
            urgency: report.urgency_level,
            status: "open"
          })
          .select("id")
          .single();

        if (incErr || !newIncident) {
          console.error(`[cluster-batch] Failed to create incident for ${report.id}:`, incErr);
          continue;
        }
        targetIncidentId = newIncident.id;
        console.log(`[cluster-batch] Created new incident ${targetIncidentId} for report ${report.id}`);
      }

      // 4. Update the report with the final incident ID
      await supabase
        .from("reports")
        .update({ incident_id: targetIncidentId })
        .eq("id", report.id);
    }

    return new Response("Batch clustered successfully", { status: 200 });
  } catch (error) {
    console.error("[cluster-batch] Fatal error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
