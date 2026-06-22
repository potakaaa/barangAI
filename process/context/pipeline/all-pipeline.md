---
name: context:all-pipeline
description: "SMS/Telegram ingestion, LLM parsing, clarification follow-ups, and clustering edge functions — the pipeline group entrypoint/router"
keywords: pipeline, ingest, ingestion, sms, telegram, semaphore, webhook, parser, gemini, openai, llm, clarification, cluster-batch, clustering, believability, edge function, supabase functions
related: [context:all-database]
date: 22-06-26
---

# Pipeline Context

This file is the canonical ingestion/processing pipeline context entrypoint for LihokBarangAI.

Use it after `process/context/all-context.md` when the task involves the Supabase Edge Functions that ingest, parse, clarify, or cluster citizen reports.

---

## Scope

This group covers:

- The `ingest` edge function: receives inbound SMS (Semaphore gateway) or Telegram webhook payloads
- Channel adapters (`_shared/adapters/sms.ts`, `_shared/adapters/telegram.ts`) — normalize inbound payloads per channel
- LLM parsers (`_shared/parsers/openai.ts`, `_shared/parsers/gemini.ts`, `_shared/parsers/shared.ts`) — extract structured report fields + believability + embeddings from raw message text
- Clarification flow (`_shared/clarification.ts`) — detects missing critical fields (e.g. location) and sends follow-up questions
- Reply adapters (`_shared/reply/sms.ts`, `_shared/reply/telegram.ts`) — send clarification/ack messages back to the citizen on the originating channel
- The `cluster-batch` edge function: periodic job that groups similar reports into `incidents` via `match_similar_reports`
- The `CHANNEL` env var that toggles which inbound channel is active

It does not cover:

- Table/column definitions or migrations (see `process/context/database/all-database.md`)
- The web dashboard (`apps/web`) — it currently renders mock data and is not yet wired to this pipeline's output

## Read When

Read this entrypoint when:

- modifying the ingest webhook handler or adding a new inbound channel
- changing LLM prompt/parsing logic, believability scoring, or embedding generation
- working on the clarification follow-up flow
- changing clustering logic, thresholds, or the `cluster-batch` schedule
- debugging a stuck/duplicate message via `raw_messages.external_message_id`

## Quick Routing

No deeper docs exist yet beyond this entrypoint — read the source files directly listed below; the function bodies are the source of truth (under 300 lines each).

## Source Paths

- `supabase/functions/ingest/index.ts` — webhook entrypoint, channel dispatch, pipeline orchestration (289 lines)
- `supabase/functions/cluster-batch/index.ts` — scheduled clustering job (143 lines)
- `supabase/functions/_shared/pipeline.ts` — shared ingest→parse→store pipeline steps (135 lines)
- `supabase/functions/_shared/clarification.ts` — missing-field detection + follow-up question flow (217 lines)
- `supabase/functions/_shared/types.ts` — shared types across functions (232 lines)
- `supabase/functions/_shared/adapters/sms.ts`, `telegram.ts` — inbound payload normalization per channel
- `supabase/functions/_shared/parsers/openai.ts`, `gemini.ts`, `shared.ts` — LLM extraction logic
- `supabase/functions/_shared/reply/sms.ts`, `telegram.ts` — outbound reply per channel
- `supabase/functions/_shared/storage/supabase.ts` — Supabase client/storage helpers used by the pipeline
- `package.json` `sb:*` scripts — manual deploy/link/secrets/logs/webhook/cron commands (no CI/CD)

## Update Triggers

Update this group when:

- a new inbound channel is added beyond SMS/Telegram
- the LLM provider or prompt structure changes (env names: `GEMINI_API_KEY`, `SEMAPHORE_API_KEY`, `TELEGRAM_BOT_TOKEN`)
- the clarification flow's missing-field rules change
- clustering thresholds, the embedding model, or the cron schedule (`sb:cron` invokes `cluster-batch` every minute via `pg_cron`/`pg_net`) change

## Canonical Notes

- **Channel toggle:** despite the `GEMINI_API_KEY` env var name being grouped under "OpenAI" in `.env.example`, the comment block is mislabeled — verify which provider is actually active in `parsers/shared.ts` before assuming either OpenAI or Gemini is the live parser.
- **No CI/CD:** edge functions deploy manually via `pnpm sb:deploy`; there is no automated pipeline. Be explicit with the user before deploying.
- Idempotency for replayed webhooks is enforced at the DB layer (`raw_messages.external_message_id` unique constraint), not in the function code — don't assume the ingest function itself dedupes.
- The dashboard (`apps/web`) does not yet consume this pipeline's output — `apps/web/src/lib/mock-data.ts` is the only data source today. Wiring the dashboard to live Supabase data is a known gap, not yet planned.
