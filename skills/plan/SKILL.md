---
name: plan
description: Turn an investigation into a concrete, verifiable implementation plan grounded in the real code - files to change and not to change, steps, tests, observability, security, rollback, and Definition of Done. Use after investigate and before implementing a non-trivial change, or when asked to plan, scope, or estimate a change. Not for trivial R0 edits where a one-sentence plan suffices.
---

# Plan

Produce a plan that a reviewer can check against the eventual diff. Every line
must point at real code found during investigation. A plan that could apply to
any repository is not a plan.

## Before you start

- If `.engineering/overrides/plan.md` exists, read it and apply it.
- You need an investigation (from `investigate` or equivalent evidence in the
  conversation). If key facts are missing, investigate them first; do not plan
  on assumptions.
- Read `$HARNESS/core/lifecycle.md` and pick the change type: feature, bugfix,
  refactor, migration, dependency. Apply its deltas.
- Read each active profile's `PROFILE.md` (paths in the session context) for
  commands and stack pitfalls.

## Procedure

1. Classify reversibility (R0/R1/R2). This sets the depth of every section below.
2. Decide the smallest coherent change. If the work is large, split it into
   increments that each end in a verifiable, shippable state, and plan only the
   first in detail.
3. List files to change with the reason for each. List files that must **not**
   change (contracts, shared modules, generated code, tests that define the
   expected behavior) so the diff can be checked against it.
4. Order the steps so each one can be verified before the next. Put preparatory
   refactors first, as separate steps with their own verification.
5. Define tests as evidence: which behavior, which test proves it, which level
   (unit, integration, e2e) and why that level. Include the regression test for
   bugs.
6. Decide observability and security work using the policies. "None needed" is
   fine with a reason.
7. Write rollback for R1 and R2. For R2, also the approval point and, for data,
   the expand-contract phases.
8. Check whether the decision deserves an ADR (policy §Memory and decisions). If
   yes, draft it with `$HARNESS/templates/adr.md` as part of the plan.
9. Write the Definition of Done as checkable statements.

## Output

```markdown
## Plan: <title>

**Problem**: one or two sentences
**Evidence**: the facts from investigation this plan relies on (file:line, command output)
**Change type / reversibility**: e.g. bugfix / R0
**Architecture impact**: layers and modules touched; new dependencies; contract changes (or "none")

**Files to change**
- `path` - what and why

**Files not to change**
- `path` - why it must stay as is

**Steps**
1. ... (verification: command or check)

**Tests**
- Behavior -> test (level) -> how to run it
- Existing tests to run: ...

**Observability**: spans/metrics/logs to add or confirm, or "none" and why
**Health signal after deploy**: what to check, where, and what "healthy" looks like
**Security**: concerns and mitigations, or "none on this path" and why
**Rollback**: how to undo each step (required for R1/R2)
**ADR**: needed? draft link or "no" and why

**Definition of Done**
- [ ] The failing case now passes: <command>
- [ ] <existing suite> passes
- [ ] Diff touches only the files listed above
- [ ] ...

**Risks and open questions**
```

Keep plans in the conversation or the PR description. If the work spans
sessions, save the plan to `.engineering/work/<slug>.md` (not committed) so the
next session can resume it.
