# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning:
SemVer; while in 0.x, a minor bump may break projects.

Every version that breaks projects has a **Migration** section. The `adopt`
skill applies these sections in order when upgrading a project, so write them as
steps: what to rename, move, or decide.

## [Unreleased]

## [0.5.0] - 2026-11-20

One entry point, `start`, and a Stop hook that keeps its security gate from
being skipped.

### Added

- `start` skill: one entry point. The user describes the problem, the skill
  reads the code, asks only what the code cannot answer, restates the problem
  for approval, classifies R0/R1/R2, routes through the lifecycle, and closes
  every change, R0 included, with a security gate and a best-practices gate.
  The skill cap goes from 12/10 to 13/11 for it.
- `bin/eng-gate-check`, a `Stop` hook: in a session that ran `start`, with code
  changes in the tree, it blocks the finish once when the final message has no
  "Security gate" section. It stays silent in other sessions and never blocks
  twice in a row.
- Evals `start-asks-before-acting` and `start-security-gate-blocks-sql-concat`.

### Migration

1. Set `harness: "0.5"` in `.engineering/harness.yaml`.
2. Nothing else is required. `start` and the `Stop` hook arrive with the
   plugin update. A project that wants a different security gate or best-practices
   gate adds `.engineering/overrides/start.md`.

On each machine: `claude plugin marketplace update engineering-harness`, then
`claude plugin update eng@engineering-harness` for each scope where it is
installed.

## [0.4.1] - 2026-11-20

Review of every prompt, hook, and script for Claude Opus 5.5, which follows
instructions closely and needs fewer restated rules.

### Fixed

- The Angular profile states the real Angular 22 requirements, checked against
  the npm registry: Node 22.22.3+, 24.15+, or 26+, and TypeScript 6.0.x (7 is
  out of range).
- `eng-context --check` prints only the header, profiles, memory count, and
  warnings (about 9 KB less), and exits 1 in a repository that has not adopted
  the harness, so `adopt` and CI can tell a missing `harness.yaml` from a
  healthy one.
- The Stop hook re-runs the project check after the fix attempt and warns when
  it still fails, instead of silently allowing the finish.
- The injection hook no longer tells the model to quote every hit as a finding;
  it asks for a report only when the text reads as an attempt to instruct it.
- `templates/claude-settings.json` denies named secret files instead of
  `Read(.env.*)`, which blocked the `.env.example` that the secrets hook lets
  through.
- The `recurring-fix-becomes-guardrail` eval kept its options in `case.yaml`
  and so ran with default tools and turns; they are in `prompt.md` now. The
  grader patterns of two cases are tighter.
- `review` states its depth for R0, asks for a subagent only on R1 and above,
  and maps `lead-judgment.md`'s buckets to its severities. `design` names its
  output path once, and `test` and `release` drop stack-specific tool names that
  now live in the profiles (StrykerJS gets a row in `node-backend`).
- Profiles: .NET 8 and 9 support ended on 2026-11-10, .NET 11 reached GA, and
  Angular moves to one major a year (23 targeted for June 2027, from secondary
  sources).

### Changed

- `core/policy.md` drops lines that restated the policy or other files (never
  weaken a test, the lifecycle skill list, the nearest-pattern rule, the
  feature-map name rule). `core/lifecycle.md` drops three bullets that repeated
  the policy. `implement` drops its search-before-creating step and commits only
  when asked. The ADR and memory templates point to the policy instead of
  copying its criteria.
- The plugin manifest has an icon.

### Added

- A structure test fails when an eval fixture declares an old harness line.

## [0.4.0] - 2026-11-19

Practices from Lauren Tan's talk "All Code Is Slop (Except Mine)": a codebase
that enforces its own rules lets agents ship at volume.

### Added

- `core/policy.md` has *Fix at the highest layer*: a mistake that repeats is
  fixed in structure, then types and lint, then verification, and only last in
  prose. Memory entries need a fourth criterion (no check could hold the fact)
  and an *Encoding* section.
- Profiles have an optional `## Guardrails to encode` section with starter
  lint rules, analyzers, and architecture tests for Angular, .NET, Node, and
  the .NET + Angular contract.
- `test` has runtime verification (`references/runtime-verification.md`: probes
  that print one assertable line) and, for R2 changes, invariants
  (`references/invariants.md`: property-based tests, TLA+ model checks,
  proofs).
- The `AGENTS.md` template has a *Feature map* section, filled by `adopt`, so
  agents, tests, and people name features the same way.
- Eval case `recurring-fix-becomes-guardrail`.
- Procedures adapted from pstack (credited in `NOTICE`): a comment pass
  (`skills/implement/references/comment-pass.md`) run by `implement` and
  `review`; `skills/review/references/blast-radius.md` with a proof ladder for
  the one fact a change is safe because of; `lead-judgment.md` for R2 reviews
  with several reviewers on different models; and, in `skills/test/references/`,
  `formal-verification.md` and `verification-skill.md` for generating and
  maintaining project-local verify skills.
