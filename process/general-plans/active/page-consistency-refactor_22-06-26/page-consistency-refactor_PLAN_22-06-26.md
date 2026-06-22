---
name: plan:page-consistency-refactor
description: "Bring incidents/reports/map/settings/command-center routes in line with the dashboard design system — shadcn-first, reusable PageHeader + CardMenu, emergency Button variant, mock-data only, mobile responsive"
date: 22-06-26
feature: none
---

# Page Consistency Refactor — PLAN

**Date**: 22-06-26
**Status**: Active — PLAN written, VALIDATE pending
**Complexity**: SIMPLE (one-session, single plan artifact, no schema/auth/API/billing surface)

> TL;DR: Apply the design system established by the just-completed `dashboard-ui-refactor` to the other 5 `apps/web` routes (`incidents`, `reports`, `map`, `settings`, `command-center.$incidentId`). Three reusability wins drive the work: (1) extract two shared components — `PageHeader` and `CardMenu` (the latter pulled out of `dashboard.tsx` so it can be reused); (2) add one shared `emergency` Button variant to `packages/ui` so the two hand-rolled `bg-lihok-dark` dispatch buttons stop duplicating markup; (3) finish removing Tremor by swapping reports' `AreaChart` for the already-built `SlaTrendChart`. Plus UX upgrades: a real settings page (3 SectionCards + shadcn `switch`), an incidents filter + empty-state, and a mobile-overflow defensive pass on the two absolute/grid-heavy pages. **Pure presentation: no backend/API wiring — mock-data only** (same constraint as the prior plan). Verification is manual (`pnpm typecheck`/`pnpm lint` + dev-server visual + 390px mobile check). VALIDATE runs next.

**Phase skip note:** SPEC and INNOVATE were skipped per CLAUDE.md skip condition — *"Scope is purely mechanical, no design choices."* The design system is now established precedent from the just-completed dashboard refactor (shadcn-first primitives, `SectionCard`, `StatCard` variants, `SlaTrendChart`, the `CardMenu` dropdown pattern, the `app-shell.tsx` shell). This plan is mechanical consistency work that applies that established language to the remaining pages — not new design exploration. The handful of real design calls (new `PageHeader`/`CardMenu` shared components, the `emergency` Button variant, the settings page section breakdown) were made by the orchestrator from direct codebase research and are recorded below as **locked directives**, not open options. There is no Decision Summary because INNOVATE did not run.

---

## Overview

This plan extends the LihokBarangAI staff-dashboard design system (built in `dashboard-ui-refactor_22-06-26`, EXECUTE-complete) to the remaining `apps/web` routes. It is a **pure presentation-layer change**: no Supabase/API wiring, no schema, no auth — `apps/web/src/lib/mock-data.ts` stays the only data source (reuse existing fields; add page-specific fields only if genuinely needed). The work is shadcn-first and centered on **reusability/modularity** (the explicit user ask): extract `PageHeader` and `CardMenu` shared components, add a single shared `emergency` Button variant instead of two inline copies, and reuse `SlaTrendChart`/`StatCard` variant patterns/`SectionCard`+`CardMenu` across pages rather than duplicating markup. It also lands targeted **UX improvements**: incidents filter + empty state, a real settings page, and a mobile-overflow defensive pass on the absolute-positioned `map.tsx` overlays and the `command-center` grid.

Risk is LOW (presentation only). The one cross-package change is the additive `emergency` Button variant in `packages/ui` (shared, but additive — no existing variant changes). The one refactor-of-existing-code is extracting `CardMenu` out of `dashboard.tsx`; because `dashboard.tsx` then imports it from the new location, the plan requires verifying the dashboard renders identically after that extraction. Context loaded: `process/context/all-context.md` (root router), the prior dashboard plan, and all 5 target routes + `dashboard.tsx` + `section-card.tsx` + `button.tsx` source.

`index.tsx` is excluded — it is only a redirect to `/dashboard`, no work needed.

## Goals

