---
name: test
description: Produce test evidence that a change works - identify the changed behavior, the test that proves it, the regression test, the existing suites to run, and the right level (unit, integration, e2e); then write and run them. Use after implementing, when fixing a bug (test first), or when asked whether something is tested. A passing build is never accepted as proof.
---

# Test

Tests are evidence. The question is not "do tests pass?" but "which test would
fail if this change were wrong, and did it run?".

## Before you start

- If `.engineering/overrides/test.md` exists, read it and apply it.
- Read each active profile's *Verification ladder* for the stack's test commands,
  and `AGENTS.md` for the project's own.
- Find how the project already tests similar code: framework, fixtures,
  builders, test containers, mocks policy. Follow it.

## Procedure

1. **Name the behavior that changed.** One line per behavior, from the user's or
   caller's point of view (input → observable result). If you cannot name it,
   you do not know what to test. Then open `references/failure-scenarios.md`,
   find the rows whose *Mandatory when* matches this change (a new consumer, a
   new editable entity, a migration, a retry policy...), and add each one as a
   behavior. A triggered scenario you do not test needs a one-line reason.
2. **Pick the level for each behavior** with the cheapest level that can fail
   for the real reason:
   - unit: pure logic, branching, mapping, validation;
   - integration: anything whose correctness depends on the database, the
     framework pipeline (routing, model binding, auth, serialization, DI),
     messaging, or file system - use real dependencies (e.g. test containers,
     in-memory host) over mocks where the project allows;
   - e2e: only for critical user journeys that lower levels cannot cover.
   Failure scenarios (concurrency, crashes, duplicates, slow dependencies) are
   usually integration tests against real dependencies.
3. **Write the test so it fails first.** For bugs, run it against the unfixed code
   and record the failure. For new behavior, make sure the assertion would fail
   if the feature returned a wrong or empty value.
4. **Assert observable results** with literal expected values. Avoid asserting
   internal calls unless the interaction is the behavior (e.g. "sends one email").
5. **Run in order of cost**: the new tests, then the tests of the touched module,
   then the full suite or the CI-equivalent command. Record each command and its
   result summary.
6. **Check what is not covered.** Name any behavior you could not test and why,
   and what manual or runtime check stands in for it.

## Rules

- The policy forbids weakening tests. When an existing test must change because
  the plan changes that behavior on purpose, cite the plan line.
- A flaky test is a finding, not something to retry until green.
- Snapshot updates need a reason per snapshot.
- Coverage percentage is not evidence of correctness; the behavior list is.

## Output

```markdown
## Test evidence: <change>

| Behavior | Test | Level | Failed before? | Result |
|---|---|---|---|---|
| ... | `path::name` | integration | yes (output) | pass |

**Commands run**
- `<command>` -> <summary: N passed, 0 failed, duration>

**Failure scenarios**: triggered catalog rows, each tested or not applicable (why)
**Not covered**: behavior, why, and what stands in for it
**Verdict**: verified / partially verified / not verified
```
