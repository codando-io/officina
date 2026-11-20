# Database access: PostgreSQL with hand-written SQL

Rules live in `$HARNESS/core/database.md`: PostgreSQL by default, hand-written
SQL instead of an ORM, native enum types for closed sets, side tables for
multi-value fields, and constraints, triggers, and views for the rest. The DDL
example is there; this file covers the Node side.

## Driver and queries

`pg` or `postgres.js`, with bound parameters. Never build the SQL string from
input, and never use a tagged template that concatenates.

```ts
// pg: a side table read with one query
const { rows } = await pool.query<OfferChannel>(
  `SELECT channel_code AS "channelCode", enabled, fee
   FROM offer_channels WHERE offer_id = $1`,
  [offerId],
);

// postgres.js: the tagged template binds each ${} as a parameter
const channels = await sql<OfferChannel[]>`
  SELECT channel_code AS "channelCode", enabled, fee
  FROM offer_channels WHERE offer_id = ${offerId}`;
```

Native enums arrive as strings; validate them at the boundary and type them as a
union (`'pending' | 'paid' | 'cancelled'`). Read shapes come from views.

## Migrations

Numbered `.sql` files applied by a pipeline step (dbmate, node-pg-migrate in
SQL mode, or Flyway), not at application startup. Enums, side tables,
constraints, triggers, and views are all plain DDL in these files. Read the
file before applying it, the same way you read an ORM-generated migration.

## Projects that already use an ORM

Prisma, Drizzle, and TypeORM code that exists stays until a migration of its
own replaces it. New queries beside it are plain SQL, and schema changes go in
SQL migration files, not in the ORM's model. For triggers and views the ORM
cannot express, the SQL file is the only way anyway: Prisma's
`migrate dev --create-only` and `drizzle-kit generate --custom` produce an
empty migration to hold it.

## Tests

Run constraint and trigger tests against a real PostgreSQL (Testcontainers or
the project's compose service): insert the violating row and expect the
database error. A mocked client cannot prove a database rule.
