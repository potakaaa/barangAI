---
name: context:all-database
description: "Supabase Postgres schema, migrations, RLS, and pgvector clustering — the database group entrypoint/router"
keywords: database, schema, migration, supabase, postgres, rls, pgvector, vector, embedding, clustering, incidents, reports, raw_messages
related: [context:all-pipeline]
date: 22-06-26
---

# Database Context

This file is the canonical database context entrypoint for LihokBarangAI.

Use it after `process/context/all-context.md` when the task involves schema changes, migrations, RLS policies, or the pgvector-based clustering queries.

---

## Scope

This group covers:

- Supabase Postgres schema: `raw_messages`, `reports`, `pending_clarifications`, `incidents`
- Migration history and conventions (`supabase/migrations/*.sql`, plain numbered SQL files, no ORM)
- pgvector usage for semantic clustering (`match_similar_reports` RPC, embedding dimension history)
- Believability/trust fields on `reports` (`is_realistic`, `unrealistic_reason`)
- RLS policy posture (high-risk surface — see Canonical Notes)

It does not cover:

- Edge function business logic that reads/writes these tables (see `process/context/pipeline/all-pipeline.md`)
- Frontend data fetching (the web app currently reads mock data, not this schema — see root `all-context.md`)

## Read When

Read this entrypoint when:

- adding or modifying a Supabase migration
- changing RLS policies or table-level security
- working with embeddings, `match_similar_reports`, or clustering thresholds
- debugging schema/data issues in `raw_messages`, `reports`, `pending_clarifications`, or `incidents`

## Quick Routing

No deeper docs exist yet beyond this entrypoint — the schema is small enough (7 migrations) that this file is the single source. Read the migration files directly in `supabase/migrations/` for full column-level detail; this file gives the conceptual map.

## Source Paths

- `supabase/migrations/20240001_raw_messages.sql` — immutable inbound message audit log, idempotent via `external_message_id` unique constraint
- `supabase/migrations/20240002_reports.sql` — core domain table, one row per citizen concern, ticket numbers `RPT-YYYY-NNNN`
- `supabase/migrations/20240003_pending_clarifications.sql` — tracks outstanding follow-up questions sent to citizens
- `supabase/migrations/20240004_believability.sql` — adds `is_realistic` / `unrealistic_reason` (prank/spam filtering)
- `supabase/migrations/20240005_incidents_clustering.sql` — `incidents` table + `vector` extension + `match_similar_reports` RPC
- `supabase/migrations/20240006_clustering_fixes.sql` — case-insensitive `location_zone` filtering in the similarity RPC
- `supabase/migrations/20240007_update_vector_dim.sql` — embedding dimension changed 768 → 3072 (switched to `gemini-embedding-001`)
- `supabase/config.toml` — local Supabase stack config (API port 54321, DB port 54322, project_id `lihokbarangai`)

## Update Triggers

Update this group when:

- a new migration is added
- RLS policies are introduced or changed (none exist yet as of the last scan — flag this as a gap if adding auth-gated dashboard access)
- the embedding model or vector dimension changes again
- the `incidents` clustering algorithm or thresholds change

## Canonical Notes

- **High-risk surface:** the user has flagged RLS/migrations as sensitive. Treat any schema or policy change as requiring careful review — this is citizen-facing government data.
- Migrations are plain numbered `.sql` files applied via `pnpm sb:push` — there is no ORM (no Prisma/Drizzle). Keep new migrations consistent with the existing numbered-prefix convention (`{NNNNNNN}_{description}.sql`).
- The vector dimension has already changed once (768 → 3072) due to an embedding model switch — any future model change requires the same alter-column + drop/recreate-RPC pattern as `20240007_update_vector_dim.sql`.
- No RLS policies were found in the migrations scanned — if/when the dashboard moves off mock data and queries Supabase directly from the client, RLS becomes mandatory before that ships.
