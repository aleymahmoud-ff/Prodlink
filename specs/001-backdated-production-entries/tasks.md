---

description: "Task list for backdated production entries"
---

# Tasks: Backdated Production Entries

**Input**: Design documents from `/specs/001-backdated-production-entries/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Status (2026-05-10)**: All code and DB tasks done (T001–T017, T019, T020, T022). Migration applied to the live DB (T003); 426 rows backfilled with 0 nulls. Two tasks remain deferred because they require a running dev server with both an operator and an admin account: **T018** (manual server-side guard check) and **T021** (full quickstart pass).

**Tests**: NO automated tests in this task list. The repo has no test infrastructure; the spec defers verification to the manual quickstart checklist (see `quickstart.md`). This matches the skill's "tests are OPTIONAL — only include if explicitly requested" rule.

**Organization**: Tasks are grouped by user story. Foundational tasks (DB, types, shared helpers, server-side contract) MUST complete before any user-story phase begins because both stories share the same migration, schema, and API route.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel — different files, no dependency on an incomplete task in the same phase.
- **[Story]**: `[US1]` or `[US2]` for tasks that belong to a specific user story.
- File paths are absolute-from-repo-root.

## Path Conventions

This is a single Next.js App Router project. All source under `src/`, migrations under `neon/migrations/`, specs under `specs/001-backdated-production-entries/`. No `tests/` directory in the repo.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Lightweight environment configuration. No new build tooling.

- [X] T001 Add `FACTORY_TIMEZONE` to the project's documented environment variables (e.g. a comment in `.env.example` if present, or noted at the top of `src/app/api/dashboard/route.ts`). Default value: `Africa/Cairo`. No code change yet — just documenting the contract that `T009` will consume.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database column, schema/type alignment, shared date helpers, and server-side contract changes. Both user stories depend on every task in this phase.

**⚠️ CRITICAL**: No `[US1]` or `[US2]` work can begin until this phase is complete.

- [X] T002 Create migration file `neon/migrations/004_add_production_date.sql` matching the SQL in `data-model.md`: idempotent `ADD COLUMN production_date DATE`, backfill from `(created_at AT TIME ZONE 'Africa/Cairo')::date`, then `SET NOT NULL` + `SET DEFAULT CURRENT_DATE`, then `CREATE INDEX IF NOT EXISTS idx_production_entries_production_date ON production_entries (production_date DESC)`.

- [X] T003 Applied via `node scripts/db-setup.js` (2026-05-10). Verified: column `production_date date NOT NULL DEFAULT CURRENT_DATE` exists; index `idx_production_entries_production_date` exists; **0 NULL rows out of 426 historical entries**; spot-checked backfill matches `(created_at AT TIME ZONE 'Africa/Cairo')::date`. Verify with `psql`: `\d production_entries` shows the new column, `SELECT count(*) FROM production_entries WHERE production_date IS NULL` returns 0, and `\di idx_production_entries_production_date` shows the index. (Depends on T002.)

- [X] T004 [P] Update Drizzle schema in `src/shared/lib/db/schema.ts`: add the `date` import from `drizzle-orm/pg-core` and add `productionDate: date('production_date', { mode: 'string' }).notNull().defaultNow()` to the `productionEntries` table definition. (Depends on T002 — column must exist before Drizzle expects it.)

- [X] T005 [P] Update the public TypeScript shape in `src/shared/types/database.ts`: add `production_date: string` to the `ProductionEntry` interface (after `created_at`).

- [X] T006 [P] Create `src/shared/lib/date/factory-day.ts` with these exported helpers, all browser-TZ aware (no external date library):
    - `clientTodayISO(): string` — returns `YYYY-MM-DD` for today in the user's browser TZ.
    - `clientYesterdayISO(): string` — returns `YYYY-MM-DD` for yesterday in the user's browser TZ.
    - `formatDayLabel(iso: string): string` — formats `'2026-05-09'` as `'May 9'`.
    - `useMidnightTick(callback: () => void): void` — React hook that schedules a `setTimeout` to fire shortly after the next browser-local midnight, then re-arms itself; cleans up on unmount. Used by the production page to refresh toggle labels and re-fetch when the day rolls over.

- [X] T007 Update `src/app/api/production/route.ts` `GET` handler:
    1. Parse a new `?date=YYYY-MM-DD` query param. If present, filter `eq(productionEntries.productionDate, date)`.
    2. Keep the existing `?line_id` filter as-is.
    3. Keep `?start_date` working (back-compat) but interpret as `gte(productionEntries.productionDate, floor(start_date))` so callers that have not migrated still get the right rows.
    4. Change ordering to `orderBy(desc(productionEntries.productionDate), desc(productionEntries.createdAt))`.
    5. Add `production_date: entry.productionDate` to the JSON projection alongside the existing fields.
    (Depends on T004.)

- [X] T008 Update `src/app/api/production/route.ts` `POST` handler to enforce the role+date guard exactly as `contracts/api-production.md` and `research.md` Decision 3 describe:
    1. Require body fields `production_date` and `client_today`, both `YYYY-MM-DD`. Reject `400 invalid_production_date` on format failure.
    2. Reject `400 invalid_production_date` if `|client_today − UTC_today_date| > 2 days` (anti-spoof).
    3. Reject `400 invalid_production_date` if `production_date > client_today`.
    4. If `session.user.role !== 'admin'` and `production_date < (client_today − 1 day)`, reject `403 backdate_not_allowed_for_role`.
    5. Insert with `productionDate: production_date` (and existing fields). Return the inserted row including `production_date`.
    (Depends on T004, T007.)

- [X] T009 [P] Update `src/app/api/dashboard/route.ts` so production aggregations use `production_date`:
    1. Compute `factoryToday` server-side as the calendar date in `process.env.FACTORY_TIMEZONE ?? 'Africa/Cairo'`.
    2. Replace `gte(productionEntries.createdAt, today)` (line ~20) with `eq(productionEntries.productionDate, factoryToday)` for the today's-production count.
    3. Add `productionDate: productionEntries.productionDate` to the recent-production select projection.
    4. Change the recent-production `orderBy` from `desc(productionEntries.createdAt)` alone to `desc(productionEntries.productionDate), desc(productionEntries.createdAt)`.
    5. Include `production_date` on each production row in the merged activity feed response.
    Damage and waste aggregations stay on `created_at` (out of scope per FR-016).
    (Depends on T004.)

**Checkpoint**: Foundation ready. Both user stories can now begin. The DB has the new column, the schema/types match, the date helper is available to UI work, and the API contract is in its final shape.

---

## Phase 3: User Story 1 — Today/Yesterday toggle (Priority: P1) 🎯 MVP

**Goal**: A non-admin operator can flip a Today/Yesterday toggle on the production page, see the table aggregate by the selected day, submit a new entry against that day, and see entries dated to yesterday no longer leak into today's totals.

**Independent Test**: Sign in as operator, switch to Yesterday, see yesterday's totals, submit an entry, confirm DB row has `production_date = yesterday` and `created_at = now()`. (See `quickstart.md` steps 1–5.)

### Implementation for User Story 1

- [X] T010 [US1] In `src/app/(dashboard)/production/page.tsx`, add `mode` state (`'today' | 'yesterday'`, default `'today'`) and a segmented toggle UI placed directly above the per-product totals table. Each pill shows the resolved date alongside the label, e.g. `Today (May 10)` / `Yesterday (May 9)`, computed via `formatDayLabel(clientTodayISO())` and `formatDayLabel(clientYesterdayISO())` from `src/shared/lib/date/factory-day.ts`. (Depends on T006.)

- [X] T011 [US1] In the same file, change the existing today-only fetch (around line 117 — `fetch('/api/production?start_date=...')`) to fetch `/api/production?date=${mode === 'today' ? clientTodayISO() : clientYesterdayISO()}` and re-run it whenever `mode` changes. The per-product totals memo and the "recent entries" list both consume this single result. Drop the separate `today` variable and the unused `start_date` path. (Depends on T007, T010.)

- [X] T012 [US1] In the same file, update the entry-submit handler to include `production_date` and `client_today` in the POST body. `production_date = mode === 'today' ? clientTodayISO() : clientYesterdayISO()`; `client_today = clientTodayISO()`. (Depends on T008, T010.)

- [X] T013 [US1] In the same file, wire the `useMidnightTick(() => { /* re-resolve labels + re-fetch */ })` hook so that when the local clock crosses midnight, the toggle's pill labels refresh and the data re-fetches without a reload. The implementation is just calling `setMode(mode)`'s effect dependency through a counter state if needed; aim for the simplest re-render that re-evaluates `clientTodayISO()` / `clientYesterdayISO()`. (Depends on T006, T011.)

- [X] T014 [US1] In the same file's recent-entries table (around line 649), add a `Production date` column showing `formatDayLabel(entry.production_date)` and keep the existing `formatDate(entry.created_at)` in a separate `Recorded at` column. This makes backdated entries visually distinct from same-day entries (covers FR-009). (Depends on T005, T011.)

- [X] T015 [US1] [P] In `src/app/(dashboard)/page.tsx` activity feed (around line 234), for production-type rows display `formatDayLabel(activity.production_date)` next to or instead of the existing `formatDate(activity.created_at)` so the dashboard reflects the same production-date semantics. Damage/waste rows keep the existing `created_at` display. Add `production_date?: string` to the local `RecentActivity` interface (line 22) so TypeScript stays happy. (Depends on T009.)

**Checkpoint**: US1 is independently functional. Run quickstart.md steps 1–5 + step 13 + step 14 + step 15. Story 1 alone delivers the operator-backfill MVP.

---

## Phase 4: User Story 2 — Exceptional Entry (admin-only) (Priority: P2)

**Goal**: An admin can open a separate Exceptional Entry view, pick any past date (or today), record an entry, and have it land at the chosen production date. Non-admins see no trace of the view.

**Independent Test**: Sign in as admin, open Exceptional Entry, pick date 7 days ago, submit; sign in as operator, confirm no Exceptional Entry control is visible. (See `quickstart.md` steps 6–9 + 12.)

### Implementation for User Story 2

- [X] T016 [US2] Create `src/app/(dashboard)/production/exceptional-entry-form.tsx`. A client-component `<ExceptionalEntryForm />` that renders a date picker (HTML `<input type="date">` with `max={clientTodayISO()}`), the same line / product / quantity / unit / batch / notes fields used by the regular submit, and a submit button. Posts to `/api/production` with `production_date = pickedDate`, `client_today = clientTodayISO()`. On success, surfaces a confirmation message and resets the form. (Depends on T006, T008.)

- [X] T017 [US2] In `src/app/(dashboard)/production/page.tsx`, gate the Exceptional Entry control on `profile?.role === 'admin'` (matching the existing client role-check pattern at `src/app/(dashboard)/approvals/page.tsx:214`). Render an "Exceptional Entry" button (or tab) in the page header that, when clicked, reveals or scrolls to `<ExceptionalEntryForm />`. Non-admin sessions render `null` for both the button and the form — no DOM at all, so right-click-inspect cannot reach it. (Depends on T016.)

- [ ] T018 [US2] [P] ⏸ **DEFERRED** — needs a running dev server, an operator session, and an admin session. Verify server-side gating works end-to-end by exercising `quickstart.md` step 10 against the running dev server: a non-admin POST with a `production_date` older than yesterday must return `403 backdate_not_allowed_for_role`; an admin POST with a future date must return `400 invalid_production_date`. No code change expected here — this is the manual contract test for FR-014 / FR-012. If either response is wrong, fix in T008 and re-run. (Depends on T008, T017.)

**Checkpoint**: US2 is independently functional alongside US1. Both stories shipped together cover the whole spec.

---

## Phase 5: Polish & Cross-Cutting

**Purpose**: Final clean-up, sanity sweep for anything that still aggregates production by `created_at` (to satisfy FR-016 fully), and full quickstart pass.

- [X] T019 [P] Search-and-confirm: run `grep -nR "productionEntries.createdAt" src/ scripts/` and verify every remaining hit is either purely audit/display (`select` projection or sort tiebreaker), not a date-filter aggregation. If any production-date aggregation still uses `createdAt`, fix it in the relevant file and note it here.

- [X] T020 [P] Build and typecheck: `npm run build`. Fix any TypeScript errors introduced by the schema/type changes (most likely the `start_date` query param removal in `src/app/(dashboard)/production/page.tsx` and any new `production_date` field destructures).

- [ ] T021 ⏸ **DEFERRED** — needs a running dev server with operator + admin accounts. Run the full `specs/001-backdated-production-entries/quickstart.md` script (steps 1 through 15) on a fresh dev server with both an operator and an admin account. Mark each step pass/fail in your PR description.

- [X] T022 [P] If anything in `quickstart.md` revealed a gap, file a short note at the bottom of `quickstart.md` under "Known follow-ups" and link from the PR description. Otherwise leave the file unchanged.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 — purely documentation, can start immediately.
- **Foundational (Phase 2)**: T002 → T003 (DB) and then T004/T005/T006 in parallel; T007 depends on T004; T008 depends on T004 + T007 (same file); T009 depends on T004 (parallel with T007/T008 since different file).
- **Phase 3 (US1)**: depends on Foundational complete.
- **Phase 4 (US2)**: depends on Foundational complete. Can run **in parallel with Phase 3** since they touch disjoint UI files (US1 = page.tsx + dashboard page, US2 = new exceptional-entry-form.tsx + admin gate in page.tsx). The only shared file is `src/app/(dashboard)/production/page.tsx` (T010–T014, T017), so coordinate that file.
- **Phase 5 (Polish)**: depends on Phases 3 and 4 complete.

### User Story Independence

- US1 (P1, MVP) is the smallest viable slice. Shipping only US1 + Foundational already covers the operator pain.
- US2 (P2) sits cleanly on top of the same foundational layer; nothing in US1 has to be re-touched to add US2.

### Within Each User Story

- No tests required (no test infra in repo); each `[US1]`/`[US2]` task is a directly-executable implementation step.
- Within a story, tasks that touch the same file (e.g., T010–T014 all in `production/page.tsx`) are sequential.
- Tasks marked `[P]` within a story touch different files and are safely parallelizable.

### Parallel Opportunities

- T004, T005, T006 all touch different files → parallelizable inside Foundational.
- T007/T008 (same file) sequential; T009 (different file) parallel with them.
- T015 (`src/app/(dashboard)/page.tsx`) is parallel with T010–T014 (`production/page.tsx`).
- T016 (`exceptional-entry-form.tsx` — new file) is parallel with all of T010–T014.
- T019, T020, T022 in Polish are all parallel.

---

## Parallel Example: Foundational Phase 2

```bash
# After T002 + T003 are done (migration applied), launch these together:
Task: "Update Drizzle schema in src/shared/lib/db/schema.ts"   # T004
Task: "Add production_date to ProductionEntry in src/shared/types/database.ts"  # T005
Task: "Create src/shared/lib/date/factory-day.ts helpers"      # T006

