---
name: plan:dashboard-ui-refactor
description: "Presentation-layer refactor of the LihokBarangAI staff dashboard to match screens/Main UI.png — shadcn-first, mock-data only, mobile responsive"
date: 22-06-26
feature: none
---

# Dashboard UI Refactor — PLAN

**Date**: 22-06-26
**Status**: Active — PLAN written, VALIDATE pending
**Complexity**: SIMPLE (one-session, single plan artifact, no schema/auth/API surface)

> TL;DR: Rebuild the `apps/web` staff dashboard to visually match `screens/Main UI.png` using shadcn primitives (install `sidebar`, `chart`, `avatar`, `dropdown-menu`, `sheet`), replace the hand-rolled `app-shell.tsx` and the Tremor `AreaChart` with shadcn equivalents, restyle the stat-card row (sparkline + progress/check + patrol pills) and the content cards, and make it fully mobile responsive. **Pure presentation: no backend/API wiring — mock-data only.** Verification is manual (dev server + visual diff) plus `pnpm typecheck` / `pnpm lint`. VALIDATE runs next.

**Phase skip note:** SPEC and INNOVATE were skipped per CLAUDE.md skip condition — *"Scope is purely mechanical, no design choices."* The target is a fixed reference screenshot plus an explicit constraint set (shadcn-first / no-integrations / mobile-responsive), not a multi-option design decision. There is no Decision Summary because INNOVATE did not run.

---

## Overview

This plan refactors the LihokBarangAI staff dashboard (`apps/web`) to visually match the reference screenshot `screens/Main UI.png`. It is a **pure presentation-layer change**: no Supabase/API wiring, no schema, no auth — the existing `apps/web/src/lib/mock-data.ts` stays the only data source (extended additively for richer card shapes). The work is shadcn-first: install the missing shadcn primitives into `packages/ui`, replace the hand-rolled `app-shell.tsx` sidebar with the shadcn `sidebar` block, swap the Tremor `AreaChart` for the shadcn `chart` (Recharts) block, restyle the stat-card row and content cards to the screenshot, then do a mobile-responsiveness pass. Risk is LOW; the only meaningful blast surface is the shared `AppShell`, which all routes consume — so every route is smoke-checked after the shell rewrite. Context loaded: `process/context/all-context.md` (root router) plus the current dashboard route, mock-data, app-shell, and `packages/ui` component inventory.

## Goals

1. Dashboard (`apps/web/src/routes/dashboard.tsx`) visually matches `screens/Main UI.png`.
2. Left nav is built on the shadcn `sidebar` block (replacing hand-rolled `app-shell.tsx` sidebar/mobile-nav), with collapse + built-in mobile sheet behavior.
3. SLA trend chart + "Total Incidents" sparkline use the shadcn `chart` block (Recharts), **not** `@tremor/react`.
4. Stat cards match the screenshot: Avg. Response Time (trend), Total Incidents (bar sparkline), Dispatch Efficiency (progress + green check), Active Patrols (42/50 + P1/P2/P3/+39 team pills).
5. Content cards (Incident Category, Recent Incident List, System Logs, Live Alerts) match the rounded-2xl / soft-shadow / sage-mint styling.
6. Fully mobile responsive across all the above.
7. Zero new backend calls; mock-data is the only data source.

## Scope

**In scope:** `apps/web` dashboard route + its dashboard components + the shared shell; `packages/ui` shadcn component installs; `apps/web/src/lib/mock-data.ts` field additions for richer card shapes.

**Out of scope:** Supabase/API wiring, RLS, edge functions, any data-fetch logic. Non-dashboard routes (`incidents`, `reports`, `map`, `settings`, `command-center`, `index`) get only incidental consistency touch-up where they break against the new shell — they are NOT a focus and must not be redesigned.

---

## Reference Screenshot Description (`screens/Main UI.png`)