1. All 5 routes use the established design system consistently (shadcn primitives, `SectionCard`, `StatCard` variants, `PageHeader`, shared `CardMenu`).
2. **Reusability:** `PageHeader` and `CardMenu` exist as shared, reusable components; the two hand-rolled `bg-lihok-dark` dispatch buttons are replaced by one shared `emergency` Button variant.
3. **Tremor fully removed from `apps/web`:** `reports.tsx` uses `SlaTrendChart`, not `@tremor/react`.
4. **UX:** incidents gets an urgency/status filter + empty state; settings becomes a real 3-section page; map + command-center are mobile-overflow-safe.
5. `dashboard.tsx` renders identically after `CardMenu` is extracted (pure refactor, no visual change).
6. Fully mobile responsive (desktop + 390px) across all touched pages.
7. Zero new backend calls; mock-data is the only data source.

## Scope

**In scope:** `apps/web` routes `incidents.tsx`, `reports.tsx`, `map.tsx`, `settings.tsx`, `command-center.$incidentId.tsx`; two new shared components in `apps/web/src/components/` (`page-header.tsx`, `card-menu.tsx`); a refactor-extraction touch to `dashboard.tsx` (import `CardMenu` from the new file); the additive `emergency` variant in `packages/ui/src/components/button.tsx`; one shadcn `switch` install into `packages/ui`; mock-data field additions **only if** a page needs page-specific values (reuse existing fields first).

**Out of scope:** Supabase/API wiring, RLS, edge functions, any data-fetch logic. `index.tsx` (redirect only). `command-center.$incidentId.tsx`'s header (distinct incident-detail header with badges/linked-reports count — NOT a simple page title, do not retrofit `PageHeader`). `dashboard.tsx`'s lack of a page header (out of scope — do not add one; note as backlog idea only). `TimeRangeToggle`, `HeatZoneCell`, `IncidentRow` (`variant="card"`), the command-center right-rail (`AiUrgencyPanel`/`BroadcastForm`/SystemLog) — all already reusable, not changed. `section-card.tsx` structure (reused as-is; only its callers change).

---

## Per-Page Findings & Locked Directives

> These are the locked design calls made by the orchestrator from direct source research. EXECUTE implements them as written — they are not open options.

### 1. `apps/web/src/routes/incidents.tsx` (currently 27 lines, bare)
Today: `<h1>` + a grid of `IncidentRow variant="card"`. No page-header pattern, no filtering, no empty state.
**Directives:**
- Adopt the new `PageHeader` (directive 6) for the title.
- Add a status/urgency **filter** using the already-installed `@workspace/ui/components/toggle-group` (reuse — do NOT add a new dependency). Filter the `recentIncidents` list by selected urgency (e.g. All / Critical / High / Medium / Low, derived from the urgency values present in mock-data).
- Add an **empty-state** message when the filtered list is empty.

### 2. `apps/web/src/routes/reports.tsx` (105 lines)
Today: imports `AreaChart` from `@tremor/react` directly (line 2); its `StatCard` row passes every card the legacy `progress` prop (no variant differentiation); its `SectionCard`s have no `CardMenu` action.
**Directives:**
- Replace the Tremor `<AreaChart>` with the already-built `apps/web/src/components/sla-trend-chart.tsx` (`<SlaTrendChart data={responseTrend} />`). Remove the `@tremor/react` import — this finishes removing Tremor from `apps/web`.
- Apply the same **per-index `statVariants` array pattern** that `dashboard.tsx` uses (`statVariants = ["trend","sparkline","progressCheck","pills"]` at `dashboard.tsx:32`) so the stat row matches dashboard's visual language. Reuse the existing `totalIncidentsSparkline` / `dispatchEfficiency` / `activePatrols` mock-data fields 1:1 (already added for dashboard — no new mock-data fields needed unless reports needs page-specific values).
- Reuse the new shared `CardMenu` (directive 6) as the `action` on the SLA chart / Incident Categories / Purok Heat Map `SectionCard`s (the explicit "don't duplicate the dropdown markup" ask).
- Replace the current inline header markup with `PageHeader`, passing `TimeRangeToggle` as the `action` prop.
- Keep `TimeRangeToggle` and `HeatZoneCell` as-is.