# Once T004 is complete, T007 and T009 can run in parallel:
Task: "Update GET handler in src/app/api/production/route.ts"  # T007
Task: "Update src/app/api/dashboard/route.ts to use production_date"  # T009
# T008 must wait for T007 (same file).
```

## Parallel Example: User Stories 1 + 2

```bash
# After Foundational checkpoint, two devs can work in parallel:
Developer A (US1):  T010 → T011 → T012 → T013 → T014   # all in production/page.tsx, sequential
Developer A (US1):  T015                              # parallel with the above; different file

Developer B (US2):  T016                              # new file, no conflict
Developer B (US2):  T017                              # production/page.tsx — coordinate handoff with Dev A
Developer B (US2):  T018                              # manual server-side check, no code
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 + Phase 2 (Foundational): all of T001–T009.
2. Phase 3 (US1): T010–T015.
3. STOP and validate `quickstart.md` steps 1–5, 13, 14, 15. Demo to operators.
4. If green: ship to staging. Operators can already backfill yesterday's production.

### Full Feature

1. Continue with Phase 4 (US2): T016–T018.
2. Run `quickstart.md` steps 6–12 in addition to 1–5/13–15.
3. Phase 5 polish: T019–T022.
4. Open PR back into `main`.

---

## Notes

- Every task names an exact file path (per skill spec).
- `[P]` tasks have been audited for file disjointness — no two `[P]` tasks in the same phase write the same file.
- Tasks were generated from: spec.md (2 user stories with priorities), plan.md (file map), data-model.md (schema delta + migration), contracts/api-production.md (endpoint contracts), research.md (server-guard rationale), quickstart.md (verification steps).
- Tests are intentionally absent (no test infra in repo); verification rides on `quickstart.md`.
- The constitution is a template with no project-specific principles, so no constitution-driven gates appear in the task list.
