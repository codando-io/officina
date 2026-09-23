# Orders

Order management for a B2B catalog: an ASP.NET Core API (`src/Orders.Api`) and an
Angular back-office (`web/`). Correctness of order totals and stock reservation
matters more than latency.

> Example project for the engineering harness. The code is a skeleton; the
> harness files (`AGENTS.md`, `CLAUDE.md`, `.claude/`, `.engineering/`,
> `docs/adr/`) show what an adopted repository looks like.

This repository uses the engineering harness. Harness configuration, project
overrides, and project memory live in `.engineering/`. Decisions live in
`docs/adr/`.

## Commands

Verified on 2026-09-23. Run from the repository root.

| Purpose | Command |
|---|---|
| Restore | `dotnet restore Orders.slnx` and `cd web && npm ci` |
| Build | `dotnet build Orders.slnx` |
| Fast tests | `dotnet test tests/Orders.Api.Tests --filter "Category!=Integration"` |
| Full tests | `dotnet test Orders.slnx` and `cd web && npm test` |
| Run locally | `docker compose up -d sqlserver` then `dotnet run --project src/Orders.Api` |
| Lint / format check | `dotnet format Orders.slnx --verify-no-changes` |

## Architecture

- `src/Orders.Api`: minimal APIs grouped by feature (`Features/<Feature>/`), one
  file per endpoint. Business rules live in feature handlers, not endpoints.
- Writes go through EF Core (`OrdersDbContext`). Reporting reads use Dapper
  (ADR 0001).
- `web/`: standalone components, signals for local state, a generated OpenAPI
  client in `web/src/app/api/` (never edited by hand).

## Conventions

- Errors: `TypedResults.Problem` with a stable `type` URI per error; the Angular
  error interceptor maps `type` to messages.
- Money is `decimal(18,2)` in SQL and a string in JSON.

## Reference implementations

- Endpoint: `src/Orders.Api/Features/Orders/CreateOrder.cs`
- Frontend feature: `web/src/app/orders/order-list/`
- Integration test: `tests/Orders.Api.Tests/Orders/CreateOrderTests.cs`

## Testing

xUnit with `WebApplicationFactory` and Testcontainers (SQL Server). Integration
tests carry `[Trait("Category", "Integration")]`. Angular uses the `unit-test`
builder with Vitest.

## Observability

OpenTelemetry with the Azure Monitor distro (`UseAzureMonitor`). Activity source
`Orders.*`. Find a request in Application Insights by `operation_Id` (= trace id).

## Delivery

| Item | Value |
|---|---|
| Hosting / provider | Azure Container Apps |
| Environments | staging, production |
| Staging gate | Automatic deploy of `main` to staging; production by manual approval |
| Deploy trigger | GitHub Actions on tag `v*` |
| Rollback | Reactivate the previous Container Apps revision |
| Feature flags | Azure App Configuration feature flags |
| Database migrations | EF Core migration bundle as a pipeline step before the app deploy |

## Security notes

Entra ID (JWT bearer) for the API. Every endpoint must be registered inside the
`/api` group that calls `RequireAuthorization("Orders")`: endpoints mapped
outside it are anonymous. Secrets come from Key Vault through managed identity; local development
uses user-secrets.
