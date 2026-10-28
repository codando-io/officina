# Profile: dotnet-backend

ASP.NET Core services in C#: APIs, workers, and modular monoliths, with EF Core
(and sometimes Dapper) on PostgreSQL or SQL Server, shipped as containers,
instrumented with OpenTelemetry.

Last reviewed: 2026-09-23 (.NET 10 LTS current; .NET 11 at RC1, GA expected
November 2026).

## Detection

- `*.sln` or `*.slnx`, `*.csproj`, `global.json`, `Directory.Build.props`,
  `Directory.Packages.props`, `Program.cs`, `appsettings*.json`.
- Database provider: `Npgsql.EntityFrameworkCore.PostgreSQL` or
  `Microsoft.EntityFrameworkCore.SqlServer` in the project files.

Quick inventory: `$HARNESS/bin/stack-report --offline` (drop `--offline` to
list outdated, vulnerable, and deprecated packages).

## Verification ladder

Cheapest first:

1. `dotnet build <project.csproj> --no-restore` for the project you touched.
2. `dotnet test <test.csproj> --filter "FullyQualifiedName~<Name>"` for the
   targeted tests.
3. `dotnet test <test.csproj>`, then `dotnet format --verify-no-changes`, with
   the warning count compared before and after.
4. `dotnet test <solution>`, plus `dotnet ef migrations has-pending-model-changes`
   when the model changed.
5. `docker build .` when the change touches the image or startup.

New `CS0618`/`SYSLIB*` (obsolete) or nullable warnings are findings, not noise.

## Conventions to discover

Projects differ on these, and each project's `AGENTS.md` decides. Look them up
before writing code; never switch a project from one to the other in passing:

- API style: controllers, minimal APIs, or FastEndpoints; where request and
  response contracts live.
- Validation: DataAnnotations (plus `AddValidation()` for minimal APIs) or
  FluentValidation. Some projects ban one of them.
- Error contract: `ProblemDetails` or a custom error model; exceptions mapped in
  one handler or filter.
- Serializer: `System.Text.Json` or Newtonsoft.
- Mediator/CQRS or direct services; repository classes or `DbContext` in
  handlers.
- EF mapping style: `IEntityTypeConfiguration<T>` classes or attributes first.
- Tests: xUnit, MSTest, NUnit, or TUnit; `WebApplicationFactory` or
  `TestServer`; real database container or in-memory.
- Formatting: `.editorconfig` (tabs or spaces, brace style) and naming of
  private members.

## House defaults for new code

Opinionated defaults for code you create. Rules that make them safe to apply:

- They apply when the project's target framework supports them. Language
  features follow the default `LangVersion` of the TFM; never set
  `LangVersion` to `preview` in production code.
- In an existing file, match that file's style. Do not mix old and new idioms in
  one file; converting existing code is a separate, modernization change.
- The project's `AGENTS.md` and overrides win over these defaults.

Defaults:

- Platform: the current LTS (`net10.0`). Adopt an STS release only in projects
  that upgrade every year. `Directory.Build.props` with `Nullable`,
  `ImplicitUsings`, `TreatWarningsAsErrors`, and central package management.