Light cream/mint surface theme. **Left sidebar:** logo + "LihokBarangAI / Admin Console" header, nav with rounded green-highlighted active item, footer with avatar initials + "Sign Out". **Top row — 4 stat cards:** "Avg. Response Time" 4.2 mins +12%; "Total Incidents" 1,467 +4% with a small bar sparkline; "Dispatch Efficiency" 98.4% with a green progress/check icon; "Active Patrols" 42/50 with colored team pills P1/P2/P3/+39. **Mid row:** large "Response Time SLA Trends" area chart card (green gradient fill, dashed target line) + narrower "Incident Category" card with horizontal labeled percentage bars (Public Disturbance 67%, Medical Emergency 46.4%, Flood Safety 38.1%, Traffic/Accident 24.7%, Peace & Order 10.3%) and a "View Full Inventory" button. **Bottom row:** "Recent Incident List" card with colored severity tags (CRITICAL/MEDIUM) + location + time-ago, paired with a "System Logs" card, plus a separate floating "Live Alerts" panel. Rounded-2xl cards, soft shadows, generous padding, sage/mint green accent throughout.

---

## Touchpoints

### A. `packages/ui` — shadcn component installs (additive, generated)

Run from the package that owns the shadcn registry. Add the missing primitives:

| Component | Command (run in repo root; target `packages/ui`) | Why needed |
|---|---|---|
| sidebar | `pnpm dlx shadcn@latest add sidebar` | Left nav shell + built-in mobile sheet/collapsible |
| chart | `pnpm dlx shadcn@latest add chart` | SLA area chart + Total Incidents bar sparkline (Recharts) |
| avatar | `pnpm dlx shadcn@latest add avatar` | Sidebar user footer initials |
| dropdown-menu | `pnpm dlx shadcn@latest add dropdown-menu` | Card `⋮` overflow menus + user menu |
| sheet | `pnpm dlx shadcn@latest add sheet` | Mobile nav drawer (sidebar dep; install explicitly if not pulled transitively) |

> EXECUTE note: `sidebar` typically pulls `sheet`, `tooltip`, `skeleton`, `separator`, `input`, `button` as deps (most already present). Confirm `recharts` lands as a dependency of `chart` — if shadcn does not add it, `pnpm add recharts -F @workspace/ui`. Verify install paths land in `packages/ui/src/components/` (per `packages/ui/components.json` aliases) and that `globals.css` already-present `--chart-*` / `--sidebar-*` tokens are respected (they are — no token edits needed).

### B. `apps/web` — files to MODIFY / ADD

| File | Action | Change |
|---|---|---|
| `apps/web/src/components/app-shell.tsx` | rewrite | Rebuild on `SidebarProvider` + `Sidebar`/`SidebarHeader`/`SidebarContent`/`SidebarMenu`/`SidebarFooter`; replace hand-rolled collapse state + the `lg:hidden` mobile nav strip with built-in `SidebarTrigger` + mobile sheet. Keep logo, nav items, user footer (now `Avatar`), Live Alerts footer, top-bar search. |
| `apps/web/src/components/stat-card.tsx` | extend | Support 4 visual variants: trend-only, bar-sparkline (shadcn chart), progress+check icon, fraction + team pills. Keep existing prop API backward-compatible; add optional `variant` / `sparkline` / `pills` / `fraction` props. |
| `apps/web/src/components/category-bar.tsx` | restyle | Match labeled horizontal % bars (rounded, mint fill) from screenshot. |
| `apps/web/src/components/section-card.tsx` | restyle | rounded-2xl, soft shadow, generous padding; `⋮` action → `dropdown-menu`. |
| `apps/web/src/components/incident-row.tsx` | restyle | CRITICAL/MEDIUM severity tags via `badge`, location + time-ago layout. |
| `apps/web/src/components/system-log-feed.tsx` | restyle | Match System Logs card styling. |
| `apps/web/src/routes/dashboard.tsx` | modify | Replace Tremor `<AreaChart>` with a new shadcn-chart component (see new file below); pass new stat-card variant props; keep section grid layout matching screenshot. |
| `apps/web/src/components/sla-trend-chart.tsx` | **ADD** | New shadcn `ChartContainer` + Recharts `AreaChart` (green gradient fill, dashed target line) consuming `responseTrend`. |
| `apps/web/src/components/total-incidents-sparkline.tsx` | **ADD** (or inline in stat-card) | shadcn chart bar sparkline consuming new `totalIncidentsSparkline` mock field. |
| `apps/web/src/lib/mock-data.ts` | extend | Add `totalIncidentsSparkline: number[]`, `dispatchEfficiency: { value: number }`, `activePatrols: { active: number; total: number; teams: string[] }`. Do NOT remove existing exports (other routes consume them). |

### C. Incidental consistency (only if broken by the shell change)

