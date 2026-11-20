# Comment pass

Agents read comments as instructions and copy the workarounds they explain. A
comment that justifies a hack keeps the hack alive, and it goes stale while the
code underneath changes. Run this pass on the diff before you call the work
done, and on the changed files in `review`.

## What to remove

- Narration of what the next line does, section banners, commented-out code.
- A long explanation of why a workaround is fine (`fine for now`, `too risky to
  change`, `IMPORTANT: do not touch`). The explanation is the finding: the
  workaround is the defect, and the comment is its confession.
- A lint or compiler suppression (`eslint-disable`, `@ts-ignore`,
  `#pragma warning disable`, `[SuppressMessage]`). Look up the rule. When it
  catches real bugs or protects correctness or safety, remove the suppression
  and fix the code. Keep it only when the rule is wrong for this line, and say
  so in the suppression's reason field.

## What may stay

Only these, and when you are unsure a case applies, it does not:

- license or legal headers;
- behavior forced by an external system we cannot change (a vendor bug, a
  protocol quirk), proven true today on a live path;
- doc comments that define a public API contract;
- a link to an issue or RFC that explains a constraint the code cannot express.

A surprise in our own code never qualifies. Reshape it (rename, extract, add a
type, move the logic) so the behavior is obvious without prose.

## Procedure

1. Scope: the diff against the base, plus the files it touches.
2. Run the pass in a read-only subagent when the diff is large or you wrote the
   change in this session. It reports; it never edits application code.
3. For each comment that claims a constraint (`do not remove`, `ask X before
   changing`), read the code it points at, and `git log -S` the comment. A
   claim you cannot confirm is deleted.
4. Fix the root cause the comment was hiding, in scope. If it is out of scope,
   land the smallest in-scope fix and report the rest as open.
5. For a constraint that is real, offer the cheapest check that holds it: a
   type, a runtime assertion, a test, or a lint rule (policy, *Fix at the
   highest layer*). With approval, add the check and delete the comment.
   Without it, delete the comment and report the constraint as unenforced.

## Report

Deletions, suppressions removed, root causes fixed, checks added or offered,
constraints left unenforced, open work.
