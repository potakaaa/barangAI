# LihokBarangAI - All Context

Last updated: 2026-06-22

LihokBarangAI turns ordinary SMS messages into structured, actionable citizen service tickets, helping Philippine barangays and LGUs respond faster to grassroots concerns without requiring residents to download an app. Citizens text in (SMS via Semaphore gateway in production, Telegram as a secondary/dev channel); an LLM parser extracts structured fields, scores believability (spam/prank filtering), and the system clusters similar reports into incidents via pgvector embeddings. Staff triage and respond from a web dashboard.

This file is the root context entrypoint for the repo.

Use it for two things:

1. quick routing to the right context pack or root file
2. broad architecture and repository understanding

Start here before loading deeper context files.

---

## How This File Works (the `all-*.md` Convention)

Every `process/context/` directory has one `all-*.md` entrypoint that acts as an attachable quick router for that domain. This root file (`all-context.md`) is the top-level router. Context groups each have their own `all-{group}.md` entrypoint.

**The pattern:**

```
process/context/
  all-context.md                      <-- THIS FILE: root router
  planning/
    all-planning.md                   <-- group router for planning
    example-simple-prd.md             <-- deep doc within the group
    example-complex-prd.md            <-- deep doc within the group
  tests/
    all-tests.md                      <-- group router for tests
    debugging-and-pitfalls.md         <-- deep doc within the group
    e2e-tests.md                      <-- deep doc within the group
  database/
    all-database.md                   <-- group router for database
    schema-guide.md                   <-- deep doc within the group
    migration-procedures.md           <-- deep doc within the group
```

**How agents use it:**

1. Agent reads `all-context.md` first (this file)
2. Finds the relevant context group from the routing tables below
3. Reads that group's `all-{group}.md` entrypoint
4. Only then loads the specific deep doc needed

This layered routing keeps context windows small. Never load the whole `process/context/` tree.

**What each `all-{group}.md` must contain:**