`incidents.tsx`, `reports.tsx`, `map.tsx`, `settings.tsx`, `command-center.$incidentId.tsx`, `index.tsx` — only adjust if the new `SidebarProvider` wrapper changes their layout contract (e.g. they render inside `AppShell`). No redesign.

---

## Public Contracts

- **No package-external contracts change.** This is `apps/web` + `packages/ui` internal presentation only.
- `packages/ui` gains new exported components (`sidebar`, `chart`, `avatar`, `dropdown-menu`, `sheet` via `@workspace/ui/components/*`) — additive, no breakage to existing exports.
- `mock-data.ts` exports are **additive** (new fields/exports); existing exports (`stats`, `responseTrend`, `categories`, `recentIncidents`, `logs`, plus `smsFeed`/`heatZones`/`personnel`/`mapIncidents`) keep their shape so other routes do not break.
- `StatCard` prop API is extended backward-compatibly (new props optional).

## Blast Radius

- **Packages:** 2 (`apps/web`, `packages/ui`).
- **Files:** ~9 modified + 2 added in `apps/web`; ~5 generated component files added in `packages/ui`; 1 mock-data extension.
- **Risk class:** LOW — presentation-only, no schema/auth/API/billing/migration/secrets surface. No runtime/deploy change. Main risk is visual regression on non-dashboard routes via the shared `AppShell` rewrite.
- **Highest-risk items:** (1) `app-shell.tsx` rewrite (shared by all routes) — mitigate by smoke-checking every route after the shell change; (2) Tremor→shadcn chart swap (data shape `responseTrend` must map cleanly to Recharts).

---

## Implementation Checklist

> Ordered for execution. Each section ends with a per-section gate (typecheck the touched package + visual check) before moving on.

**1. Install missing shadcn primitives into `packages/ui`.**
   1.1 `pnpm dlx shadcn@latest add sidebar chart avatar dropdown-menu sheet` (confirm each lands in `packages/ui/src/components/`).
   1.2 Confirm `recharts` is a `packages/ui` dependency (add via `pnpm add recharts -F @workspace/ui` if shadcn didn't).
   1.3 Gate: `pnpm typecheck -F @workspace/ui` green; new files present.

**2. Rebuild `app-shell.tsx` on the shadcn sidebar block.**
   2.1 Wrap app in `SidebarProvider`; build `Sidebar` with `SidebarHeader` (logo + "LihokBarangAI / Admin Console"), `SidebarContent` (`SidebarMenu` from existing `navItems`, active item green-highlighted), `SidebarFooter` (`Avatar` initials "JD" + name/role + "Sign Out").
   2.2 Replace hand-rolled `isSidebarOpen` state + `lg:hidden` mobile nav strip with `SidebarTrigger` + the sidebar block's built-in mobile sheet (decision: shadcn sidebar's mobile sheet REPLACES the current partial mobile-nav strip).
   2.3 Keep top-bar search (`TopBarSearch`) and the Live Alerts footer; preserve active-route detection logic.
   2.4 Gate: `pnpm typecheck`; dev server — sidebar collapses on desktop, opens as sheet on mobile, all nav links route correctly.

**3. Rebuild stat-cards row to match screenshot.**
   3.1 Extend `StatCard` with variants: `trend` (Avg Response Time), `sparkline` (Total Incidents — uses `total-incidents-sparkline.tsx`), `progressCheck` (Dispatch Efficiency — progress bar + green check icon), `pills` (Active Patrols — `42/50` fraction + P1/P2/P3/+39 badges).
   3.2 Add `total-incidents-sparkline.tsx` (shadcn chart bar) consuming `totalIncidentsSparkline`.
   3.3 Extend `mock-data.ts` with `totalIncidentsSparkline`, `dispatchEfficiency`, `activePatrols`.
   3.4 Wire `dashboard.tsx` stat section to pass per-card variant props.
   3.5 Gate: `pnpm typecheck`; visual — 4 cards match screenshot at desktop width.

**4. Replace Tremor SLA chart with shadcn chart.**
   4.1 Add `sla-trend-chart.tsx`: shadcn `ChartContainer` + Recharts `AreaChart`, green gradient `fill` from `--chart-1`, dashed `target` reference/line, consuming `responseTrend` (`time`/`minutes`/`target`).
   4.2 Replace the `<AreaChart>` import+usage in `dashboard.tsx` with `<SlaTrendChart>`; remove the `@tremor/react` import from this route.
   4.3 Gate: `pnpm typecheck`; visual — chart renders with gradient + dashed target, no Tremor remnant in `dashboard.tsx`.

