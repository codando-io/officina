# Data access: EF Core, Dapper, PostgreSQL, SQL Server

Sources: <https://learn.microsoft.com/ef/core/what-is-new/ef-core-10.0/whatsnew>
and <https://learn.microsoft.com/ef/core/what-is-new/ef-core-10.0/breaking-changes>.
Checked 2026-09-23. EF Core 10 is LTS until 2028-11-10.

## Choosing between EF Core and Dapper

Follow the project's existing split. When there is none: EF Core for writes and
aggregate-oriented reads where change tracking and migrations help; Dapper (or
EF Core raw SQL) for hot, reporting, or complex read queries where you want full
control of the SQL. Record the split in `AGENTS.md`; an unexplained mix of both
on the same path is an architecture finding.

## EF Core 10 features to prefer in new code

- **Complex types instead of owned types** for value objects (addresses, money,
  ranges). They can be optional (`Address?`, with at least one required
  property), structs, and mapped to a JSON column with
  `ComplexProperty(c => c.Address, c => c.ToJson())`. Microsoft advises moving
  off owned types; migrating existing ones is a planned migration, not a drive-by.
- **Named query filters**: `HasQueryFilter("SoftDelete", e => !e.IsDeleted)` and
  `IgnoreQueryFilters(["SoftDelete"])` to disable one filter and keep the
  others (for example keep the tenant filter while reading deleted rows).
- **`LeftJoin`/`RightJoin`** operators in method syntax instead of
  `GroupJoin` + `DefaultIfEmpty`.
- **`ExecuteUpdateAsync` with a block lambda**, so setters can be conditional,
  and updates inside JSON complex types.
- **Parameterized collections** now become one parameter per value (padded).
  Override with `EF.Constant`/`EF.Parameter`/`EF.MultipleParameters` per query
  only when a measured plan says so.

## Queries

- Read paths: `AsNoTracking()` and projection to DTOs with `Select`; avoid
  loading full graphs.
- Watch for N+1: lazy loading, `foreach` with navigation access, queries in
  loops. Use `Include`, projection, or `AsSplitQuery()`, and check the generated
  SQL (category `Microsoft.EntityFrameworkCore.Database.Command` at
  `Information` in development).
- Raw SQL: `FromSql`/`ExecuteSql` with interpolated strings are parameterized.
  `FromSqlRaw`/`ExecuteSqlRaw` with concatenation or interpolation are
  injection; EF Core 10 ships an analyzer that warns about it.
- `ExecuteUpdate`/`ExecuteDelete` bypass change tracking, `SaveChanges`
  interceptors (a soft-delete interceptor, for one), and domain events raised on
  save. Command interceptors still run. Confirm nothing relied on the bypassed
  ones.
- Concurrency: a concurrency token (`rowversion` on SQL Server, `xmin` on
  PostgreSQL) for entities several users edit; handle
  `DbUpdateConcurrencyException` deliberately.
- `DbContext` is scoped and not thread-safe. No parallel queries on one context.

## Migrations

- Create with `dotnet ef migrations add <Name>` and **read the generated
  migration**: `DropColumn`, `DropTable`, `RenameColumn`, `AlterColumn` (type or
  nullability), data loss warnings.
- CI gate: `dotnet ef migrations has-pending-model-changes`.
- Review the SQL: `dotnet ef migrations script <from> <to> --idempotent`.
- Destructive changes follow expand-contract (`$HARNESS/core/lifecycle.md`).
  A rename is add + copy + drop while old code may still run, not `RenameColumn`.
- Apply migrations in a deploy step (migration bundle `dotnet ef migrations
  bundle`, or an idempotent script) rather than `Database.Migrate()` at startup.
  Startup migration races across replicas and needs DDL rights for the app
  identity; it is tolerable only for single-instance apps, and a
  `HasPendingModelChanges` guard does not remove the race.
- EF Core 10 tools need `--framework` on multi-targeted projects.

## PostgreSQL (Npgsql)

- `timestamp with time zone` accepts only `DateTime` of kind UTC (or
  `DateTimeOffset`); `timestamp without time zone` is for local wall-clock
  values. Mixing them fails at runtime, not at compile time.
- `jsonb` for document columns; with EF Core 10, prefer complex types mapped to
  JSON over raw `jsonb` strings when the shape is known.
- Advisory locks (`pg_advisory_xact_lock`) for cross-instance mutual exclusion,
  scoped to a transaction.
- Enums: store as strings or map PostgreSQL enums explicitly; never rely on
  integer order in data that outlives the code.
- Adding a column with a volatile default rewrites the table; a constant default
  does not (PostgreSQL 11+). Create indexes on large tables with
  `CREATE INDEX CONCURRENTLY` in a raw SQL migration step outside a transaction.

## SQL Server

- Types: `datetime2` or `datetimeoffset` over `datetime`; `decimal(p,s)` for
  money; `nvarchar` only where Unicode is needed.
- Parameter sniffing: a plan compiled for one value can be terrible for another.
  Suspect it when a query is fast in SSMS and slow from the app.
- Know whether the database uses `READ_COMMITTED_SNAPSHOT`; blocking and
  deadlocks behave very differently with and without it.
- EF Core 10 uses the `json` column type by default under `UseAzureSql` or
  compatibility level 170, and the first migration then alters existing
  `nvarchar(max)` JSON columns. Read that migration before applying it.
- Mixing EF Core and ADO/Dapper in one `TransactionScope` can escalate to a
  distributed transaction because EF Core 10 injects `Application Name` into the
  connection string. Set your own `Application Name` to avoid it.
- Table-locking operations (type changes, index builds, some column additions)
  vary by edition; test on production-like volume and edition.

## Dapper

- Always pass parameters (`new { Id = id }`, `DynamicParameters`); dynamic
  `ORDER BY` or column names come from an allowlist.
- `WHERE Id IN @Ids` expands a list into parameters. For large lists use a
  table-valued parameter (SQL Server) or `= ANY(@Ids)` with an array parameter
  (PostgreSQL).
- SQL Server: string parameters are sent as `nvarchar(4000)` by default; for
  `varchar` columns use `new DbString { Value = v, IsAnsi = true, Length = n }` or
  the index is not used.
- Open connections late, dispose early (`await using`); pass the transaction
  explicitly when sharing a connection with EF Core.
- Map to explicit DTOs; `SELECT *` breaks silently when columns change.

## Data fixes

Never run `UPDATE`/`DELETE` without `WHERE` against shared environments. A data
fix is a script with a `SELECT` preview, a transaction, and a row count check,
reviewed like code.
