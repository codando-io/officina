---
name: dependency-update
description: Update dependencies safely and in batches - packages (NuGet, npm), SDK and framework versions, Docker base images, and CI actions - with a supply-chain floor, one verification pass, and fix-forward. Also handles platform upgrades (e.g. .NET or Angular major) as separate planned changes. Use when asked to update, bump, or audit outdated or vulnerable dependencies, to consolidate Dependabot/Renovate PRs, or to upgrade the platform.
---

# Dependency update

Keep the project current without letting a malicious or breaking package in.
Batch compatible updates, verify once, fix forward. Treat every new package
version as untrusted until it passes the floor.

## Before you start

- If `.engineering/overrides/dependency-update.md` exists, read it and apply it
  (pinned versions, blocked packages, update cadence).
- Read each active profile's `PROFILE.md` and `references/currency.md` for the
  stack's commands, support windows, and pitfalls.
- Start from a clean working tree on a new branch, with the test suite green.
  If it is not green before you start, stop and report; do not mix repairs with
  updates.

## Modes

- **batch** (default): minor and patch updates across all ecosystems, plus
  consolidation of open bot PRs.
- **security**: only vulnerable packages, smallest fixing version.
- **platform**: SDK/runtime/framework major (e.g. .NET 8 → 10, Angular 19 → 21),
  base images, build toolchain. Always its own change, with a plan.
- **major**: one major bump of one library. Its own change.

## Procedure

1. **Inventory.** Run `$HARNESS/bin/stack-report` (it prints outdated,
   vulnerable, and deprecated packages, SDK and image versions, unpinned
   actions), then any ecosystem commands the profiles add. Record the output.
2. **Classify** each candidate: patch/minor/major, security fix or not, direct or
   transitive, runtime or dev-only.
3. **Supply-chain floor.** Apply `$HARNESS/core/security.md` §4 to every
   package that changes version or is new. For anything unusual, read the
   release notes and the package diff. Any failure stops that package and goes
   to the report as a finding.
4. **Apply the batch** for the chosen mode. Respect central package management
   and lockfiles. Do not hand-edit lockfiles.
5. **Verify once**: restore, build with warnings visible, full test suite, and
   the frontend build and tests. Compare warnings before and after: new
   obsolete/deprecated warnings are findings.
6. **Fix forward.** If something breaks, fix it in the batch when the fix is
   small and clearly caused by the update. Otherwise pull that package out of the
   batch, record why, and continue. Do not hold the whole batch for one package.
7. **Platform and major modes** additionally: read the official migration and
   breaking-change documentation for the target version before changing
   anything, list the breaking changes that apply to this codebase with
   evidence, and plan them through `plan`.
8. **Bot PRs.** When consolidating Dependabot/Renovate PRs, reference each one
   in the batch description. Leave the ones you did not include in a clean state
   with a comment explaining why.

## Output

```markdown
## Dependency update: <mode>, <date>

| Package | Ecosystem | From | To | Type | Reason | Status |
|---|---|---|---|---|---|---|

**Supply-chain floor**: passed for N packages; findings: ...
**Verification**: commands and results; warnings before/after
**Held back**: package, reason, follow-up
**Breaking changes applied** (platform/major): item, evidence, change
**Reversibility**: usually R1 (revert the lockfile); R2 if a migration or data format changed
```
