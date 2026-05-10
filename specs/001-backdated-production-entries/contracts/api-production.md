# API Contracts — Backdated Production Entries

This feature changes three endpoints. All other endpoints are unaffected.

---

## `GET /api/production` — list production entries

### Query params

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `line_id` | UUID | no | unchanged — filter to a single line |
| `date` | `YYYY-MM-DD` | no | **NEW** — filter to entries whose `production_date` equals this calendar date |
| `start_date` | ISO timestamp | no | **DEPRECATED** but still accepted for backward-compat with any unconverted caller. When supplied, it is interpreted as the production date floor (`production_date >= floor(start_date)`); a follow-up cleanup will drop it. |

If both `date` and `start_date` are supplied, `date` wins.

### Response

A `200` JSON array. Each element gains one new field:

```jsonc
{
  "id": "…",
  "line_id": "…",
  "product_id": "…",
  "quantity": 12.5,
  "unit_of_measure": "kg",
  "batch_number": "B-001",
  "notes": null,
  "created_by": "…",
  "created_at": "2026-05-10T08:14:22.123Z",   // unchanged — server timestamp
  "production_date": "2026-05-09",            // NEW — 'YYYY-MM-DD'
  "products": { "id": "…", "name": "…", "code": "…" },
  "lines":    { "id": "…", "name": "…", "code": "…" },
  "profiles": { "id": "…", "full_name": "…" }
}
```

### Sorting

Changes from `ORDER BY created_at DESC` to `ORDER BY production_date DESC, created_at DESC`. Two entries on the same production date are ordered by insertion time, newest first.

### Errors

Unchanged. `401` for unauthenticated.

---

## `POST /api/production` — create a production entry

### Request body — added fields

```jsonc
{
  "line_id":          "<uuid>",
  "product_id":       "<uuid>",
  "quantity":         12.5,
  "unit_of_measure":  "kg",
  "batch_number":     "B-001",
  "notes":            null,
  "production_date":  "2026-05-09",   // NEW — required
  "client_today":     "2026-05-10"    // NEW — required; client's calendar date in browser TZ
}
```

### Server-side validation flow

```text
1. session.user must exist                                 → 401 if not
2. body.production_date matches /^\d{4}-\d{2}-\d{2}$/      → 400 if not
3. body.client_today    matches /^\d{4}-\d{2}-\d{2}$/      → 400 if not
4. abs(client_today − UTC_today_date) ≤ 2 days             → 400 if not (anti-spoof)
5. production_date ≤ client_today                          → 400 if future
6. session.user.role === 'admin'
     → no further bound
   else
     → production_date >= client_today − 1 day             → 403 otherwise
7. INSERT row with production_date = body.production_date
   created_at gets default now()
   created_by gets session.user.id
```

### Response

`200` with the inserted row, mirrored from the GET shape (now includes `production_date`).

### Error shapes

| HTTP | Body | When |
|------|------|------|
| 400 | `{ "error": "invalid_production_date" }` | format / future / anti-spoof failures |
| 401 | `{ "error": "Unauthorized" }` | unchanged |
| 403 | `{ "error": "backdate_not_allowed_for_role" }` | non-admin tries to set production_date older than `client_today − 1 day` |
| 500 | `{ "error": "Failed to create production entry" }` | unchanged |

---

## `GET /api/dashboard` — home dashboard

### Behavioral changes

The two production aggregations both switch from `created_at` to `production_date`:

1. **Today's production count** — `SELECT count(*) FROM production_entries WHERE production_date = $factory_today`. `$factory_today` is computed server-side as `now() AT TIME ZONE process.env.FACTORY_TIMEZONE` (default `'Africa/Cairo'`), per `research.md` Decision 2.
2. **Recent activity** for production — selects the 5 most recent production entries by `(production_date DESC, created_at DESC)` instead of by `created_at DESC` alone, then merges with waste / damage (which still sort by their own `created_at`).

The activity-feed merge sort uses each row's most-meaningful date for the relevant entry type:
- production rows: `production_date`
- damage / waste rows: `created_at` (out of scope for this feature)

### Response shape — added field

The `recent` activity entries gain a `production_date` field on production rows:

```jsonc
{
  "type": "production",
  "id": "…",
  "created_at": "2026-05-10T08:14:22.123Z",
  "production_date": "2026-05-09",   // NEW
  "…": "…"
}
```

Damage / waste rows are unchanged.

---

## Backwards compatibility

- `start_date` query param on `GET /api/production` continues to work as a soft-compat layer; it is not used by any in-tree caller after this feature lands. Removal is a follow-up.
- The `created_at` field is still returned on every entry. Nothing that already reads `created_at` breaks.
- Pre-existing rows show `production_date` set to the calendar day of `created_at` in `Africa/Cairo` (set by the migration backfill).
