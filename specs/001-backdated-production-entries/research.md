# Phase 0 — Research: Backdated Production Entries

Three concrete decisions had to be resolved before design could proceed. Each is captured below in the format the spec-kit plan template requires.

---

## Decision 1: Storage type for `production_date`

**Decision**: PostgreSQL `DATE` (no time component, no time zone), exposed via Drizzle's `date('production_date', { mode: 'string' })` so it round-trips as `YYYY-MM-DD`.

**Rationale**:
- The clarification session resolved that the user's browser computes the day boundary. The server stores a calendar date, never a UTC instant. A `DATE` column is exactly that.
- `DATE` cannot drift across DST or time-zone changes the way `TIMESTAMP WITH TIME ZONE` would.
- Aggregations become trivial: `WHERE production_date = '2026-05-09'`, no `AT TIME ZONE` casting required.
- Drizzle's `date` type with `mode: 'string'` returns the value as `'2026-05-09'`, matching what the client will send.

**Alternatives considered**:
- **`TIMESTAMP WITH TIME ZONE` set to local midnight**: would let us reuse the existing column's type, but reintroduces TZ math on every aggregation and is exactly the bug FR-016 is trying to fix.
- **Separate `year`, `month`, `day` columns**: pointless complication; index would not help; aggregations become awkward.
- **No new column; derive from `created_at` + a per-row TZ offset**: defeats backdating since `created_at` cannot be set in the past, and recomputing in queries adds cost.

---

## Decision 2: Browser TZ for the live form vs. canonical factory TZ for shared dashboards

**Decision**:
- The **live production form** uses the **user's browser time zone** to compute the resolved date for the Today/Yesterday toggle and for the production-date stamp on every submission. The client sends a `production_date` string (`YYYY-MM-DD`) along with each create request.
- The **dashboard aggregation** (`/api/dashboard` "today's production" count, recent activity feed) uses a **single canonical factory time zone**, `Africa/Cairo`, to compute "today" server-side, in a constant pulled from `process.env.FACTORY_TIMEZONE` with `'Africa/Cairo'` as default.
- Reports / lists where the user picks a date themselves (the production page's per-day view) use that exact picked date; no TZ math needed there because the date is already a `DATE` value.

**Rationale**:
- The clarification said "user's browser time zone" for the toggle. That naturally extends to per-user inputs.
- Cross-user dashboards are not a per-user view — they are a factory operations view. If two managers in different time zones both opened the dashboard, they would each see different "today" totals, which would be confusing in a meeting. Pinning the dashboard to factory TZ avoids that surprise without changing what individual operators experience.
- Egypt does not observe DST (last observed in 2014), so `Africa/Cairo` is a stable UTC+2 offset, no DST edge cases needed.

**Alternatives considered**:
- **Browser TZ everywhere, including dashboard**: would force the dashboard route to take a `?day=YYYY-MM-DD` query param computed by each client. Workable, but the dashboard is shared; per-user "today" causes silent disagreement. Rejected.
- **Factory TZ everywhere**: violates the clarification answer and creates the off-by-one-day risk for any operator whose device clock runs in a different TZ. Rejected.
- **Hardcode `Africa/Cairo` for dashboard with no env var**: works today but blocks future expansion. Adding the env var is a 1-line change with a sensible default.

---

## Decision 3: Server-side enforcement of the date+role policy (FR-014)

**Decision**: The `POST /api/production` request body carries two date fields:
- `production_date` — `YYYY-MM-DD`, the calendar date the entry is to be tagged with.
- `client_today` — `YYYY-MM-DD`, the calendar date the client believes today is in its time zone.

The server applies these checks, in order:
1. **Format**: both fields must match `^\d{4}-\d{2}-\d{2}$` and parse as valid dates. Reject 400 otherwise.
2. **Anti-spoof bound**: `client_today` must be within ±2 calendar days of the server's UTC `now()` date. Reject 400 if a client tries to claim "today" is two weeks ago.
3. **No future**: `production_date <= client_today`. Reject 400 if a future date is submitted.
4. **Role gate**:
   - If `session.user.role !== 'admin'`: `production_date >= (client_today - 1 day)`. (i.e., only today or yesterday.) Reject 403 otherwise.
   - If `session.user.role === 'admin'`: any past date or `client_today` is allowed. No lower bound.
5. On success, the row is inserted with `production_date = $production_date` and `created_at = now()` (default).

**Rationale**:
- Browser TZ is the source of truth for the day boundary, so the server alone cannot compute "yesterday" — it needs the client's notion of today.
- The ±2-day UTC sanity bound prevents a non-admin client from setting `client_today = '2026-04-10'` and `production_date = '2026-04-09'` to backdate a month while still appearing to follow the role rule. Two days is enough slack to cover any global TZ offset (max 14 hours).
- Returning 403 (not 400) for the role failure makes the policy explicit and matches the rest of the codebase's role-gating pattern.

**Alternatives considered**:
- **Server computes today using factory TZ; ignore client_today**: simpler server, but misaligns with browser-TZ user experience. Operators in a slightly off-clock device would have submissions silently rejected or accepted on the "wrong" calendar boundary. Rejected.
- **Trust the client; rely on UI gating**: violates FR-014 and the principle that all auth/role checks must be server-enforced. Rejected.
- **Sign the client_today value with a server-issued nonce**: overkill for a window of ±1 day. The ±2 day UTC bound already eliminates any meaningful spoofing attack — at worst a non-admin can backdate by ~2 days instead of 1 day, far short of the admins-only "any past date" privilege. Acceptable risk.

---

## Migration & backfill strategy

**Decision**: A new SQL migration file `neon/migrations/004_add_production_date.sql`, idempotent, with three steps:

1. `ALTER TABLE production_entries ADD COLUMN IF NOT EXISTS production_date DATE` (nullable initially).
2. `UPDATE production_entries SET production_date = ((created_at AT TIME ZONE 'Africa/Cairo')::date) WHERE production_date IS NULL` — backfill historical rows using the factory TZ (the only sensible default for rows that predate the feature).
3. `ALTER TABLE production_entries ALTER COLUMN production_date SET NOT NULL` and `ALTER COLUMN production_date SET DEFAULT CURRENT_DATE`.
4. `CREATE INDEX IF NOT EXISTS idx_production_entries_production_date ON production_entries (production_date DESC)` — supports the per-day aggregation queries that will replace `created_at`-keyed scans.

**Rationale**: Additive, reversible (a future migration could `DROP COLUMN production_date`), and matches the existing migration style (`DO ... EXCEPTION WHEN duplicate_column` blocks, `IF NOT EXISTS`, etc.) used in `001_neon_schema.sql` and `002_add_username.sql`. Already wired into `scripts/db-setup.js`, which loops every `.sql` in `neon/migrations/` in lexical order.

**Note on factory-TZ backfill vs. browser-TZ feature**: For rows that were created BEFORE this feature shipped, we only have a server timestamp. We pick `Africa/Cairo` for the backfill since that is where the factory operates, and FR-015 says historical entries' production date is the calendar day of their `created_at`. Any user looking at historical data sees a stable assignment that matches "the day work happened."

---

## No NEEDS CLARIFICATION remaining

All three Technical Context items that initially had open questions are resolved above. Phase 1 design proceeds.
