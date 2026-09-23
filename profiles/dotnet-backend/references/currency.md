# Keeping a .NET backend current

Run `$HARNESS/bin/stack-report` first. It prints SDK pins, target frameworks,
outdated/vulnerable/deprecated NuGet packages, base images, and unpinned CI
actions.

## Support windows (verify before acting)

Checked 2026-09-23 on <https://dotnet.microsoft.com/platform/support/policy/dotnet-core>:

| Version | Type | End of support |
|---|---|---|
| .NET 10 | LTS | 2028-11-14 |
| .NET 9 | STS | 2026-11-10 |
| .NET 8 | LTS | 2026-11-10 |

A project on .NET 8 or 9 is weeks from losing security patches: plan the move
to .NET 10 now. Projects targeting `netstandard2.x` for shared contracts can
usually move to `net10.0` unless a non-.NET-10 consumer still needs them.

## What to check

| Item | Where | Command / check |
|---|---|---|
| SDK pin | `global.json` | `dotnet --list-sdks`; `rollForward` (prefer `latestFeature` or `latestPatch`) |
| Target frameworks | `*.csproj`, `Directory.Build.props` | `TargetFramework(s)` |
| Outdated NuGet | solution | `dotnet list package --outdated` |
| Vulnerable NuGet | solution | `dotnet list package --vulnerable --include-transitive`; restore warnings `NU1901`-`NU1904` |
| Deprecated NuGet | solution | `dotnet list package --deprecated` |
| Obsolete APIs | build output | `CS0618`, `CS0612`, `SYSLIB0xxx` counts before and after |
| Analyzer level | `Directory.Build.props` | `AnalysisLevel` (e.g. `latest-recommended`), `EnforceCodeStyleInBuild` |
| Central package management | `Directory.Packages.props` | one version per package |
| Base images | `Dockerfile` `FROM` | tag matches the TFM; digest pin for production; chiseled images where possible |
| Licences | new or bumped packages | watch packages that moved to commercial licences at a major version (pin the last free major and record it in an ADR) |

## Recommended settings

- `<NuGetAudit>true</NuGetAudit>` and `<NuGetAuditMode>all</NuGetAuditMode>` so
  restore reports transitive vulnerabilities.
- `<RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>` and
  `--locked-mode` in CI when the team accepts the overhead.
- Dependabot or Renovate with the `nuget` and `docker` ecosystems, grouped.

## Platform upgrade order

1. Get the build warning-clean enough that new warnings are visible.
2. Upgrade the SDK and `global.json`; build.
3. Move the TFM straight to the target LTS unless the jump crosses areas with
   known breaking changes you want to isolate.
4. Upgrade `Microsoft.*` packages to the matching major (ASP.NET Core, EF Core,
   `Microsoft.Extensions.*`), and EF providers (Npgsql, SqlServer) to the
   matching major.
5. Check the breaking changes for the target version
   (<https://learn.microsoft.com/dotnet/core/compatibility/breaking-changes>,
   and EF Core's own list) against the code, with evidence per item.
6. Update Docker base images and CI `setup-dotnet` to the same version.
