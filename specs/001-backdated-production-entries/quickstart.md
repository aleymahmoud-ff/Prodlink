# Quickstart — Verifying Backdated Production Entries

This is the manual verification script. There is no automated test infrastructure in this repo today; each acceptance scenario in [spec.md](./spec.md) is mapped to a step here.

## Setup (once)

1. Pull the branch: `git checkout 001-backdated-production-entries`
2. Apply the migration locally: with `DATABASE_URL` set, `node scripts/db-setup.js`. Confirm:
   - `production_entries` has a new `production_date` column (`\d production_entries` in `psql`).
   - `idx_production_entries_production_date` index exists.
   - All historical rows have `production_date` set (no NULLs).
3. Optional: set `FACTORY_TIMEZONE=Africa/Cairo` in your `.env.local` (this is the default if unset).
4. `npm run dev` and sign in.

You will need two test accounts:
- An **operator** (any role other than `admin`).
- An **admin**.

---

## Scenarios

### Story 1 — Operator records yesterday's leftover production

Map: spec.md → Story 1 → all 5 acceptance scenarios.

1. **Default-Today (Story 1, scenario 5)**: sign in as operator, open the production page. Confirm the toggle shows two pills: "Today (`<today>`)" highlighted, "Yesterday (`<yesterday>`)" inactive. Reload the page; toggle still on Today.
2. **Switch to Yesterday (Story 1, scenario 1)**: click the Yesterday pill. Confirm:
   - The per-product totals table re-fetches and now shows yesterday's totals (including 0s if nothing was logged yesterday).
   - The "recent entries" list under it now shows only entries with `production_date = yesterday`.
   - There was no full page reload (the URL did not change).
3. **Submit on Yesterday (Story 1, scenario 2)**: pick a line + product, enter a quantity, submit. Confirm:
   - The new entry appears immediately in the Yesterday totals.
   - In the database, the row has `production_date = yesterday` and `created_at = now()`.
4. **Submit on Today (Story 1, scenario 3)**: switch back to Today, submit another entry. Confirm `production_date = today`.
5. **Toggle does not move just-saved entries (Story 1, scenario 4)**: while on Today, the Yesterday entry from step 3 must NOT appear in the Today totals.

### Story 2 — Admin records production for an arbitrary past date

Map: spec.md → Story 2 → all 4 acceptance scenarios + 2 edge-case checks.

6. **Visibility gate (Story 2, scenario 2)**: as the operator, look at the production page. There must be NO Exceptional Entry button, tab, or label. Try to navigate to it directly via DOM (right-click → inspect on the toggle area) — there is nothing to click into.
7. **Admin sees the view (Story 2, scenario 1)**: sign in as admin. The Exceptional Entry control is now visible. Open it. A date picker appears, defaulting to today. Pick a date 7 days in the past, fill in line/product/quantity/unit, submit.
8. **Past date is recorded (Story 2, scenario 3)**: switch back to the regular form, set the toggle to Today, then change the URL or use the entries list date filter to view that 7-days-ago date. The admin's entry is there with the correct date and the admin as creator.
9. **Future date is rejected (Story 2, scenario 4)**: open Exceptional Entry, attempt to pick tomorrow. The picker prevents it (and even if a user constructs a request manually, the server returns 400 with `invalid_production_date`).

### Server-side guard (FR-014)

10. **Non-admin attempting to backdate via curl** — covers SC-005 and the "Non-admin tampers with the API directly" edge case:
    ```sh
    curl -X POST http://localhost:3000/api/production \
      -H "Content-Type: application/json" \
      -H "Cookie: <operator-session-cookie>" \
      -d '{"line_id":"<l>","product_id":"<p>","quantity":1,"unit_of_measure":"kg","production_date":"2026-04-01","client_today":"2026-05-10"}'
    ```
    Expected: `403 { "error":"backdate_not_allowed_for_role" }`.

11. **Anti-spoof bound (research.md Decision 3)**: as a non-admin, send `client_today` set to a date 5 days from real-UTC-today plus a `production_date` 4 days in the past. Server must reject with `400`.

12. **Future-date rejection for admin (Story 2, scenario 4 server-side)**: as admin, post `production_date = client_today + 1 day`. Server must reject with `400 invalid_production_date`.

### Cross-app aggregation (FR-016)

13. **Dashboard "today's production" count (SC-002)**: insert a Yesterday entry via the toggle, then visit the home dashboard. The today's-production stat must NOT include that Yesterday entry. Insert a Today entry and confirm the stat increments.

14. **Dashboard recent activity**: the activity feed must list the production rows ordered by `production_date DESC, created_at DESC` (newest production date first; among rows on the same production date, newest insertion first).

### Day rollover (FR-007a)

15. To simulate midnight without waiting: open the page, then in browser devtools temporarily mock the system clock (e.g. `Date.now = () => Date.parse('2026-05-11T00:01:00')`) and trigger the form's tick interval (or wait the configured tick). Confirm:
    - Toggle labels update from "Today (May 10)" → "Today (May 11)" and "Yesterday (May 9)" → "Yesterday (May 10)" without a reload.
    - The totals re-fetch automatically.
    - A submission while still on the Yesterday pill is recorded with the NEW yesterday (May 10), matching what is shown on screen.

---

## Acceptance gates

Once all 15 steps pass, the feature is considered ready for review. Open a PR back into `main` referencing `specs/001-backdated-production-entries/` and tag at least one reviewer who can re-run steps 6, 7, and 10 from scratch in the preview deployment.
