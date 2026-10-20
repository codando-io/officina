# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning:
SemVer; while in 0.x, a minor bump may break projects.

Every version that breaks projects has a **Migration** section. The `adopt`
skill applies these sections in order when upgrading a project, so write them as
steps: what to rename, move, or decide.

## [Unreleased]

### Added

- Failure-scenario catalog (`skills/test/references/failure-scenarios.md`): 53
  scenarios in 8 categories with verification technique, trigger, and primary
  source. `test` adds the triggered rows as behaviors; `plan` lists R2 failure
  modes from it; `review` checks them and the three error-handler patterns.
- Policy: R2 changes need at least two independent safeguards per identified
  failure mode.
- Delivery readiness: `architecture-audit` reports missing minimum-delivery
  items (CI, staging, flags, rollback, observability); `adopt` marks them as
  `missing` in `AGENTS.md`.
- Profiles: `references/failure-testing.md` for .NET and Angular.
- Pull request structure: `templates/pull-request.md` (What, Why, How to
  verify, Risk, Reviewer focus) and the rules in `core/git.md`. `adopt` offers
  to install it as the forge's template.
- `bin/check-commit-msg`: checks the Conventional Commits header and rejects AI
  tool attribution (`--summary-only` also rejects a body). The commit rules in
  `core/git.md` now state the attribution rule. `adopt` offers it as a
  `commit-msg` hook.

- Licensed under Apache-2.0 (`LICENSE`, `NOTICE`), with Codando Software as the
  copyright holder; the plugin and marketplace manifests name Codando Software
  as author and owner.

### Changed

- The marketplace source is the Forgejo repository
  (`ssh://forgejo@src.capivaras.dev:2222/scriptorium/officina.git`) instead of a
  local checkout, so any machine with an authorized SSH key can install the
  plugin. `templates/claude-settings.json` and the example project carry that
  source in place of the `OWNER/engineering-harness` placeholder.
  `claude plugin marketplace add` rejects `ssh://` URLs, so machine setup
  declares the source in `~/.claude/settings.json` and Claude Code clones it at
  the next start; README, IMPLEMENTATION and the Claude Code adapter document
  the sequence.
- `review` walks the failure-scenario catalog and the security checklist
  (`core/security.md` §5) as a numbered step of its own, and its output carries
  a table for each. Both were a question inside the Tests and Security
  dimensions with no slot in the output, and a review ran the whole procedure
  without opening either file.

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
