-- Add a calendar production_date column to production_entries.
-- Distinct from created_at (which stays as the audit timestamp).
-- See specs/001-backdated-production-entries/data-model.md
DO $$ BEGIN
    ALTER TABLE production_entries ADD COLUMN production_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Backfill historical rows using factory time zone (Africa/Cairo) since the
-- feature did not yet exist when these rows were created. New rows will be
-- written with the date the user's browser computed; only legacy rows fall
-- back to factory TZ for their assigned production date.
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
