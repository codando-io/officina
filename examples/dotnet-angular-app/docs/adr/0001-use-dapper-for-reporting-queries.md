# 0001. Use Dapper for reporting queries

- Status: accepted
- Date: 2026-06-14
- Deciders: backend team

## Context

Reporting endpoints join five to eight tables with window functions. The EF Core
LINQ versions produced SQL that was hard to tune, and two reports exceeded the
2 s budget on production-size data.

## Decision

Reporting reads (`Features/Reports/`) use Dapper with hand-written SQL. All writes
and transactional reads stay on EF Core.

## Alternatives considered

| Option | Why not |
|---|---|
| EF Core `FromSql` | Keeps two query styles inside EF; mapping to non-entity DTOs was clumsier than Dapper |
| Database views + EF Core | Moves logic into the database without migrations tests for views |

## Consequences

Two data access styles coexist, split by feature folder. Dapper queries need
their own integration tests against SQL Server. Reverting means rewriting the
report queries; each report can move back independently.