**5. Polish content cards (Incident Category / Recent Incidents / System Logs / Live Alerts).**
   5.1 `section-card.tsx`: rounded-2xl, soft shadow, generous padding; `⋮` → `dropdown-menu`.
   5.2 `category-bar.tsx`: labeled horizontal mint % bars matching screenshot; keep "View Full Inventory" button styling.
   5.3 `incident-row.tsx`: CRITICAL/MEDIUM `badge` severity tags + location + time-ago.
   5.4 `system-log-feed.tsx`: match System Logs card; confirm Live Alerts panel styling (lives in `app-shell.tsx` footer).
   5.5 Gate: `pnpm typecheck`; visual — all four card surfaces match screenshot.

**6. Mobile responsiveness pass.**
   6.1 Verify sidebar → mobile sheet; stat cards stack (1-col → 2-col → 4-col); chart + category card stack; incident/logs cards stack; Live Alerts panel readable on narrow viewport.
   6.2 Check no horizontal overflow at 375px / 768px / 1280px.
   6.3 Smoke-check every other route (`incidents`, `reports`, `map`, `settings`, `command-center`, `index`) still renders inside the new shell with no layout break.
   6.4 Gate: `pnpm typecheck` + `pnpm lint` clean repo-wide.

**7. Verification (final).**
   7.1 `pnpm typecheck` (repo-wide) green.
   7.2 `pnpm lint` green.
   7.3 Dev server visual diff against `screens/Main UI.png` for the dashboard.
   7.4 Confirm `@tremor/react` no longer imported by `dashboard.tsx` (grep). (Leaving the dep installed is fine if other routes still use it — verify before removing from package.json.)

---

## Phase Completion Rules

This is a SIMPLE single-session plan, not a phase program — there is one delivery, gated section-by-section.

- A checklist **section** is `DONE` only when its per-section gate passes: the touched package typechecks AND the visual check for that section matches the screenshot.
- The plan is **CODE DONE** when all 7 checklist sections are complete and `pnpm typecheck` + `pnpm lint` pass repo-wide.
- The plan is only `✅ VERIFIED` after a human/agent confirms the dashboard visual diff against `screens/Main UI.png` (Agent-Probe) AND confirms no route regressed under the new shell — code-only completion is `CODE DONE`, never `VERIFIED`, because this repo has no automated visual-regression test.
- Do not mark any section complete on typecheck alone if its visual gate is unmet.

---

## Acceptance Criteria (testable)

| # | Criterion | How observed |
|---|---|---|
| AC1 | Dashboard visually matches `screens/Main UI.png` (layout, 4 stat cards, SLA chart, category bars, incident/logs cards, live alerts) | Dev-server visual diff |
| AC2 | Left nav is the shadcn `sidebar` block; mobile uses its built-in sheet (no hand-rolled mobile strip) | Code review + mobile dev-server check |
| AC3 | SLA chart + Total Incidents sparkline use shadcn `chart` (Recharts); `dashboard.tsx` no longer imports `@tremor/react` | `grep -n "@tremor/react" apps/web/src/routes/dashboard.tsx` returns nothing |
| AC4 | shadcn `sidebar`, `chart`, `avatar`, `dropdown-menu`, `sheet` exist in `packages/ui/src/components/` | `ls packages/ui/src/components/` |
| AC5 | No backend/API calls added; mock-data only | Code review — no fetch/supabase import added |
| AC6 | Fully responsive at 375 / 768 / 1280px, no horizontal overflow; all routes render in new shell | Dev-server responsive check |
| AC7 | `pnpm typecheck` and `pnpm lint` pass | Command exit 0 |

---

## Verification Evidence

