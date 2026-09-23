---
name: release
description: Cut a release when explicitly asked - derive the version from the change classification, verify CI is green on the exact SHA, update the changelog, create an annotated tag, and produce release notes plus a deploy and rollback checklist. Never cuts a release nobody asked for and never rewrites published tags.
disable-model-invocation: true
---

# Release

Run this skill only when the user explicitly asks for a release. Never start it
on your own initiative.

A release is a promise to everyone downstream. Cut it only when a human asks,
only from a verified SHA, and with a version number that tells the truth about
the changes.

## Before you start

- If `.engineering/overrides/release.md` exists, read it and apply it (version
  scheme, changelog format, release tooling, environments).
- Confirm what is being released: which repository or package, from which
  branch, and whether this project versions at all. Many applications ship on
  merge and only need the deploy checklist; say so if that is the case.
- Read `AGENTS.md` *Delivery* for environments, staging, feature flags, and the
  rollback mechanism. If rollback is not possible for this project, say so
  before anything else: that is the first problem to fix.

## Procedure

1. **Collect changes** since the last tag: `git log <last-tag>..HEAD`, merged PRs,
   and the changelog's unreleased section.
2. **Classify each change**: fix, addition, breaking, internal. Breaking includes
   API contract changes, removed config keys, DB changes that need coordinated
   deploys, and behavior changes clients will notice.
3. **Derive the version** from the classification (SemVer; in 0.x breaking
   bumps minor). If the user asked for a number that contradicts the
   classification, show the conflict and ask. Never bump silently.
4. **Gate on CI.** Find the CI run for the exact SHA to be tagged. It must be
   complete and green, not pending, skipped, or from a different SHA. If CI is
   not green, stop.
5. **Check release prerequisites** for the risk involved:
   - migrations: expand-contract phase, can the previous app version run against
     the new schema?
   - feature flags for risky changes, and their default state;
   - staging verification done, with evidence;
   - observability: which signal will show the release is healthy.
   List what is missing; missing items for R2 changes block the release.
6. **Update the changelog** (move unreleased entries under the version with the
   date) and version files, in one commit following `$HARNESS/core/git.md`.
7. **Create an annotated tag** `vX.Y.Z` on that commit only after its CI is green.
   Never move, delete, or recreate a published tag; fix forward with a new
   version.
8. **Prepare, do not execute, the deploy.** Pushing tags, publishing packages,
   and deploying are outward-facing: show the exact commands and wait for
   explicit confirmation.

## Output

```markdown
## Release vX.Y.Z

**Version rationale**: classification -> bump
**SHA**: <sha>, CI: <link or run id> green
**Changes**: grouped by fix / added / breaking, with PR references
**Breaking changes and migration notes**
**Deploy checklist**: steps, order (e.g. DB expand before app), flags
**Health signal**: what to watch after deploy and for how long
**Rollback**: exact steps; what cannot be rolled back
**Commands awaiting confirmation**: git push --follow-tags, publish, deploy
```
