# Implementation Plan: Backdated Production Entries

**Branch**: `001-backdated-production-entries` | **Date**: 2026-05-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-backdated-production-entries/spec.md`

## Summary

Introduce a separate **production date** concept on `production_entries`, distinct from the existing `created_at` audit timestamp. Operators flip a Today/Yesterday toggle on the production form to backfill late entries; admins use a dedicated Exceptional Entry view to record entries against any past date. Every place in the app that aggregated production by `created_at` switches to `production_date`. The user's browser time zone defines day boundaries; the toggle's resolved dates are shown next to the labels and refresh at midnight.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js ≥ 20 (per `package.json` engines), running on Next.js 14 App Router.
**Primary Dependencies**: Next.js 14.2.x, NextAuth v5 beta (JWT sessions), Drizzle ORM 0.45.x with `pg` driver, bcryptjs, lucide-react, Tailwind CSS 3.4. No date library currently in use; small browser-native helpers will be added rather than introducing `date-fns` or `luxon` for this feature.
**Storage**: PostgreSQL on Cranl (region `eg`). Existing migrations live in `neon/migrations/` (legacy folder name) and run via `scripts/db-setup.js` which iterates every `.sql` file in lexical order.
**Testing**: No automated test infrastructure in the repo today. Verification is manual via the quickstart checklist (see `quickstart.md`).
**Target Platform**: Single-tenant web app deployed to Cranl (Egypt region). Mobile browsers and desktop browsers are both first-class.
**Project Type**: Single Next.js App Router project (web). No separate backend.
**Performance Goals**: Production page already loads under 1 s on a warm connection; this feature must not regress that. Toggle changes must reflect within 250 ms of the click excluding network round-trip.
**Constraints**:
- Server-side role+date enforcement is mandatory (FR-014); the client cannot be trusted to gate dates.
- Browser time zone defines "today" / "yesterday" for the live form; the dashboard's aggregations remain server-computed using a single canonical factory time zone (see `research.md` for the resolved trade-off).
- Existing `created_at` audit timestamp is **not removed**; both columns coexist on every row.
**Scale/Scope**: Tens of users, low thousands of production entries per month. Index on `production_date` is enough; no partitioning needed.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The repo's `.specify/memory/constitution.md` is the spec-kit template — every principle is still a placeholder (`[PRINCIPLE_1_NAME]` etc.). No project-specific principles have been ratified. There are therefore no project-specific gates to enforce. The plan defaults to general spec-kit / engineering hygiene:

- **Simplicity**: Prefer the smallest correct change. Reuse existing role-check pattern (`session.user.role === 'admin'`) instead of building a new permissions framework.
- **Auditability**: Never weaken existing audit data. `created_at` and `created_by` keep their meaning; `production_date` is purely additive.
- **Reversibility**: Migration is idempotent and additive; rollback path is documented.

No constitution violations to track. **Gate: PASS.**

## Project Structure

### Documentation (this feature)

```text
specs/001-backdated-production-entries/
├── plan.md              # This file
├── spec.md              # Feature spec (already written)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (manual verification steps)
├── contracts/
│   └── api-production.md   # API contract changes
└── checklists/
    └── requirements.md  # Spec quality checklist (already passing)
```

### Source Code (repository root — concrete paths affected)

```text
neon/migrations/
└── 004_add_production_date.sql              # NEW — additive column + backfill + index

src/shared/lib/
├── db/schema.ts                             # MODIFY — add productionDate field
└── date/factory-day.ts                      # NEW — small helpers: clientTodayISO(), clientYesterdayISO(), formatDayLabel(), useMidnightTick()

src/shared/types/
└── database.ts                              # MODIFY — add production_date to ProductionEntry interface

src/app/api/production/
└── route.ts                                 # MODIFY — accept ?date= filter; accept production_date on POST; enforce role+date guard; sort by productionDate

src/app/api/dashboard/
└── route.ts                                 # MODIFY — switch production aggregation from createdAt to productionDate

src/app/(dashboard)/production/
├── page.tsx                                 # MODIFY — add Today/Yesterday toggle, midnight tick, Exceptional Entry view (admin-only); send production_date on submit; display production_date in entries list
└── exceptional-entry-form.tsx               # NEW — admin-only date-picker entry form (extracted component)

src/app/(dashboard)/
└── page.tsx                                 # MODIFY — display production_date for production rows in the activity feed (no logic change beyond field)
```

**Structure Decision**: Single Next.js App Router project. No new top-level directories. One small shared module (`src/shared/lib/date/`) is added to keep the day-boundary logic out of the page component and to prevent each consumer from re-implementing browser-day arithmetic.

## Phase 0 — Outline & Research

See [research.md](./research.md). Three focused decisions resolved:

1. **Postgres column type**: `DATE` (no time, no TZ) over `timestamp`.
2. **Browser TZ vs server TZ split**: live form uses browser TZ; cross-user dashboards use a single factory TZ (`Africa/Cairo`). Documented inconsistency, justified.
3. **Server-side date guard**: client sends both `production_date` and `client_today`; server validates them relatively and applies a UTC ±2 day sanity bound to prevent spoofing.

No NEEDS CLARIFICATION items remain.

## Phase 1 — Design & Contracts

See:
- [data-model.md](./data-model.md) — schema diff, drizzle changes, migration steps, type changes.
- [contracts/api-production.md](./contracts/api-production.md) — request/response changes for `GET /api/production`, `POST /api/production`, `GET /api/dashboard`.
- [quickstart.md](./quickstart.md) — manual verification script mapped to every acceptance scenario in `spec.md`.

After Phase 1 design, the Constitution Check is re-evaluated: still **PASS**, no new violations.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations.
