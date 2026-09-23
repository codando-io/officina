# Profiles

A profile is stack knowledge that changes with the technology, not with the
project: how to detect the stack, which commands verify a change from fastest to
slowest, which conventions to look for, and which pitfalls bite. Project facts
never go here; they go in the project's `AGENTS.md`.

## Contract

```text
profiles/<name>/
├── PROFILE.md       required. Short; read whole by skills that need the stack
├── references/      optional. Read on demand by specific skills
└── scripts/         optional. Deterministic, read-only reports
```

`PROFILE.md` has these sections, in this order (checked by the tests):

1. `## Detection` - files and markers that identify the stack.
2. `## Verification ladder` - commands from the cheapest check that can fail to
   the full CI-equivalent run. The project's own commands in `AGENTS.md` take
   precedence over the ladder.
3. `## Conventions to discover` - what to look up in the repository before
   writing code, because projects differ.
4. `## Pitfalls` - stack mistakes that tests often miss.
5. `## References` - which reference file serves which skill.

Optional, between *Conventions to discover* and *Pitfalls*:
`## House defaults for new code` - opinionated defaults for code the agent
creates. They must say how they yield: to the project's `AGENTS.md`, to the
style of the file being edited, and to what the project's version supports.

Rules:

- Profiles compose. A project lists several in `harness.yaml`
  (`profiles: [dotnet-backend, library]`); skills read them in order.
- A profile never contradicts `core/`. It may add stricter rules.
- Scripts only read and report. They never edit tracked files, install
  packages, or need credentials. A script supports `--offline` when it would
  otherwise hit the network. Inventory that spans stacks lives in
  `bin/stack-report`.
- Facts that expire (support windows, current versions) say where to verify them
  and when they were last checked.

## Available

| Profile | Axis | For |
|---|---|---|
| `dotnet-backend` | stack | ASP.NET Core services and workers: modern C#, EF Core/Dapper on PostgreSQL or SQL Server, OpenTelemetry, containers |
| `angular` | stack | Angular apps: modern APIs by version, components and design system, tokens |
| `dotnet-angular` | integration | Only the concerns between the two: contract, auth, errors, serialization, trace propagation. Listed after `dotnet-backend` and `angular` |

A full-stack .NET + Angular repository declares
`profiles: [dotnet-backend, angular, dotnet-angular]`; an Angular-only
repository declares `[angular]`.

## Planned (not implemented)

Created when a real project needs them, not before.

| Profile | Axis | Scope |
|---|---|---|
| `node-backend` | stack | Node.js/NestJS services and MCP servers in TypeScript, npm/pnpm |
| `library` | project kind | Published packages: SemVer as a gate, public API review, changelog discipline, multi-target builds |
| `infrastructure` | project kind | Terraform/Bicep/Helm/Kubernetes manifests: plan before apply, drift, blast radius, state safety |

Stack profiles and project-kind profiles compose: a NuGet package is
`[dotnet-backend, library]`.