- Language (C# 14 on .NET 10): extension members for new extensions, the
  `field` keyword instead of hand-written backing fields, null-conditional
  assignment, collection expressions, primary constructors for dependency
  injection, `sealed` by default, records for contracts. Details and when *not*
  to use each: `references/csharp.md`.
- Alternatives and outcomes: model a fixed set of cases as a closed hierarchy
  (.NET 10) or a `union`/`closed` type (.NET 11). Keep exceptions for failures.
  See `references/csharp.md` *Closed hierarchies and unions*.
- EF Core 10: complex types instead of owned types for value objects, named
  query filters, `ExecuteUpdate`/`ExecuteDelete` for bulk changes, migrations
  applied outside application startup. See `references/efcore.md`.
- ASP.NET Core 10: built-in OpenAPI, `TypedResults`, `ProblemDetails`,
  `AddValidation()` where the project validates with DataAnnotations. See
  `references/platform.md`.
- Always: `CancellationToken` from the request to every async call; options
  bound with a `SectionName` constant and `ValidateOnStart()`.

## Pitfalls

Runtime and API:
- `.Result`, `.Wait()`, `async void` outside event handlers.
- `new HttpClient()` per call instead of `IHttpClientFactory` or typed clients.
- Captive dependencies: scoped services (a `DbContext`) held by singletons.
- Primary-constructor parameters are mutable captured variables, not
  `readonly` fields. Never assign to them; copy into a field when the value must
  not change.
- Secrets in `appsettings*.json`; locally they belong in user-secrets, deployed
  they come from a secret store.
- ASP.NET Core 10 cookie authentication returns 401/403 to API endpoints instead
  of redirecting to a login page. Clients that expected the redirect break.

Data (details in `references/efcore.md`):
- N+1 queries through lazy loading or loops; tracking queries on read paths.
- Destructive migrations shipped with the code that stops using the column;
  `Database.Migrate()` at startup across several replicas.
- EF Core 10 renamed SQL parameters (`@city` instead of `@__city_0`), which
  breaks SQL snapshot tests and forces plan recompilation after deploy.
- PostgreSQL: `timestamp with time zone` only accepts `DateTime` values of kind
  UTC.

Security (the areas in `$HARNESS/core/security.md` §5, as they appear here):
- Injection: `FromSqlRaw`/`ExecuteSqlRaw` with concatenation or interpolation,
  Dapper with string-built SQL, `Process.Start` with user input.
- Deserialization: Newtonsoft `TypeNameHandling` other than `None`,
  `BinaryFormatter` (removed in .NET 9).
- Authorization: new controllers or endpoints outside the group or convention
  that applies `[Authorize]`/`RequireAuthorization`; no `FallbackPolicy` when
  the app should be secure by default. Multi-tenant lookups that answer
  "forbidden" instead of "not found" leak existence.
- Mass assignment: EF entities as endpoint parameters or `[FromBody]` types;
  bind a request record and copy the allowed fields. `DbContext.Update` on an
  entity built from the request writes every column.
- Abuse: auth and costly endpoints without an `AddRateLimiter` policy
  (`RequireRateLimiting` or `[EnableRateLimiting]`, plus `UseRateLimiter`).
  Behind a reverse proxy, a limiter partitioned by `RemoteIpAddress` puts every
  client in one partition unless `UseForwardedHeaders` is configured for it.
- Transport and headers: no `UseHttpsRedirection` and `UseHsts` (outside
  Development). Behind a TLS-terminating proxy, redirect at the proxy or run
  `UseForwardedHeaders` first; otherwise the app sees every request as HTTP and
  the auth cookie's default `CookieSecurePolicy.SameAsRequest` leaves out
  `Secure`, so set `CookieSecurePolicy.Always`. ASP.NET Core does not send
  `Content-Security-Policy` or `X-Content-Type-Options`; add them in a
  middleware or at the proxy.
- Crypto: password hashes from anything but `PasswordHasher<TUser>` (PBKDF2,
  usable without the rest of Identity) or a vetted Argon2id library. Data
  Protection keys left at the default location in a container are lost on
  restart and differ per replica: auth cookies and antiforgery tokens break and
  values stored with `IDataProtector` become unreadable. Persist them
  (`PersistKeysToDbContext`, a shared volume, or blob storage).

Delivery:
- Floating base image tags (`latest`); images running as root. .NET 8+ images
  define a non-root `app` user (`USER $APP_UID`) and listen on 8080 by default.

## References

| File | Used by |
|---|---|
| `references/csharp.md` | `implement`, `review`, `architecture-audit` (modernization) |
| `references/efcore.md` | `plan`, `implement`, `review` on data access changes |
| `references/platform.md` | `plan`, `dependency-update` (platform mode), `architecture-audit` |
| `references/currency.md` | `dependency-update`, `architecture-audit` (modernization), `security-audit` |
| `references/modernization.md` | `architecture-audit` (modernization), `plan` for migrations |
| `references/observability.md` | `observability` |
| `references/failure-testing.md` | `test`, `review` (tools for the failure-scenario catalog) |