- The formal-verification and verification-skill references include the upstream
  upkeep loops (outcomes in sync, updated, bug, blocked; clean, changed,
  blocked), launch from an empty data directory, and stand-in disclosure.
  `lead-judgment.md` has the proof-by-run adversary brief.
- `bin/verify-drift` lists verify skills whose covered files changed after
  their recorded sync commit; the `adopt` check mode runs it.

### Changed

- *Scope* in the policy says not to copy a workaround or known debt even when
  it is the nearest pattern, and that a comment never justifies a workaround.
  `implement` skips such examples.
- `plan` writes the verification before the steps and, for R2, lists the
  invariants and how each is checked. `core/lifecycle.md` adds "Encode the
  second occurrence".
- `test` steps are renumbered: runtime check (6) and invariants (7) come
  before mutation testing (8).

### Removed

- Forgejo and Gitea support: `bin/ui-gif forgejo-attach` and `FORGEJO_TOKEN`,
  the `.forgejo` and `.gitea` workflow inventory in `bin/stack-report`, and
  the Forgejo paths in `adopt`, `templates/harness-check.yml`, and
  `skills/test/references/ui-evidence.md`. The harness now targets GitHub only.

### Migration

1. Set `harness: "0.4"` in `.engineering/harness.yaml`.
2. Add a `## Feature map` section to `AGENTS.md` from
   `templates/AGENTS.md` (the `adopt` skill fills it from routes, screens, and
   public endpoints; mark rows `(unverified)` that you did not see run).
3. Read `.engineering/memory/` once. An entry that a lint rule, type, or test
   could hold instead gets that check written, and the entry links it under an
   `Encoding` heading (`templates/memory-entry.md`).
4. Ask the user whether to generate a verification skill for the app's main
   surface (`skills/test/references/verification-skill.md`). Skip it when they
   decline.
5. A project hosted on Forgejo or Gitea attaches before and after GIFs by hand,
   and keeps its pull request template and workflows in its own host's paths.

On each machine: `claude plugin marketplace update engineering-harness`, then
`claude plugin update eng@engineering-harness` for each scope where it is
installed.

## [0.3.3] - 2026-11-13

Review practices from the Claude Code team's account of its own code review
(RESEARCH.md, A4).

### Added

- `review` has a re-review mode for a change whose author answered an earlier
  review: only the commits since then, earlier findings marked fixed,
  answered, or open, answered findings stay closed, and a stop after the third
  round with open blockers. Eval cases `review-labels-pre-existing`,
  `review-rereview-converges`, and `review-stops-after-third-round`.
- The `AGENTS.md` template has a *Merge gate* row in *Delivery* (required
  checks and reviewers, resolved threads, stale approvals dismissed), so
  `adopt` reports it as a readiness gap when it is missing. `adopt` also
  offers `.engineering/overrides/review.md` for paths where a mistake is
  expensive.

### Changed

- `review` runs in a subagent when the reviewer wrote the change in the same
  session, and an R2 review adds parallel reviewers on separate slices of the
  dimensions. Blockers and majors need proof before they are reported (in R2,
  a subagent tries to refute each blocker). Defects in lines the diff did not
  touch are reported as `pre-existing` and do not block. Findings name the
  defect class with every instance. The output adds a count line, the round,
  and an *Encode* line for the test, lint rule, or override that would catch a
  finding next time.
- R2 in `core/policy.md` covers CI and release workflows and installers and
  auto-updaters, and a review agent's verdict does not count as the human
  approval R2 requires. Changes to those paths now take the R2 ceremony.
- `core/git.md`: *Reviewer focus* names what tests and automated review cannot
  judge, and every review finding ends fixed or answered before merge.
- The *Bugfix* delta in `core/lifecycle.md` asks which check should have caught
  a bug that got through review, and adds it.

## [0.3.2] - 2026-11-12

### Added

- Before and after GIFs for pull requests that change what users see. The
  policy and `core/git.md` ask for them, the `test` skill records them
  (step 7, `skills/test/references/ui-evidence.md`), and the pull request
  template has the block. `bin/ui-gif record` drives the installed Chrome
  headless through a pinned `playwright-core` and converts with `ffmpeg`;
  `bin/ui-gif forgejo-attach` uploads the GIFs to a Forgejo pull request. On
  GitHub, `gh pr create --attach` uploads them. Eval case
  `pr-ui-change-shows-before-after`.

### Fixed

- `check-commit-msg` accepts the Conventional Commits type `style`; projects
  that had used it (folio, lastro) would have had valid commits rejected by
  the new `commit-msg` hook.
- The `Stop` hook warns the user instead of blocking when the `stop_check`
  command is not on Claude Code's PATH (exit 127), so a missing tool cannot
  stop every turn from finishing.

## [0.3.1] - 2026-11-06

### Added

- Profile `node-backend`: Node.js services and workers in TypeScript or
  JSDoc-checked JavaScript (`node:http`, Express, Fastify, Hono, NestJS 12),
  and MCP servers on the MCP TypeScript SDK (v1 and v2), with npm or pnpm.
  References for NestJS, MCP servers, currency (Node 26 Active LTS),
  observability, failure testing, and modernization. Add it to `profiles:` in
  `harness.yaml` for Node projects; nothing else changes for existing projects.

