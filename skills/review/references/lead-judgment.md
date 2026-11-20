# Lead judgment for multi-reviewer reviews

An R2 review runs several reviewers. Reviewers see a slice and tend to fill
their report, so the lead (the session that asked for the review) filters
instead of concatenating.

## Reviewers

- Give every reviewer the same range, claims, and rubric, so differences in
  their findings come from the reviewer and not from the prompt.
- Use different models when the session has more than one, since models miss
  different real bugs. A finding two reviewers raise independently is the
  strongest signal; a lone finding still gets read.

## Adversaries must prove it

For a change or design you do not trust, run the reviewers as adversaries
(each in its own worktree, with the scope's uncommitted changes copied in), and
give each this brief:

> Break this change. Prove each finding with a run against the real code, such
> as a failing test, a repro script, or command output that shows the wrong
> behavior. For a design or plan, run a prototype or probe the current tree.
> Keep repros in your own worktree. Report each finding with a title, the exact
> command, the output it printed, and the output the intent requires. Leave out
> anything you did not run: style, naming, structure, and risks that need a
> future change to matter. No findings is a valid result.

Verify each finding by rerunning its command. Keep it when the output shows the
failure and the failure breaks the intent; drop the rest, and merge findings
that share a root cause. Adversaries find different failures, so keep every
verified finding instead of choosing one reviewer's list. Report, per adversary,
how many findings you dropped and why. State the intent first (restate the
user's goal from their message, the commits, and the pull request), and ask when
it is unclear.

## Sort every finding

- **Act on**: a real defect in correctness, security, or maintainability that
  would block a real merge, with proof (`review`, step 6).
- **Consider**: legitimate, and the cost of fixing it now is the author's call.
- **Noted**: valid and not actionable now.
- **Dismissed**: wrong, or missing context, with one line saying why.

Act on is a blocker or major in the review's output, Consider a minor, Noted a
nit; Dismissed items go under *Not reviewed*, one line each. The rerun above is
step 6's refutation. Name which reviewers raised each finding. Show the Dismissed list: it lets the
author overrule you.

## Filters

- A hypothetical is a finding only if a caller can reach it. Trace the call site.
- "I would have done it differently" is not a finding without a concrete
  problem with the current approach.
- Findings about code the diff did not touch are `pre-existing`.
- A suggested abstraction is premature unless the code must change in a second
  way. Patterns that match the rest of the codebase are not defects.
- Do not dismiss a security or correctness finding because it came from one
  reviewer.
- More than five items under Act on means the filtering was too soft. If every
  finding is a nit, say the change is probably fine.
