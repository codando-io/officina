# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning:
SemVer; while in 0.x, a minor bump may break projects.

Every version that breaks projects has a **Migration** section. The `adopt`
skill applies these sections in order when upgrading a project, so write them as
steps: what to rename, move, or decide.

## [Unreleased]

## [0.1.0] - 2026-09-23

### Added

- Core: `policy.md` (loaded every session), `lifecycle.md`, `security.md`,
  `observability.md`, `git.md`.
- Skills: `investigate`, `plan`, `implement`, `test`, `review`, `security-audit`,
  `architecture-audit`, `dependency-update`, `observability`, `release`
  (manual only), `adopt` (manual only).
- Profiles `dotnet-backend` (modern C# including closed hierarchies and C# 15
  unions, EF Core 10 on PostgreSQL and SQL Server, .NET 10 platform), `angular`
  (APIs by version, components and design system), and `dotnet-angular`
  (integration only). Profiles compose in `harness.yaml`.
- `bin/stack-report`: read-only inventory of .NET, npm/Angular, Docker, and CI.
- Lifecycle with an R0 fast path and a post-deploy check (`observability`,
  post-deploy mode) that closes the feedback loop.
- Project contract: `.engineering/harness.yaml`, `.engineering/overrides/`,
  `.engineering/memory/`, templates for `AGENTS.md`, `CLAUDE.md`, ADR, memory
  entries and index, overrides, Claude settings.
- `bin/eng-context`: agent-neutral session context loader with version check.
- Claude Code adapter: marketplace + plugin `eng`, `SessionStart` hook.
- Example adopted project `examples/dotnet-angular-app`.
- Tests (`node --test tests/*.test.mjs`) and CI, including checks for skill
  budget, agent neutrality, broken references, and rules repeated across files.

### Migration

First release. Adopt with the `adopt` skill.