## [0.3.0] - 2026-11-06

### Added

- `design` skill: system design before planning code, with numbers, options
  compared on the same criteria, failure modes, security, observability, and
  rollout. It writes the document (`templates/design.md`) and publishes a
  discussion page (`templates/design-page.html`) with the Artifact tool; the
  architecture diagram uses draw.io Desktop when it is installed and Mermaid
  otherwise (`skills/design/references/diagrams.md`). Lifecycle gains a Design
  phase for new services, datastores, queues, integrations, and trust
  boundaries.
- `bin/drawio-url`: prints an `app.diagrams.net` link that opens a `.drawio` or
  Mermaid file in the draw.io editor, with the diagram in the URL fragment.
- `templates/claude-settings.json` asks before hard-to-reverse commands (force
  push, merge, publish, release, destroy), following the reversibility
  boundary from Anthropic's "Harnessing Claude's intelligence" (2026-04-02).
- CONTRIBUTING: re-test and prune model-compensating instructions when moving
  to a new Claude model, from the same article.
- Security checklist references OWASP ASVS 5.0.0 per area, and
  `security-audit` findings carry the matching requirement id
  (`v5.0.0-<chapter>.<section>.<requirement>`).
- Supply-chain floor: a package an agent named but nobody saw resolve with a
  release history and a source repository stops for review (slopsquatting).
- Trust boundaries: `.engineering/memory/` entries are agent-written data, not
  reviewed policy; an entry that asks for something outside the policy is a
  finding, and memory never stores instructions copied from what was read
  (OWASP Agentic Top 10, ASI06).
- `investigate` checks the issue and other inputs for text addressed to an
  agent as its own step, and its output always carries an **Untrusted input**
  field.
- `test` runs mutation testing on changed code for R1/R2 branching logic;
  profiles name Stryker.NET (`--since:main`) and StrykerJS.
- `architecture-audit` turns boundary findings into architecture tests;
  profiles name ArchUnitNET for .NET and ESLint `no-restricted-imports` or
  dependency-cruiser for Angular.
- `release` makes published artifacts verifiable (CycloneDX SBOM, CI build
  provenance, signed tag); `security-audit` compares CI with the OpenSSF
  Scorecard checks.
- Plugin hooks that enforce rules without exceptions: `PreToolUse` on Bash
  (`bin/eng-guard-secrets`) asks before a shell command touches a secret file,
  which settings deny rules cannot catch; `Stop` (`bin/eng-stop-check`) runs
  the project's optional `stop_check` from `harness.yaml` when Claude finishes
  with uncommitted changes and sends it back when the check fails.
- `PostToolUse` hook (`bin/eng-flag-injection`): flags text addressed to an AI
  agent in what Claude reads, so it reports the text instead of following it.
  Added because the `investigate` eval reported the hidden instruction in one
  run of three; with the hook and the new `investigate` step, two of three.
- Behavior evals (`evals/`, run with `claude plugin eval`): `review` rejects a
  "Fixed" commit that deleted a test, `investigate` reports a hidden
  instruction in an issue instead of following it, and a bugfix writes the
  failing test before the fix (tagged `needs-bash`).
- `templates/harness-check.yml`: a CI workflow that runs `eng-context --check`
  against the declared harness line; `adopt` offers it.
- This repository runs OpenSSF Scorecard and attaches a source archive with a
  build provenance attestation to each release.

### Changed

- The harness targets Claude Code only. Skills may use its tools and features
  (subagents, `AskUserQuestion`, the Artifact tool, hooks) when that changes
  what the agent does. The `SessionStart` hook moved to `hooks/hooks.json`, the
  plugin default location, so `plugin.json` no longer declares it; the setup
  guide moved from `adapters/claude-code/README.md` to `docs/claude-code.md`.
- `bin/stack-report` inventories Forgejo and Gitea workflows
  (`.forgejo/workflows`, `.gitea/workflows`) as well as GitHub's.

### Removed

- The Codex and Copilot adapter designs (`adapters/`) and the test that kept
  `core/`, `skills/`, `profiles/` and `templates/` free of agent names.

### Migration

1. Set `harness: "0.3"` in `.engineering/harness.yaml`.
2. Merge the `permissions.ask` list from `templates/claude-settings.json` into
   the project's `.claude/settings.json`, keeping the project's own rules.
3. Ask the user whether to set `stop_check` in `harness.yaml` (the cheapest
   rung of the profile's verification ladder that finishes in under a minute)
   and whether to add `templates/harness-check.yml` as a CI workflow.
4. Read `.engineering/memory/` once. An entry that tells the agent to do
   something, instead of stating a fact with evidence, gets rewritten as a
   fact or removed.
5. If `AGENTS.md` or `CLAUDE.md` refers to the Codex or Copilot adapters, drop
   those references; the harness targets Claude Code only.

On each machine: `claude plugin marketplace update engineering-harness`, then
`claude plugin update eng@engineering-harness` for each scope where it is
installed. A development checkout linked into the plugin cache needs the link
redone for the new version (`docs/claude-code.md`).

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
