-- Make username uniqueness case-insensitive at the database level.
-- The application already normalizes to lowercase on every write path,
-- but this guarantees the invariant even if a future code path forgets to.

-- Defensive normalization: lowercase any existing usernames. Should be a
-- no-op given the validateUsername / register-route regex, but it makes
-- the next step safe to run on any historical data.
UPDATE profiles SET username = lower(username) WHERE username IS NOT NULL AND username <> lower(username);

-- Replace the plain unique index with a functional one on lower(username).
DROP INDEX IF EXISTS idx_profiles_username;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
    ON profiles (lower(username))
    WHERE username IS NOT NULL;
