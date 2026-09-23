# .NET 10 platform features for backends

What changed in the runtime, ASP.NET Core, and the SDK that affects how new
backend code should be written. Checked 2026-09-23 against
<https://learn.microsoft.com/aspnet/core/release-notes/aspnetcore-10.0>,
<https://learn.microsoft.com/dotnet/core/whats-new/dotnet-10/libraries>, and
<https://learn.microsoft.com/dotnet/core/whats-new/dotnet-10/sdk>.

## ASP.NET Core 10

| Feature | Use it when | Notes |
|---|---|---|
| `builder.Services.AddValidation()` | Minimal APIs validated with DataAnnotations | Source-generated; nested objects, collections, records; errors through `IProblemDetailsService`. `.DisableValidation()` per endpoint. Package `Microsoft.Extensions.Validation` |
| Built-in OpenAPI 3.1 (`AddOpenApi`, `MapOpenApi`) | New APIs, or replacing Swashbuckle | `MapOpenApi("/openapi/{documentName}.yaml")` serves YAML; XML doc comments flow into the document. Breaking for transformers: `OpenApiAny` became `JsonNode` |
| `TypedResults.ServerSentEvents(...)` | Server push over plain HTTP | Simpler than SignalR for one-way streams |
| Passkeys in ASP.NET Core Identity | Projects on Identity that want phishing-resistant login | WebAuthn |
| JSON Patch on System.Text.Json | `PATCH` endpoints without Newtonsoft | Package `Microsoft.AspNetCore.JsonPatch.SystemTextJson`; no `ExpandoObject` |
| Cookie auth returns 401/403 for API endpoints | Always (breaking change) | SPA clients relying on the login redirect must handle 401 |

## Libraries

- `System.Text.Json`: `JsonSerializerOptions.Strict` (no duplicate properties,
  respects nullable annotations and required constructor parameters) for
  contracts you control; `AllowDuplicateProperties = false` on its own when
  strict mode is too much at once.
- `TimeProvider` (since .NET 8) for testable time; `IMeterFactory` for metrics.

## SDK

- `.slnx` is the default for `dotnet new sln`.
- `dotnet test` can run on Microsoft.Testing.Platform, configured in
  `global.json` (`"test": { "runner": "Microsoft.Testing.Platform" }`).
- `dotnet tool exec` / `dnx` run a tool without installing it. Treat it like
  `npx`: only packages you trust (`$HARNESS/core/security.md` §3).
- File-based apps: `dotnet run script.cs` with `#:package` directives, good for
  one-off maintenance scripts instead of a throwaway project.
- Noun-first commands (`dotnet package add`, `dotnet package list`); the old
  verb-first forms still work.

## What .NET 11 (November 2026) adds

Relevant for planning, not for code on `net10.0`: C# 15 `union` and `closed`
types (see `csharp.md`). .NET 11 is STS (24 months of support). Staying on .NET
10 LTS until .NET 12 is the default; move earlier only for a feature the
project needs.