### 3. `apps/web/src/routes/map.tsx` (76 lines)
Today: full-bleed dark map with absolutely-positioned floating panels. The Personnel panel is a raw `<aside>` with `bg-card/90 backdrop-blur`; the Emergency Dispatch button hand-rolls `bg-lihok-dark ... text-white` (line 30); zoom/layers control stack + Personnel panel are absolutely positioned.
**Directives:**
- (a) Wrap the Personnel & Units panel content in the shared `Card` primitive (or `SectionCard` if its `title`/`action` header shape fits the "Personnel & Units" + "3 Online" badge) instead of a raw styled `<aside>` div.
- (b) Replace the Emergency Dispatch button's inline `bg-lihok-dark` coloring with the new shared `emergency` Button variant (directive 3-shared / step 2).
- (c) Mobile-overflow defensive check: the bottom-left zoom/layers stack and the Personnel panel must not visually collide with the `AppShell` footer "Live Alerts" bar on mobile. Apply the same `min-w-0` / explicit-grid-track defensive pattern learned from the dashboard refactor's grid-blowout fix (recorded in the prior plan's Verification Evidence) to this page's absolute-positioned overlays at 390px.

### 4. `apps/web/src/routes/settings.tsx` (12 lines — literally a placeholder `<p>`)
Biggest UX opportunity. **Locked scope — no backend, static/read-only UI only:**
- Adopt `PageHeader` for the page title.
- Build 3 stacked `SectionCard` sections:
  - **Profile** — reuse `Avatar`/`AvatarFallback` (already installed); show the same "Juan Dela Cruz / Brgy. Captain" mock identity used in `app-shell.tsx`.
  - **Notification Preferences** — a static list of toggleable rows. Requires installing the shadcn `switch` primitive (`pnpm dlx shadcn@latest add switch` — not yet in `packages/ui/src/components/`). Switches may be uncontrolled / non-functional — presentation only, per the no-integrations constraint.
  - **System** — read-only key/value rows (e.g. channel mode, SMS gateway status). Reuse existing mock-data shape (`logs` / system status fields) — do NOT invent a new backend-shaped data source.

### 5. `apps/web/src/routes/command-center.$incidentId.tsx` (110 lines)
Today: "Dispatch Response Team" button hand-rolls `bg-lihok-dark px-5 ... text-white` (line 62); two-column `xl:grid-cols-[1fr_340px]` layout.
**Directives:**
- Replace the "Dispatch Response Team" button styling with the new shared `emergency` Button variant (step 2).
- Mobile-overflow defensive check against the same CSS-grid-blowout class fixed in `app-shell.tsx` during the dashboard refactor: verify the `xl:grid-cols-[1fr_340px]` grid and the inner `flex flex-wrap items-center gap-3` incident-header row don't have the `min-width:auto` overflow trap at mobile widths (apply `min-w-0` / explicit track where needed).
- Keep the right-rail `aside` (`AiUrgencyPanel`/`BroadcastForm`/SystemLog `SectionCard`) working as-is — only the button and grid-defensiveness change. Do NOT retrofit `PageHeader` (distinct incident-detail header — out of scope).

