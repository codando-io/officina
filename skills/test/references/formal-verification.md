# Formal verification skill

A test checks the cases someone thought to write. A model checker, verifier, or
proof checks every case in a stated scope: every order of steps in a model,
every input up to a bound, or every input. Use this when concurrency, retries,
state machines, parsers, or unsafe code carry a promise that tests rarely reach.
The product is one project-local skill that lets the next agent check a change
against that promise. Write it for an agent who reads it cold, mid-change.
Run it only when the user asks; `invariants.md` covers the cheaper checks.

## 1. Choose the target from the code

A good target is a promise the code makes, where a break harms users and
tests rarely reach the case that breaks it. Take the strongest one in the
repository, not the easiest to verify. If the user named an area or a bug,
start there. Ask only what you cannot observe.

## 2. Let the question choose the tool

| Question | Tool |
|---|---|
| Can events happen in a bad order? | A model checker over a small model of the design; TLA+ is the default in any language |
| Does the code behave for every input (memory safety, overflow, a data-structure invariant)? | A verifier that runs on the code |
| Must it hold at every size, where a bound is not enough? | A proof assistant |
| No verifier runs on this language | Generated inputs against the real code, not a hand model of it |

Prefer a tool the project's developers can install and run, and tell the user
why you chose it.

## 3. What makes it good

- **True to the code.** Each part of the model or proof points at code a
  reviewer can open. An indivisible step in the model is an indivisible step in
  the code. Names come from this repository.
- **Able to fail.** Show each property failing on a broken variant of the code it
  guards (a removed check, a reordered step). A check never seen failing proves
  nothing.
- **Findings stay findings.** When the code breaks the property, report the
  counterexample in the code's terms. Do not weaken the property or the model
  until it passes, and do not change product code unless asked.
- **Honest scope.** State what is verified, under which bounds and assumptions,
  and what is left out. A pass covers the model or the bound.
- **Readable without the tool.** The property and the harm, one plain sentence
  each; a counterexample as a short sequence of steps in the code's words.
- **Cheap to rerun.** One command, a pinned tool version, a run short enough to
  use on every relevant change.

## 4. Generate the skill

Write `.claude/skills/verify-<area>/SKILL.md` with frontmatter (without it the
skill never registers) that names the area and when to use it. From the skill
alone, the next agent must tell whether a change touches the verified code, run
the check, tell a real bug from a modeling error, and update the verification
when a change is intended. Use this repository's real commands and paths.

The skill carries two lines that `$HARNESS/bin/verify-drift` reads:

```text
Covers: src/billing/ledger.ts, src/billing/retry.ts
Sync commit: 3f9c2ab
```

`Covers` lists the files and directories each check describes. `Sync commit` is
the commit at which the check was last confirmed to match them. The next agent
moves it forward only after confirming the verification describes the code at
the new commit.

## 5. Prove it before handing off

Follow the generated skill once, as the next agent would, on a scratch change
that breaks the property in the real code. It must catch the break. Then drop
the scratch change and confirm the check is back where it started. A verify
skill that was never run is a draft.

## 6. Hand off

What you verified, the tool and why, the bounds, what it found in plain words,
the command to rerun it, what it does not cover.

## Keeping it honest

A formal check proves a property of what it describes. When the code changes
and the verification does not, the check can keep passing on code that no
longer exists, and that pass looks like a proof. This loop handles the changes
that skipped the verify skill: merges, edits made without it, and drift across
many commits. Run it only when the user asks, or when `adopt` reports drift.
`$HARNESS/bin/verify-drift` lists the verify skills whose covered files changed
after their sync commit.

**Outcome per check**, and say which:

- **in sync**: no change since the sync commit alters what the check
  describes, and it passes.
- **updated**: the code changed, the verification now describes the new code,
  and it passes.
- **bug**: the verification describes the current code, and the code breaks the
  property. That is a finding about the code, not drift. A check can be both
  updated and bug.
- **blocked**: it could not be brought back in line or could not run. Say why.

**Edit scope.** Edit only the verification (models, harnesses, property files,
the verify skill). Never edit product code unless the user asks. When a property
fails on the current code, do not weaken the property or the model; report it.

**Pass**

1. **Find the checks.** Read each project skill that runs a model checker, a
   prover, or a verifier against named code. Collect the property, the covered
   code, the bounds and assumptions, the command, and the sync commit. With no
   verify skill, stop and offer to generate one (sections 1 to 6). With no sync
   commit recorded, use the last commit that changed the verification files and
   say so.
2. **Run it as it is** before changing anything, and record the result. A pass
   shows that the old description still holds, not that the code is correct. A
   failure is drift or a bug; decide in step 5.
3. **Read every change to covered code**: diff from the sync commit, and read
   each commit message. Follow code that moved (a covered function renamed,
   split, or relocated is still covered) and new code that writes the state a
   check guards. Classify each change:
   - *No effect*: it alters nothing the verification describes. Check that
     against the model, not the commit message.
   - *The verification no longer describes the code*: a step that was
     indivisible is now two, a branch appeared, a check moved, a new path
     reaches the guarded state, a value has a new range. The model changes.
   - *The promise changed on purpose*: evidence says so (doc comment, tests,
     changelog, commit message). The property changes, and you cite it.
   - *The promise may be broken*: no evidence says it changed. A failure that
     follows is a bug candidate.
4. **Update from the code, not from the result.** Change the model so each
   changed part points at code a reviewer can open, and one indivisible step in
   the code stays one step in the model. Write the update before you rerun. Change
   a property only for a promise that changed on purpose, and record the old
   wording, the new wording, and the evidence. Keep the bounds unless the change
   makes them wrong, and say if you reduce one.
5. **Rerun and judge.**
   - *Pass*: a description that lost the ability to fail also passes. Break the
     new code the way the property guards against, confirm the check catches
     it, then drop the break.
   - *Fail*: replay the counterexample against the real code, step by step. If a
     step cannot happen, the verification is wrong: fix it and say what was
     wrong. If every step can happen, it is a bug: name the commit that
     introduced it, tell the counterexample in the code's words, and state the
     harm in one sentence. A cheap reproduction against the real code goes in the
     report as evidence, not in the product code.
6. **Update the verify skill**: covered code, commands, bounds, assumptions, and
   the sync commit, set to the commit you checked. A blocked check keeps its old
   sync commit. Then follow the verify skill once as the next agent would.

**Report** per check: the outcome and the commits read; what changed in the
verification and why (the code changed shape, or the promise changed, with
evidence); the rerun result and the break that showed it can still fail; each bug
in plain words; what the verification still does not cover. Say which failures
were drift and which were bugs, and say when an old pass was on a stale
description. Put the verification updates in their own change, apart from any
product fix.
