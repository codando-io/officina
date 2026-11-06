# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning:
SemVer; while in 0.x, a minor bump may break projects.

Every version that breaks projects has a **Migration** section. The `adopt`
skill applies these sections in order when upgrading a project, so write them as
steps: what to rename, move, or decide.

## [Unreleased]

## [0.2.0] - 2026-11-06

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

- The marketplace source is the public GitHub repository (`codando-io/officina`)
  instead of a local checkout, so any machine can install the plugin with
  `claude plugin marketplace add codando-io/officina`, without an SSH key.
  `templates/claude-settings.json` and the example project carry that source in
  place of the `OWNER/engineering-harness` placeholder.
- `review` walks the failure-scenario catalog and the security checklist
  (`core/security.md` §5) as a numbered step of its own, and its output carries
  a table for each. Both were a question inside the Tests and Security
  dimensions with no slot in the output, and a review ran the whole procedure
  without opening either file.
- Security checklist (`core/security.md` §5): new areas for mass assignment,
  abuse (rate limits, bot protection, account enumeration), and transport and
  headers (HTTPS, HSTS, CSP). Web covers cookie flags, Crypto names acceptable
  password hashes and sensitive fields at rest, and Authorization covers clients
  that query the database directly (row-level security, privileged keys). The
  .NET profile lists the ASP.NET Core APIs and proxy pitfalls behind each.

### Migration

1. In `.claude/settings.json`, set the `engineering-harness` entry of
   `extraKnownMarketplaces` to the GitHub source from
   `templates/claude-settings.json`
   (`{"source": "github", "repo": "codando-io/officina"}`), replacing a
   placeholder, local directory, or Forgejo URL. If `enabledPlugins` for
   `eng@engineering-harness` was kept in `.claude/settings.local.json` because
   the harness was not published, move it to `.claude/settings.json`.
2. Set `harness: "0.2"` in `.engineering/harness.yaml`.
3. Ask the user whether to install `templates/pull-request.md` as the forge's
   pull request template and `bin/check-commit-msg` as a `commit-msg` hook.
4. Mark the minimum-delivery items the project lacks as `missing` in
   `AGENTS.md` *Delivery*.

Machines that registered the marketplace from a local checkout or from Forgejo
switch to GitHub without reinstalling: set the same GitHub source in the
`engineering-harness` entry of `extraKnownMarketplaces` in
`~/.claude/settings.json`, run `claude plugin marketplace add
codando-io/officina`, then `claude plugin update eng@engineering-harness`.
`claude plugin marketplace remove` uninstalls the plugin and clears its
`enabledPlugins` entries. Verified on Claude Code 2.1.308.

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