### 6. New shared components (modularity ask)
- **`apps/web/src/components/page-header.tsx`** — props `title: string`, `description?: string`, `action?: React.ReactNode` (mirrors `SectionCard`'s `title`/`description`/`action` shape for consistency). Used on `incidents.tsx`, `reports.tsx` (with `TimeRangeToggle` as `action`), `settings.tsx`.
- **`apps/web/src/components/card-menu.tsx`** — extract the `CardMenu` dropdown helper currently local to `dashboard.tsx` (lines 34-46). `dashboard.tsx` imports it from the new location (pure refactor, no visual change). `reports.tsx` reuses it. This is a refactor of existing code, not new scope.

### Shared (steps 2): `emergency` Button variant
`packages/ui/src/components/button.tsx` cva today has variants default/outline/secondary/ghost/destructive/link. The `bg-lihok-dark ... text-white` look is needed in 2+ places (map dispatch + command-center dispatch). Add a new `emergency` (or similarly named) variant entry to the cva `variants.variant` map following the existing pattern, and use it in both call sites instead of inline color overrides.

---

## Touchpoints

### A. `packages/ui` — shadcn install (additive, generated) + variant edit

| File / action | Command / change | Why needed |
|---|---|---|
| `packages/ui/src/components/switch.tsx` (ADD) | `pnpm dlx shadcn@latest add switch` | Notification-preference toggle rows on settings page |
| `packages/ui/src/components/button.tsx` (MODIFY) | Add `emergency` entry to `buttonVariants` cva `variant` map (e.g. `emergency: "bg-lihok-dark text-white shadow-xl hover:bg-lihok-dark/90"`), following the existing default/outline/etc. pattern. Additive — no existing variant changes. | Shared dispatch-button look (map + command-center) |

> EXECUTE note: confirm `switch.tsx` lands in `packages/ui/src/components/` per `packages/ui/components.json` aliases. The exact `emergency` class string is locked to the existing `bg-lihok-dark`/`text-white`/`shadow-xl`/`hover:bg-lihok-dark/90` look already in `map.tsx:30` and `command-center:62` — preserve that visual, just relocate it into the cva.

### B. `apps/web` — files to ADD / MODIFY

| File | Action | Change |
|---|---|---|
| `apps/web/src/components/page-header.tsx` | **ADD** | New shared `PageHeader` (`title`/`description?`/`action?`). |
| `apps/web/src/components/card-menu.tsx` | **ADD** | Extract `CardMenu` from `dashboard.tsx` into a reusable component. |
| `apps/web/src/routes/dashboard.tsx` | MODIFY (refactor) | Remove the local `CardMenu` function; import it from `@/components/card-menu`. No visual change. |
| `apps/web/src/routes/reports.tsx` | MODIFY | Swap Tremor `AreaChart` → `SlaTrendChart`; apply `statVariants` array pattern; add `CardMenu` actions to its 3 `SectionCard`s; adopt `PageHeader` with `TimeRangeToggle` as `action`. Remove `@tremor/react` import. |
| `apps/web/src/routes/incidents.tsx` | MODIFY | Adopt `PageHeader`; add `toggle-group` urgency/status filter + empty state. |
| `apps/web/src/routes/settings.tsx` | MODIFY (rebuild) | Build 3 `SectionCard` sections (Profile/Notifications/System) + `PageHeader`; use `Avatar` + new `switch`. |
| `apps/web/src/routes/map.tsx` | MODIFY | `Card`-wrap Personnel panel; `emergency` Button variant for dispatch; mobile-overflow defensive pass on absolute overlays. |
| `apps/web/src/routes/command-center.$incidentId.tsx` | MODIFY | `emergency` Button variant for dispatch; grid/flex mobile-overflow defensive check. |
| `apps/web/src/lib/mock-data.ts` | MODIFY (only if needed) | Add page-specific fields ONLY if reports/settings need values not already present. Reuse `totalIncidentsSparkline`/`dispatchEfficiency`/`activePatrols`/`logs` first. Do NOT remove existing exports. |

---

## Public Contracts

- **No package-external contracts change.** This is `apps/web` + `packages/ui` internal presentation only.
- `packages/ui` gains a new exported `switch` component (`@workspace/ui/components/switch`) — additive.
- `packages/ui` `buttonVariants` gains an `emergency` variant value — additive; existing variant strings unchanged, so all existing `<Button>` call sites are unaffected.
- `apps/web` gains two new internal exported components (`PageHeader`, `CardMenu`) — additive.
- `mock-data.ts` changes (if any) are additive; existing exports keep their shape.
- `dashboard.tsx`'s `CardMenu` moves from a local function to an imported component — internal-only refactor, no rendered-output change (verified at step 1 gate).

## Blast Radius

- **Packages:** 2 (`apps/web`, `packages/ui`).
- **Files:** ~7 modified + 2 added in `apps/web`; 1 modified (`button.tsx`) + 1 generated (`switch.tsx`) in `packages/ui`; `mock-data.ts` touched only if needed.
- **Risk class:** LOW — presentation-only, no schema/auth/API/billing/migration/secrets/deploy surface.
- **Highest-risk items (Agent-Probe edge cases applied):**
  1. **`CardMenu` extraction → `dashboard.tsx` regression.** Edge case: import path typo or subtly different markup makes the dashboard menu render/behave differently. Mitigation: step-1 gate explicitly re-verifies dashboard renders identically (visual + the menu opens/items present) before any other page is touched.
  2. **`emergency` Button variant.** Edge case: the cva string drifts from the original inline look, or a `className` override on a call site now fights the variant. Mitigation: lock the variant string to the exact existing classes; at the call sites remove the now-redundant inline color classes so they don't conflict.
  3. **Mobile-overflow on `map.tsx` absolute overlays + `command-center` grid.** Edge case: at 390px the Personnel panel / zoom stack collides with the Live Alerts footer, or the command-center grid blows out horizontally (the exact class of bug fixed in the dashboard refactor). Mitigation: dedicated 390px Agent-Probe check on both pages with the `min-w-0`/explicit-grid-track pattern.

---

## Implementation Checklist

> Ordered for execution. Shared/foundation components first so later page steps can consume them. Each section ends with a per-section gate (typecheck the touched package + visual check) before moving on.

**1. Extract shared components `page-header.tsx` + `card-menu.tsx`; retrofit `dashboard.tsx`.**
   1.1 Add `apps/web/src/components/card-menu.tsx` exporting `CardMenu` (move the function body verbatim from `dashboard.tsx:34-46`, including its `DropdownMenu` imports).
   1.2 Edit `dashboard.tsx`: remove the local `CardMenu` function + its now-unused `DropdownMenu*`/`MoreVertical` imports; `import { CardMenu } from "@/components/card-menu"`.
   1.3 Add `apps/web/src/components/page-header.tsx` (`title`/`description?`/`action?`), mirroring `SectionCard`'s header markup style for visual consistency.
   1.4 **Gate (regression-critical):** `pnpm typecheck`; dev server — confirm `dashboard.tsx` renders **identically** (stat cards, SLA chart with `CardMenu`, incident list + system logs `CardMenu`s all open and show Export/Refresh). Do not proceed until dashboard is byte-for-byte visually unchanged.

**2. Add `emergency` Button variant to `packages/ui/src/components/button.tsx`.**
   2.1 Add `emergency: "bg-lihok-dark text-white shadow-xl hover:bg-lihok-dark/90"` (preserving the existing dispatch look) to the cva `variants.variant` map.
   2.2 Gate: `pnpm typecheck -F @workspace/ui` green; existing buttons unaffected.

**3. Install shadcn `switch` into `packages/ui`.**
   3.1 `pnpm dlx shadcn@latest add switch` (confirm it lands in `packages/ui/src/components/switch.tsx`).
   3.2 Gate: `pnpm typecheck -F @workspace/ui` green; `switch.tsx` present.

**4. `reports.tsx` — Tremor swap + stat variants + CardMenu + PageHeader.**
   4.1 Replace the `<AreaChart>` block with `<SlaTrendChart data={responseTrend} className="mt-2" />`; remove `import { AreaChart } from "@tremor/react"`.
   4.2 Apply the `statVariants` per-index array pattern (mirror `dashboard.tsx:32` + its `StatCard` prop wiring), reusing `totalIncidentsSparkline`/`dispatchEfficiency`/`activePatrols`.
   4.3 Add `<CardMenu />` as the `action` on the SLA / Incident Categories / Purok Heat Map `SectionCard`s.
   4.4 Replace the inline page header with `<PageHeader title="Analytics Performance" description="..." action={<TimeRangeToggle .../>} />`.
   4.5 Gate: `pnpm typecheck`; visual — chart renders via `SlaTrendChart`, stat row matches dashboard's variants, `CardMenu`s present, header uses `PageHeader`. `grep -n "@tremor/react" apps/web/src/routes/reports.tsx` empty.

**5. `incidents.tsx` — PageHeader + filter + empty state.**
   5.1 Adopt `<PageHeader title="Incidents" />`.
   5.2 Add a `toggle-group` urgency/status filter (values derived from urgency levels present in `recentIncidents`); filter the grid by selection.
   5.3 Add an empty-state message rendered when the filtered list is empty.
   5.4 Gate: `pnpm typecheck`; visual — filter toggles the grid; selecting a filter with no matches shows the empty state.

**6. `settings.tsx` — build the real 3-section page.**
   6.1 Adopt `<PageHeader title="Settings" description="..." />`.
   6.2 Profile `SectionCard` — `Avatar`/`AvatarFallback` + "Juan Dela Cruz / Brgy. Captain" (match `app-shell.tsx`).
   6.3 Notification Preferences `SectionCard` — static toggle rows using shadcn `switch` (uncontrolled/non-functional OK).
   6.4 System `SectionCard` — read-only key/value rows from existing mock-data (channel mode, SMS gateway status, etc.).
   6.5 Gate: `pnpm typecheck`; visual — 3 sections render; switches toggle visually; no backend call added.

**7. `map.tsx` — Card-wrap Personnel panel + emergency button + mobile defensive pass.**
   7.1 Wrap Personnel & Units content in `Card` (or `SectionCard`) instead of the raw `<aside>` styling.
   7.2 Change Emergency Dispatch `<Button>` to `variant="emergency"`; remove the now-redundant inline `bg-lihok-dark/text-white` classes.
   7.3 Apply `min-w-0` / explicit-grid-track defensive pattern to the absolute overlays; verify at 390px the Personnel panel + zoom/layers stack don't collide with the Live Alerts footer.
   7.4 Gate: `pnpm typecheck`; visual desktop + 390px — no overflow/collision, dispatch button uses emergency variant.

**8. `command-center.$incidentId.tsx` — emergency button + grid mobile defensive check.**
   8.1 Change "Dispatch Response Team" `<Button>` to `variant="emergency"`; remove redundant inline classes.
   8.2 Check `xl:grid-cols-[1fr_340px]` grid + inner `flex flex-wrap items-center gap-3` row for the `min-width:auto` blowout trap at mobile widths; apply `min-w-0`/explicit track where needed. Leave the right-rail `aside` working as-is.
   8.3 Gate: `pnpm typecheck`; visual desktop + 390px — no horizontal overflow, dispatch button uses emergency variant, right rail intact.

**9. Verification (final).**
   9.1 `pnpm typecheck` (repo-wide) green.
   9.2 `pnpm lint` green.
   9.3 Dev-server visual check of all 5 pages at desktop + 390px mobile width.
   9.4 `grep -rn "@tremor/react" apps/web/src` returns nothing (Tremor fully gone from `apps/web`).
   9.5 Confirm `dashboard.tsx` still renders identically after the `CardMenu` extraction (re-confirm step-1 result holds end-to-end).

---

## Phase Completion Rules

This is a SIMPLE single-session plan, not a phase program — one delivery, gated section-by-section.

- A checklist **section** is `DONE` only when its per-section gate passes: the touched package typechecks AND the visual check for that section is confirmed.
- The plan is **CODE DONE** when all 9 sections are complete and `pnpm typecheck` + `pnpm lint` pass repo-wide.
- The plan is only `✅ VERIFIED` after a human/agent confirms (Agent-Probe) the 5 pages match the design system at desktop + mobile AND that `dashboard.tsx` did not regress from the `CardMenu` extraction — code-only completion is `CODE DONE`, never `VERIFIED`, because this repo has no automated visual-regression test.
- Do not mark any section complete on typecheck alone if its visual gate is unmet.

---

## Acceptance Criteria (testable)

| # | Criterion | How observed |
|---|---|---|
| AC1 | `PageHeader` + `CardMenu` exist as shared components and are reused (PageHeader on incidents/reports/settings; CardMenu on dashboard + reports) | Code review + `ls apps/web/src/components/` |
| AC2 | `dashboard.tsx` renders identically after `CardMenu` extraction (no visual change) | Dev-server visual diff vs pre-change dashboard |
| AC3 | `emergency` Button variant exists in `packages/ui/src/components/button.tsx` and is used on both map + command-center dispatch buttons (no inline `bg-lihok-dark` color override remains on them) | Code review + grep |
| AC4 | `@tremor/react` no longer imported anywhere in `apps/web/src` | `grep -rn "@tremor/react" apps/web/src` returns nothing |
| AC5 | reports' stat row uses the per-index variant pattern; reports' SectionCards have CardMenu actions | Code review + dev-server |
| AC6 | incidents has a working urgency/status filter (toggle-group) + empty state | Dev-server interaction |
| AC7 | settings is a real 3-section page (Profile/Notifications/System) using Avatar + shadcn `switch`; no backend call | Dev-server + code review |
| AC8 | map Personnel panel uses Card/SectionCard primitive; no mobile overflow/collision at 390px on map + command-center | Dev-server responsive check |
| AC9 | No backend/API calls added; mock-data only | Code review — no fetch/supabase import added |
| AC10 | `pnpm typecheck` and `pnpm lint` pass repo-wide | Command exit 0 |

---

## Verification Evidence

> This repo has **no automated test runner** (confirmed: `process/context/all-context.md` Scan Metadata — no `*.test.*`/`*.spec.*` files, `tests/` context group intentionally not created). The `all-tests.md` routing chain has no deeper docs because none exist. Coverage is therefore Hybrid (typecheck/lint) + Fully-Automated (grep/ls) + Agent-Probe (visual). This is a documented infra reality, NOT a `TIER_ASSIGNMENTS_BLOCKED` skip. There are no SPEC acceptance criteria (SPEC skipped); the "Proves SPEC criterion" column maps to this plan's Acceptance Criteria.

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `pnpm typecheck` (repo-wide) exits 0 | Hybrid (deterministic, needs deps installed) | AC10 |
| `pnpm lint` exits 0 | Hybrid | AC10 |
| `grep -rn "@tremor/react" apps/web/src` returns nothing | Fully-Automated | AC4 |
| `ls apps/web/src/components/` shows `page-header.tsx` + `card-menu.tsx` | Fully-Automated | AC1 |
| grep `emergency` in `button.tsx` + the two dispatch call sites; no inline `bg-lihok-dark` left on them | Fully-Automated | AC3 |
| Code review: no fetch/supabase import added to any touched route | Agent-Probe | AC9 |
| Dev-server: dashboard renders identically after CardMenu extraction | Agent-Probe (visual judgment) | AC2 |
| Dev-server: reports stat variants + CardMenu actions + SlaTrendChart render | Agent-Probe | AC5 |
| Dev-server: incidents filter toggles grid; empty state shows on no-match | Agent-Probe | AC6 |
| Dev-server: settings 3 sections render; switches toggle visually | Agent-Probe | AC7 |
| Dev-server responsive check at 390px on map + command-center — no overflow/collision | Agent-Probe | AC8 |

**Known-gap → CONDITIONAL note:** AC2, AC5–AC8 are proven only by Agent-Probe (no automated visual-regression harness in this repo). Per the vacuous-green ban, these visual/interaction behaviors stay CONDITIONAL until a human/agent confirms them in the dev server. The Test Infra Notes below record the missing automated UI-regression coverage as a backlog stub (residual recorded, not silently dropped).

---

## Test Infra Improvement Notes

- No automated test runner exists in this repo (same as the prior dashboard plan). The accumulating UI surface (now 6 routes refactored to the design system) strengthens the case for introducing Vitest + DOM smoke tests or Playwright screenshot diffs, plus a `tests/` context group + `all-tests.md` (per `all-context.md` Scan Metadata guidance). Backlog stub recommendation: `ui-visual-regression-harness_NOTE_22-06-26.md` capturing the gap — until it exists, page visual fidelity and the dashboard-no-regression check are Agent-Probe only. Record/confirm this at EVL.

---

## Resume and Execution Handoff

1. **Selected plan file:** `process/general-plans/active/page-consistency-refactor_22-06-26/page-consistency-refactor_PLAN_22-06-26.md`
2. **Last completed step:** PLAN written (22-06-26). No EXECUTE work started.
3. **Validate-contract status:** Pending — VALIDATE should run next (this is the user's call at the next gate). The plan's Verification Evidence section is the fallback EXECUTE gate if the user explicitly skips VALIDATE (as happened on the prior dashboard plan).
4. **Supporting context loaded:** `process/context/all-context.md`; the prior plan `dashboard-ui-refactor_22-06-26/...PLAN...md`; all 5 target routes (`incidents`/`reports`/`map`/`settings`/`command-center.$incidentId`); `dashboard.tsx`; `section-card.tsx`; `packages/ui/src/components/button.tsx`.
5. **Next step:** Recommend `ENTER VALIDATE MODE` to convert this plan into an executable validate-contract before EXECUTE. After VALIDATE: `ENTER EXECUTE MODE` with this plan path; `vc-ui-ux-designer` is the relevant specialist for the EXECUTE phase. Begin EXECUTE at checklist step 1 (shared-component extraction is the foundation everything else depends on).

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
