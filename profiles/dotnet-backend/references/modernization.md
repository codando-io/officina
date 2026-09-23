# Modernization catalog (.NET)

Legacy .NET idioms worth tracking, with the modern replacement and how risky
the move is. `architecture-audit` (focus `modernization`) counts coexistence and
builds a backlog; each item runs as a refactor or migration under the rules in
`$HARNESS/core/lifecycle.md` (*Migration*).

## Platform and hosting

| Legacy | Modern | Risk | Notes |
|---|---|---|---|
| .NET 8/9, `netstandard2.x` libraries | `net10.0` | Medium | See `currency.md` for the order |
| `Startup.cs` + `IWebHostBuilder` | `WebApplication` minimal hosting | Low | Keep middleware order |
| Swashbuckle-only OpenAPI | `Microsoft.AspNetCore.OpenApi` | Low-Medium | Regenerate clients and diff |
| APM agent (e.g. New Relic, App Insights SDK) | OpenTelemetry with an exporter to the same backend | Medium | Dashboards and alert names change; run both for a period |
| Hand-rolled integration hosts | `WebApplicationFactory` + a real database container | Low | Real provider behavior in tests |
| `.sln` | `.slnx` | Low | When all tooling in use supports it |

## Language and libraries

| Legacy | Modern | Risk | Notes |
|---|---|---|---|
| Nullable disabled | `<Nullable>enable</Nullable>` per project | Medium | Project by project; fix warnings, do not suppress |
| Block-scoped namespaces, classic ctor + field assignment | File-scoped namespaces, primary constructors | Low | Only in files you are already changing, or as one mechanical commit |
| Classic extension methods scattered across helpers | Extension blocks, one class per extended type | Low | Worth it when you reorganize the helpers anyway |
| Type-pattern `switch` over an open hierarchy with `_ => throw new NotImplementedException()` | Closed hierarchy (.NET 10 emulation, `closed` on .NET 11) with `UnreachableException` | Low | See `csharp.md` |
| `Newtonsoft.Json` | `System.Text.Json` | Medium-High | Different defaults (casing, enums, references, numbers). Needs contract tests on every payload |
| `System.Data.SqlClient` | `Microsoft.Data.SqlClient` | Low-Medium | `Encrypt` defaults to true; check connection strings and certificates |
| `BinaryFormatter` | Explicit serializers | High | Removed in .NET 9; also a deserialization risk |
| `DateTime.Now`/`UtcNow` in logic | Injected `TimeProvider` | Low | Testable time |
| String-interpolated `ILogger` calls | Message templates or `[LoggerMessage]` | Low | Queryable logs |
| Per-project package versions | Central package management | Low | One version per package |

## EF Core

| Legacy | Modern | Risk | Notes |
|---|---|---|---|
| Owned types (`OwnsOne`) for value objects | Complex types, optionally JSON-mapped | Medium | Schema can change; plan as a migration |
| Unnamed query filters | Named filters | Low | Lets code disable one filter without the others |
| Load-modify-save for bulk updates | `ExecuteUpdate`/`ExecuteDelete` | Medium | Bypasses `SaveChanges` interceptors |
| Third-party bulk extensions | `ExecuteUpdate`/`ExecuteDelete`, or keep the library where inserts dominate | Low-Medium | Measure before replacing |
| `Database.Migrate()` at startup in multi-instance deploys | Migration bundle in the pipeline | Medium | Removes the replica race |
