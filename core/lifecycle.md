# Task lifecycle

One lifecycle for every change. Change types only add deltas. Read this when
planning; the summary in `policy.md` is enough for small changes.

```text
Understand ─► Plan ─► Implement ─► Verify ─► Review ─► Ship ─► Observe ─► Learn
investigate   plan    implement    test      review    release observability memory/ADR
     ▲                                │         │                  │
     └──────── evidence contradicts the hypothesis ────────────────┘
```

## Phases

| Phase | Skill | Exit artifact | Scale down when |
|---|---|---|---|
| Understand | `investigate` | Investigation report | The cause and location are already proven (e.g. a failing test points at one line): one sentence |
| Plan | `plan` | Plan with files, tests, rollback, Definition of Done | R0 with an obvious shape (roughly under 30 changed lines): one sentence |
| Implement | `implement` | Diff that matches the plan | Never skipped. Bugfix: the failing test comes first (`test` step 3) |
| Verify | `test` | Behavior → test → command → result | Never skipped. R0: the targeted test and its result, one line |
| Review | `review` | Claims ledger + findings on the real diff | R0: read your own full diff against the plan and say so. R1/R2: full review |
| Ship | `release`, or the project's deploy path | Merged change with green CI on that SHA; tag when releasing | The project ships on merge: merging is shipping |
| Observe | `observability` (post-deploy mode) | The health signal checked in the target environment | No runtime behavior changed. Usually after deploy, by the human or a later session |
| Learn | memory / ADR | Memory entry or ADR | Nothing met the memory or ADR criteria: say nothing |

## R0 fast path

Most changes are small and reversible. For those, the whole lifecycle is one
pass and one report:

1. Locate the cause or the place to change, with evidence.
2. Bugfix: write the test that reproduces it and watch it fail.
3. Make the change, following the nearest existing pattern.
4. Run the targeted test and the module's tests.
5. Read your own full diff.
6. Report in one message: what changed, the commands you ran and their results,
   and the risk class. If the change later turns out bigger or riskier than R0,
   stop and switch to the full lifecycle.

## Rules that hold across phases

- **Scale ceremony to reversibility.** R0: fast path. R1: rollback written in the
  plan. R2: every phase, human approval before Ship, ADR when it is a decision.
- **Loop back on contradiction.** If a test, log, or measurement contradicts the
  investigation, return to Understand. Do not bend the evidence to fit the plan.
- **One change type per diff.** Do not mix a refactor with a behavior change. If
  you need both, do the refactor first, verify, then the behavior change.
- **Fast feedback first.** Run the cheapest check that can falsify your change
  (targeted test, build of one project) before the expensive one (full suite, e2e).
  The profile's *Verification ladder* lists the order for each stack.
- **Deploy is a human decision.** Prepare and verify; do not trigger a production
  deploy on your own.
- **Close the loop.** A plan or release names the health signal that shows the
  change working. After deploy, someone checks it (`observability`, post-deploy
  mode). A change nobody looked at in production is shipped, not done.

## Deltas by change type

### Feature

- Plan names the observable behavior and how a user or client sees it.
- New server behavior needs telemetry following the project's conventions.
- Put risky features behind the project's feature-flag mechanism if one exists.
  Do not introduce a flag system just for one change.
- Contract changes (API, events, DB) are additive by default. Breaking changes
  are R2.

### Bugfix

- Reproduce first. Write a test that fails for the reported reason before
  changing the code. If a test is impractical, record the manual reproduction
  steps and output.
- Fix the root cause, not the symptom. A null check that hides the crash is not
  a fix unless null is a legitimate state; say which.
- Keep the failing test as the regression test.
- Look for the same defect pattern in sibling code; report other instances,
  fix them only if in scope.

### Refactor

- Behavior must not change. Prove it: the relevant tests pass before and after,
  unchanged. If coverage is missing, add characterization tests first, in a
  separate commit.
- No behavior changes, dependency upgrades, or formatting sweeps in the same diff.
- Public API signatures stay unless renaming them is the point of the refactor;
  then migrate all callers and delete the old API in the same wave.

### Migration (schema, data, platform, pattern)

- Use expand-contract:
  1. **Expand**: add the new shape alongside the old (new column, new table, new
     API version, new code path). Deploy. Nothing breaks.
  2. **Migrate**: move readers and writers, backfill data in batches that can be
     paused and resumed. Verify counts and invariants.
  3. **Contract**: remove the old shape only after nothing uses it, in a separate
     deploy. This step is R2.
- Every phase has its own rollback. Destructive steps (drop, delete, rename in
  place) never ship in the same deploy as the code that stops using them.
- Measure before and after on realistic data volume when performance can change.
- Pattern migrations (e.g. old framework idiom → new) track coexistence
  explicitly: list the remaining old call sites and the target date or version.
- Modernize for a reason: a security fix, a removed API, a bug class, a real
  maintenance cost. "It is newer" is not a reason. Migrate a vertical slice,
  verify, continue. Commit tool-generated changes (analyzer fixes, schematics)
  separately from manual edits. Stalled coexistence is worse than either state:
  finish or revert.

### Dependency

- Use the `dependency-update` skill. Major versions and platform upgrades (SDK,
  framework major) are separate changes with their own plan.

### Release

- Use the `release` skill. Only when a human asks for it.
