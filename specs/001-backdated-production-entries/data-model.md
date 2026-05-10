# Phase 1 — Data Model: Backdated Production Entries

## Schema delta

### `production_entries` (modified)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `gen_random_uuid()` | unchanged |
| `line_id` | `uuid` | NO | — | unchanged |
| `product_id` | `uuid` | NO | — | unchanged |
| `quantity` | `decimal(12,3)` | NO | — | unchanged |
| `unit_of_measure` | `text` | NO | — | unchanged |
| `batch_number` | `text` | YES | — | unchanged |
| `notes` | `text` | YES | — | unchanged |
| `created_by` | `uuid` | NO | — | unchanged |
| `created_at` | `timestamptz` | NO | `now()` | **unchanged** — pure audit |
| **`production_date`** | **`date`** | **NO** | **`CURRENT_DATE`** | **NEW** — calendar day the entry represents, in the user's browser time zone for new rows; in `Africa/Cairo` for backfilled historical rows |

### Index added

```sql
CREATE INDEX IF NOT EXISTS idx_production_entries_production_date
    ON production_entries (production_date DESC);
```

This index supports the per-day filter / sort that replaces every `gte(productionEntries.createdAt, ...)` aggregation in the codebase (4 distinct sites; see `contracts/api-production.md`).

### No other tables changed

`damage_entries`, `waste_entries`, and `reprocessing_entries` are **out of scope** for this feature even though they share the same `created_at` shape. FR-016 explicitly limits the switch to **production** aggregations.

## Drizzle schema change

In `src/shared/lib/db/schema.ts`:

```ts
import { date } from 'drizzle-orm/pg-core'; // add to existing imports

export const productionEntries = pgTable('production_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  lineId: uuid('line_id').notNull().references(() => lines.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
  unitOfMeasure: text('unit_of_measure').notNull(),
  batchNumber: text('batch_number'),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  productionDate: date('production_date', { mode: 'string' }).notNull().defaultNow(), // NEW
});
```

`mode: 'string'` makes Drizzle return the value as `'YYYY-MM-DD'`, matching what the client sends and what the API will serialize.

## TypeScript type change

In `src/shared/types/database.ts`:

```ts
export interface ProductionEntry {
  id: string
  line_id: string
  product_id: string
  quantity: number
  unit_of_measure: string
  batch_number: string | null
  notes: string | null
  created_by: string
  created_at: string
  production_date: string  // NEW — 'YYYY-MM-DD'
}
```

## Migration file

`neon/migrations/004_add_production_date.sql` — idempotent and additive:

```sql
-- Add a calendar production_date column to production_entries.
-- Distinct from created_at (which stays as the audit timestamp).
DO $$ BEGIN
    ALTER TABLE production_entries ADD COLUMN production_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Backfill historical rows using factory time zone (Africa/Cairo)
-- since the feature did not yet exist when these were created.
UPDATE production_entries
   SET production_date = ((created_at AT TIME ZONE 'Africa/Cairo')::date)
 WHERE production_date IS NULL;

-- Tighten the column now that every row has a value.
ALTER TABLE production_entries
    ALTER COLUMN production_date SET NOT NULL,
    ALTER COLUMN production_date SET DEFAULT CURRENT_DATE;

-- Index for the per-day aggregation queries replacing created_at scans.
CREATE INDEX IF NOT EXISTS idx_production_entries_production_date
    ON production_entries (production_date DESC);
```

## Validation rules (from spec)

| Rule | Source FR | Enforced where |
|------|-----------|----------------|
| `production_date` is a valid `YYYY-MM-DD` calendar date | FR-008 | DB column type + server format check |
| Non-admin: `production_date ∈ {client_today, client_today − 1d}` | FR-014 | API route `/api/production` POST |
| Admin: `production_date ≤ client_today` (no future) | FR-012, FR-014 | API route `/api/production` POST |
| `client_today` within ±2 days of UTC date (anti-spoof) | FR-014 (rationale: research.md Decision 3) | API route `/api/production` POST |
| `production_date` is **never** rewritten after insert | Audit / FR-008 | No UPDATE path; admins fix via delete + recreate (assumption) |

## Lifecycle / state transitions

`production_date` is **immutable** once set. There is no UPDATE pathway. This matches the existing entry model (production entries today are insert-only via `POST /api/production`).