- Scope (what the group covers and does NOT cover)
- Read-when rules (when an agent should load this group)
- Quick procedures or decision rules
- Source paths (list of deeper docs in the group)
- Update triggers (when to refresh this group's content)
- Routing to deeper docs within the group

---

## Quick Start

For most substantial tasks:

1. read this file first
2. choose the smallest relevant root file or context group from the tables below
3. only then load deeper files

---

## Current Root Entry Points

<!-- The two tables below (Root Entry Points + Context Groups) are GENERATED from each
     context doc's frontmatter by `discover-context.mjs --emit-routing`. Do NOT hand-edit
     between the GENERATED markers — your edits will be overwritten on the next rebuild.
     To change a row, edit the owning doc's frontmatter (description / keywords) and re-emit.
     `--check-routing` fails lint if this block drifts from the frontmatter on disk. -->

<!-- GENERATED:routing -->
| File | Read when |
|---|---|
| `process/context/all-context.md` | any substantial planning, research, review, or implementation task |
| `process/context/database/all-database.md` | Supabase Postgres schema, migrations, RLS, and pgvector clustering — the database group entrypoint/router |
| `process/context/pipeline/all-pipeline.md` | SMS/Telegram ingestion, LLM parsing, clarification follow-ups, and clustering edge functions — the pipeline group entrypoint/router |

## Current Context Groups

| Group | Entry point | Scope |
|---|---|---|
| `database/` | `process/context/database/all-database.md` | Supabase Postgres schema, migrations, RLS, and pgvector clustering — the database group entrypoint/router |
| `pipeline/` | `process/context/pipeline/all-pipeline.md` | SMS/Telegram ingestion, LLM parsing, clarification follow-ups, and clustering edge functions — the pipeline group entrypoint/router |
<!-- /GENERATED:routing -->

## Task Routing Table

| If the task involves... | Start with |
|---|---|
| architecture or stack questions | this file |
| database schema, migrations, RLS, clustering queries | `process/context/database/all-database.md` |
| ingest/parse/clarification/cluster-batch edge functions | `process/context/pipeline/all-pipeline.md` |
| web dashboard (`apps/web`) or shared UI (`packages/ui`) | this file — no dedicated group yet, see Repository Structure and Key Patterns below |
| creating a new plan | `process/general-plans/active/` (no `planning/` context group exists — there is no PRD/planning library yet) |
| testing or verification | this file — no automated tests exist yet (see Scan Metadata); see `Environment and Configuration` for manual verification via `supabase` local stack |

## Context Group Lifecycle

Context groups are durable knowledge domains, not feature folders.

Create a group when:

- a topic has 3+ durable docs
- a single doc exceeds roughly 800 lines with separable subtopics
- multiple agents repeatedly need only one slice of a large context file
- the topic maps to a stable operational domain (tests, infra, database, auth, UI, workflows, etc.)

Do not create a group when:

- the content is a temporary report
- the content is a plan or execution artifact
- the topic is feature-specific and belongs in `process/features/...`

Move or split one group at a time. Use `all-{group}.md` entrypoints. Run the `audit-context` skill after every context organization change.

## Naming Convention

There are no `README.md` files inside `process/context/`.

Canonical entrypoints use `all-*.md`:

- root: `process/context/all-context.md`
- group: `process/context/{group}/all-{group}.md`

Each `all-{group}.md` file should act as the attachable quick router for that domain:

- tell the agent what the group covers
- give quick procedures and decision rules
- route to smaller deeper files

## Context Update Protocol

When durable project knowledge changes:

1. update the smallest relevant context file
2. update this file if routing, ownership, naming, or groups changed
3. update the owning `all-{group}.md` entrypoint when a group exists
4. run `audit-context`

---

## Repository Structure

```
barangAI/
  apps/
    web/                       -- TanStack Start (React 19) LGU staff dashboard
      src/routes/              -- file-based routes: dashboard, incidents, reports, map,
                                   command-center.$incidentId, settings, index
      src/components/          -- ai-urgency-panel, incident-row, leaflet-map, sms-feed-table,
                                   broadcast-form, stat-card, heat-zone-cell, etc.
      src/lib/mock-data.ts     -- CURRENTLY THE ONLY DATA SOURCE (not wired to Supabase yet)
  packages/
    ui/                        -- @workspace/ui: shared shadcn/radix components, Tailwind v4 styles
  supabase/
    functions/
      ingest/                  -- webhook entrypoint (SMS + Telegram)
      cluster-batch/           -- scheduled clustering job (pg_cron, every minute)
      _shared/
        adapters/              -- sms.ts, telegram.ts (inbound normalization)
        parsers/               -- openai.ts, gemini.ts, shared.ts (LLM extraction)
        reply/                 -- sms.ts, telegram.ts (outbound replies)
        storage/               -- supabase.ts (DB client helpers)
        pipeline.ts            -- shared ingest pipeline steps
        clarification.ts       -- missing-field follow-up flow
        types.ts               -- shared types
    migrations/                -- 7 numbered plain SQL migrations, no ORM
    config.toml                -- local Supabase stack config (project_id: lihokbarangai)
  process/
    context/                   -- this context system (root + database/ + pipeline/ groups)
    general-plans/             -- plans, reports, references
    development-protocols/     -- RIPER-5 methodology docs
```

## Technology Stack

- **Frontend framework:** TanStack Start (React 19) with file-based routing (`@tanstack/react-router`), Vite 8 dev/build
- **UI:** Tailwind CSS v4 + shadcn/radix components in `@workspace/ui`, Tremor (`@tremor/react`) for dashboard charts, Leaflet/`react-leaflet` for map views, `lucide-react` icons
- **Language:** TypeScript throughout, `strict: true`
- **Backend:** Supabase (hosted Postgres + Edge Functions, Deno runtime) — no separate Node/API server
- **Database:** Postgres on Supabase, plain numbered SQL migrations (no ORM), `pgvector` extension for semantic clustering (currently `vector(3072)`, matching `gemini-embedding-001`)
- **LLM providers:** OpenAI and Gemini parsers both exist (`_shared/parsers/openai.ts`, `gemini.ts`) — verify which is actually wired as default in `parsers/shared.ts` before assuming
- **Messaging channels:** SMS via Semaphore gateway (production), Telegram Bot API (dev/demo) — toggled via `CHANNEL` env var
- **Package manager:** pnpm 10.x (`packageManager: pnpm@10.33.4`)
- **Monorepo:** pnpm workspaces (`apps/*`, `packages/*`) + Turborepo for build/lint/format/typecheck orchestration
- **Deploy:** manual via `pnpm sb:*` scripts (`sb:deploy`, `sb:push`, `sb:secrets`, `sb:webhook`, `sb:cron`) — no CI/CD pipeline exists

## Key Patterns and Conventions

**Import aliases:** `@/*` → `apps/web/src/*`, `@workspace/ui/*` → `packages/ui/src/*` (see `apps/web/tsconfig.json`). `@workspace/ui` exports via subpaths: `./globals.css`, `./lib/*`, `./components/*`, `./hooks/*`.

**Routing:** TanStack Start file-based routes in `apps/web/src/routes/` — `__root.tsx` is the layout shell, `dashboard.tsx`/`incidents.tsx`/`reports.tsx`/`map.tsx`/`command-center.$incidentId.tsx`/`settings.tsx` are the staff-facing screens.

**Data flow gap (important):** the web app currently reads exclusively from `apps/web/src/lib/mock-data.ts`. It is NOT wired to the live Supabase `reports`/`incidents` tables yet. Treat "wire the dashboard to live data" as known future work, not an existing integration — don't assume API calls exist when working on `apps/web`.

**Migration convention:** numbered prefix SQL files in `supabase/migrations/` (`{NNNNNNN}_{description}.sql`), applied via `pnpm sb:push`. No ORM.

**Edge function structure:** each function (`ingest`, `cluster-batch`) has its own `index.ts`; shared logic lives in `_shared/` split by concern (`adapters/`, `parsers/`, `reply/`, `storage/`, plus top-level `pipeline.ts`, `clarification.ts`, `types.ts`). Runtime is Deno (Supabase Edge Functions), not Node.

**Naming:** kebab-case files throughout (both `apps/web` and `supabase/functions`), PascalCase React components, camelCase functions/variables.

## Environment and Configuration

**Config files:** `turbo.json` (build/lint/format/typecheck task graph), root `tsconfig.json` + per-package tsconfigs, `pnpm-workspace.yaml`, `supabase/config.toml` (local stack), `.env` (git-ignored, copy from `.env.example`)

**Env var groups (names only, never values):**
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`
- LLM: `GEMINI_API_KEY` (despite the `.env.example` comment block labeling this section "OpenAI" — verify actual provider wiring in `parsers/shared.ts`)
- Supabase: `SUPABASE_PROJECT_REF`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- SMS gateway (production only): `SEMAPHORE_API_KEY`
- Pipeline config: `CHANNEL` (`"telegram"` | `"sms"`)

**Local dev stack:** `supabase/config.toml` — API port 54321, DB port 54322, Studio port 54323, Postgres 15, `project_id: lihokbarangai`.

## Open Questions / Outstanding Work

- **Dashboard not wired to live data:** `apps/web` reads from `mock-data.ts` only — connecting it to Supabase `reports`/`incidents` is unplanned future work, not a bug.
- **No RLS policies found:** none of the 7 migrations define row-level security. Required before the dashboard (or any client) queries Supabase directly instead of through trusted server-side edge functions.
- **Ambiguous LLM provider wiring:** both OpenAI and Gemini parsers exist; `.env.example` mislabels the `GEMINI_API_KEY` section as "OpenAI". Confirm the live default in `parsers/shared.ts` before changing prompts or providers.
- **No automated tests, no CI/CD:** verification is manual (local Supabase stack + `pnpm typecheck`/`lint`); deploys are manual via `pnpm sb:*` scripts.

## Scan Metadata

- Generated: 22-06-26 (vc-setup STUDY phase)
- Repo HEAD commit: 1d9e2c4 (branch: feat/initial-frontend)
- Mode: New project setup (Flow A) — install.sh had run, no prior `process/context/` user content existed
- Package manager: pnpm 10.33.4, monorepo via pnpm workspaces + Turborepo
- No automated tests exist in the repo as of this scan (no `*.test.*` / `*.spec.*` files found) — `all-tests.md` / a `tests/` context group was intentionally NOT created; create one once a test runner is introduced
