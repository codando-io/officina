# Database rules

Where a rule can be enforced by the database, it goes in the database, and you
suggest it even when the request did not ask. The application check stays as
the second safeguard (`$HARNESS/core/policy.md`, R2 safeguards). Projects that
already use another engine follow the project; do not migrate engines inside a
feature.

## Engine

PostgreSQL by default for any new datastore. Reach for a different engine only
with a reason written in the plan.

## Access: hand-written SQL, no ORM

New data access is SQL you write: a thin driver or mapper (Dapper, `pg`,
`postgres.js`) with bound parameters, never a query built from input.
Migrations are plain SQL files, versioned, reviewed, and applied by a pipeline
step. A schema generated from an ORM model hides the constraints, triggers, and
views this file asks for, so the SQL is the source of truth.

A project that already uses an ORM keeps it for the code that exists: removing
it is a migration of its own, not a drive-by. New queries and schema changes
beside it are still plain SQL. Record the split in `AGENTS.md`.

## Closed sets and open sets

- A closed set (order status, payment method) is a native enumerated type:
  `CREATE TYPE ... AS ENUM`. Not an integer, not a free string with no check.
  Add values with `ALTER TYPE ... ADD VALUE`; removing or reordering one is a
  rebuild, so plan it as expand-contract.
- A set that grows or carries rules (sales channels WEB, APP, ...) is not an
  enum. Model the values as rows: a lookup table, with a side table for the
  many-to-many link.
- A field that holds several values and cannot be a closed enum gets a side
  table: a child table with a foreign key to the owner, one row per value, and
  room for per-value rules (`enabled`, `fee`, `starts_at`). Not an array, a
  delimited string, or a JSON list. A small fixed set with no per-value rules
  stays an enum.

## Rules the database holds

Suggest each of these before writing the same rule in application code:

- `NOT NULL`, `UNIQUE`, `CHECK`, foreign keys with an explicit `ON DELETE`, and
  exclusion constraints (no overlapping ranges, one active row per owner).
- Partial unique indexes for "at most one active ...".
- Triggers for invariants no constraint can express and for bookkeeping that
  must never be skipped: `updated_at`, an audit row, a derived column, a check
  across rows. Keep them small, deterministic, and free of network calls.
  A trigger is a migration: version it, name it for what it enforces, and test
  it against a real PostgreSQL, not a mock.
- Views for read shapes that several callers need. Aggregate views, or
  materialized views with a refresh policy, for totals and counters instead of
  recomputing them in each service. Say how a materialized view is refreshed
  and how stale it may be (a job running `REFRESH MATERIALIZED VIEW
  CONCURRENTLY` is the usual answer).
- Generated columns for values derived from the same row.

Business decisions that change often, call out to other systems, or need
feature flags stay in the application. When unsure which side a rule belongs
on, say what each side costs and recommend one.

## Changing them

A new constraint, trigger, or view on a table with data is at least R1: show how
existing rows pass it (or the backfill), and the rollback. Dropping or
loosening one is R2 when other systems rely on it. Each constraint and trigger
gets a test that violates it and expects the database to refuse.

## Example

```sql
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled');

CREATE TABLE offer_channels (
    offer_id     uuid    NOT NULL REFERENCES offers (id) ON DELETE CASCADE,
    channel_code text    NOT NULL REFERENCES channels (code),
    enabled      boolean NOT NULL DEFAULT true,
    fee          numeric CHECK (fee >= 0),
    PRIMARY KEY (offer_id, channel_code)
);

CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;
CREATE TRIGGER offers_set_updated_at BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE VIEW offer_totals AS
    SELECT offer_id, count(*) FILTER (WHERE enabled) AS active_channels
    FROM offer_channels GROUP BY offer_id;
```
