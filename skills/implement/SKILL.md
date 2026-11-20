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
- **Bugfix: test first** (`test`, step 3).

The policy's *Scope* and *Security floor* sections apply throughout. This skill
adds the procedure.

## Procedure

1. **Find the pattern to copy.** For each new piece (endpoint, handler,
   component, query, test), locate the nearest existing example in this
   repository and follow its structure, naming, error handling, and test style.
   Skip examples that are themselves workarounds (policy, *Scope*). Name the
   example you followed.
2. **Work in verifiable steps.** After each step, run the cheapest check that can
   fail: build the affected project, run the targeted test. Fix before moving on.
3. **Stop on a contract change.** If the change turns out to need a breaking
   change to an API, schema, event, or config key that the plan did not list,
   stop and confirm: it is R2.
4. **A failing existing test is information.** Either your change is wrong, or
   the test encodes behavior the plan explicitly changes. Say which, with
   evidence, before touching the test.
5. **Security and telemetry as you go.** Parameterize queries, validate input at
   boundaries, add the telemetry the plan lists (`$HARNESS/core/security.md`,
   `$HARNESS/core/observability.md`).
7. **Finish clean.** No debug output, unused imports, or temporary files. Run
   the comment pass (`references/comment-pass.md`) on the diff.

## Check the diff against the plan

Read the full diff (`git diff` and untracked files) before declaring the work
done:

- Every changed file is in the plan's "files to change", or you explain why.
- No file from "files not to change" was touched.
- No unrelated formatting or renames.
- Every step's verification ran and passed.

## Output

- The diff. When the user has asked for commits, small ones following
  `$HARNESS/core/git.md`; otherwise leave the change uncommitted.
- A short report: what changed (per file), the pattern each piece followed,
  verification commands and results, deviations from the plan and why, anything
  left undone.

Then hand off to `test` for the evidence pass and `review` for the diff review.
