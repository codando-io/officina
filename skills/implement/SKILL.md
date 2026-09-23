---
name: implement
description: Implement a planned change with the smallest coherent diff that follows existing patterns and architecture, verifying each step and checking the final diff against the plan. Use when executing a plan or making a scoped code change. Not for exploring an unknown problem (use investigate) or reviewing someone else's diff (use review).
---

# Implement

Write the change so that it looks like the best existing code in this
repository, does exactly what the plan says, and nothing else.

## Before you start

- If `.engineering/overrides/implement.md` exists, read it and apply it.
- Have a plan: from `plan`, or a one-sentence plan for an R0 change. If you
  cannot state which files you will change and how you will verify it, go back
  to `plan`.
- Check `.engineering/memory/INDEX.md` for gotchas in the area.
- **Bugfix: test first.** Write the test that reproduces the bug and run it
  against the unchanged code (`test`, step 3). Record the failure. Only then
  change the code.

The policy's *Scope* and *Security floor* sections apply throughout. This skill
adds the procedure.

## Procedure

1. **Find the pattern to copy.** For each new piece (endpoint, handler,
   component, query, test), locate the nearest existing example in this
   repository and follow its structure, naming, error handling, and test style.
   Name the example you followed.
2. **Search before creating.** Before adding a helper, service, interface, base
   class, or utility, search for one that already does the job. Add a new
   abstraction only when two concrete uses need it now, or the plan says why.
3. **Work in verifiable steps.** After each step, run the cheapest check that can
   fail: build the affected project, run the targeted test. Fix before moving on.
4. **Stop on a contract change.** If the change turns out to need a breaking
   change to an API, schema, event, or config key that the plan did not list,
   stop and confirm: it is R2.
5. **A failing existing test is information.** Either your change is wrong, or
   the test encodes behavior the plan explicitly changes. Say which, with
   evidence, before touching the test.
6. **Security and telemetry as you go.** Parameterize queries, validate input at
   boundaries, add the telemetry the plan lists (`$HARNESS/core/security.md`,
   `$HARNESS/core/observability.md`).
7. **Finish clean.** No debug output, unused imports, or temporary files.

## Check the diff against the plan

Read the full diff (`git diff` and untracked files) before declaring the work
done:

- Every changed file is in the plan's "files to change", or you explain why.
- No file from "files not to change" was touched.
- No unrelated formatting or renames.
- Every step's verification ran and passed.

## Output

- The diff, as small commits following `$HARNESS/core/git.md`.
- A short report: what changed (per file), the pattern each piece followed,
  verification commands and results, deviations from the plan and why, anything
  left undone.

Then hand off to `test` for the evidence pass and `review` for the diff review.