> This repo has **no automated test runner** (confirmed: `process/context/all-context.md` Scan Metadata — no `*.test.*`/`*.spec.*` files, `tests/` context group intentionally not created). The `all-tests.md` routing chain has no deeper docs because none exist. Coverage is therefore Hybrid (typecheck/lint) + Agent-Probe (visual diff) — this is a documented infra reality, NOT a `TIER_ASSIGNMENTS_BLOCKED` skip. There are no SPEC acceptance criteria (SPEC skipped); the "Proves SPEC criterion" column maps to this plan's Acceptance Criteria.

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `pnpm typecheck` (repo-wide) exits 0 | Hybrid (deterministic, needs deps installed) | AC7 |
| `pnpm lint` exits 0 | Hybrid | AC7 |
| `grep -n "@tremor/react" apps/web/src/routes/dashboard.tsx` returns nothing | Fully-Automated | AC3 |
| `ls packages/ui/src/components/` shows sidebar/chart/avatar/dropdown-menu/sheet | Fully-Automated | AC4 |
| Code review: no fetch/supabase import added to `apps/web` dashboard files | Agent-Probe | AC5 |
| Dev-server visual diff of dashboard vs `screens/Main UI.png` | Agent-Probe (human/agent visual judgment) | AC1, AC2 |
| Dev-server responsive check at 375 / 768 / 1280px across all routes | Agent-Probe | AC6 |

**Known-gap → CONDITIONAL note:** AC1/AC2/AC6 are proven only by Agent-Probe (no automated visual-regression harness in this repo). Per the vacuous-green ban, these visual behaviors stay CONDITIONAL until a human/agent confirms the visual diff. Backlog stub recommendation (Test Infra Notes below) records the missing automated UI-regression coverage.

**EXECUTE results (22-06-26):**

| Gate | Result |
|---|---|
| `pnpm typecheck` | PASS (0 errors) |
| `pnpm lint` | PASS (0 errors, 3 pre-existing warnings in generated shadcn `chart.tsx`/`sidebar.tsx` — `no-shadow`, acceptable) |
| `grep -n "@tremor/react" apps/web/src/routes/dashboard.tsx` | empty — confirmed removed |
| `ls packages/ui/src/components/` | sidebar.tsx, chart.tsx, avatar.tsx, dropdown-menu.tsx, sheet.tsx all present |
| No backend/API import added | confirmed by code review — mock-data only |
| Dev-server visual diff (1440×900) vs `screens/Main UI.png` | PASS — stat-card variants (sparkline/progress-check/pills), SLA area chart with dashed target, category bars, incident list with severity badges, system logs, live-alerts footer all match |
| Mobile responsive check (390×844, 390×1800) | **Found + fixed a regression during Agent-Probe:** content was overflowing horizontally (search bar, bell, stat cards clipped at the right edge). Root cause: `SidebarInset` in `app-shell.tsx` is a CSS Grid container with `grid-rows-[...]` but no explicit `grid-template-columns`, so Tailwind's default (`none`) let content blow out past the fixed-width container (classic grid-blowout). Fixed by adding `grid-cols-1` to `SidebarInset`, plus `min-w-0` on the page-content wrapper div and the header's search-row flex container. Re-verified at 390px and 1280px — no horizontal overflow, sidebar correctly becomes a mobile sheet. |
| All non-dashboard routes (`incidents`, `reports`, `map`, `settings`) render correctly in new shell | PASS — visually confirmed via dev-server screenshots |

AC1–AC7 all confirmed. Gate: **PASS** (post-fix).

---

## Test Infra Improvement Notes

- No automated test runner exists in this repo. If UI work continues, consider introducing Vitest + a visual/DOM smoke test (or Playwright screenshot diffs) and creating a `tests/` context group + `all-tests.md` (per `all-context.md` Scan Metadata guidance). Until then, dashboard visual fidelity is Agent-Probe only — record this as a known gap at EVL.

---

## Resume and Execution Handoff

1. **Selected plan file:** `process/general-plans/active/dashboard-ui-refactor_22-06-26/dashboard-ui-refactor_PLAN_22-06-26.md`
2. **Last completed step:** EXECUTE complete (22-06-26). All 7 checklist steps implemented; all 7 acceptance criteria verified (see Verification Evidence above).
3. **Validate-contract status:** VALIDATE explicitly skipped by user request ("skip validate") before EXECUTE. No validate-contract was written; the plan's own Verification Evidence section served as the EXECUTE gate instead.
4. **Supporting context loaded:** `process/context/all-context.md`; `apps/web/src/routes/dashboard.tsx`; `apps/web/src/lib/mock-data.ts`; `apps/web/src/components/app-shell.tsx`; `apps/web/src/components/stat-card.tsx`; `packages/ui/src/components/` inventory; `screens/Main UI.png` (described above).
5. **Next step:** Recommend `ENTER UPDATE PROCESS MODE` to archive this plan and capture the grid-blowout learning in context, or proceed directly to a commit checkpoint. No further EXECUTE work remains.

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
