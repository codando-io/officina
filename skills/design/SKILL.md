---
name: design
description: Design a system or a significant capability before planning code - requirements with numbers, load estimates, components and data flow, options compared on the same criteria, failure modes, security, observability, rollout - and publish it as a discussion page with an architecture diagram (draw.io when installed, otherwise Mermaid). Use for a new service or product, a new integration, datastore, queue, or trust boundary, a scale or reliability problem, or when asked for a system design, a solution architecture, or a diagram to discuss. Not for a change inside existing modules (use plan) or for auditing existing code (use architecture-audit).
---

# Design

A design is a decision people can argue with: numbers, options, and a diagram.
It is done when a reader can see what the recommendation is, why, and what
would change it.

## Before you start

- If `.engineering/overrides/design.md` exists, read it and apply it.
- Investigate the current system first (`investigate`, or equivalent evidence in
  the conversation): the code, configuration, ADRs, and docs the design builds
  on. A design for a system you have not read is a guess. For a large codebase,
  send the mapping to an Explore subagent and keep its summary.
- Read `$HARNESS/skills/design/references/checklist.md` and
  `$HARNESS/skills/design/references/diagrams.md`.
- Find where the project keeps designs (`docs/design`, `docs/architecture`,
  `docs/rfcs`) and follow its naming. Default: `docs/design/<slug>.md`.
- Ask with `AskUserQuestion` only what the repository cannot tell you: goals,
  expected load, budgets, deadlines, hard constraints. When a number is
  missing, assume a value, mark it as an assumption, and keep going.

## Procedure

1. **Frame.** Problem, goals, non-goals, actors. A paragraph each at most.
2. **Requirements.** Functional requirements as a short list. Quality
   attributes as numbers with their source (checklist §2).
3. **Estimates.** Back-of-the-envelope numbers for the dominant load, with the
   arithmetic shown (checklist §3). When the load is trivially small, say so in
   one line and skip the rest.
4. **Current state.** What exists, with file paths and ADR numbers, and which
   parts constrain the design.
5. **Options.** At least two real options; include the smallest change to what
   exists when it is viable. Compare them in one table on the same criteria:
   requirements met, complexity, operability, cost, reversibility, time to
   first value. Prefer what the team already runs; a new technology needs a
   requirement that the existing stack cannot meet.
6. **Recommended design.** Components and their responsibilities, data flow,
   data ownership, contracts, consistency and idempotency, failure modes (rows
   from `$HARNESS/skills/test/references/failure-scenarios.md`), security
   (trust boundaries, identities, secrets, `$HARNESS/core/security.md` §5),
   observability (the SLIs and the signal that shows it working), and cost.
7. **Rollout.** Increments that each end in a shippable, verifiable state, with
   the reversibility class and rollback of each. The first increment is what
   `plan` receives.
8. **Diagrams.** A container diagram always; add a sequence diagram for the
   critical flow when it crosses more than two components or has async steps.
   Follow `references/diagrams.md`. Every box in a diagram appears in the text
   with its responsibility.
9. **Open questions.** Number them (Q1, Q2...) so the discussion can refer to
   them. For each, say who can answer and what changes depending on the answer.
10. **Write the document** from `$HARNESS/templates/design.md`, in the
    language of the project's docs.
11. **Publish the discussion page.** Fill `$HARNESS/templates/design-page.html`
    and save it as `.engineering/work/design-<slug>.html`. Publish it with the
    Artifact tool (it starts private; the user decides who sees it). Without the
    Artifact tool, give the file path. Take one look at the rendered page and
    fix a diagram that did not render.
12. **Discuss.** Tell the user they can comment on the page. When they say they
    did, read the comments with `ArtifactComments`, answer each one or change
    the design, and republish the same page. Record in the document what the
    discussion changed.
13. **Decide.** When the user accepts the design, set its status to accepted,
    write an ADR from `$HARNESS/templates/adr.md` for the decision, and hand the
    first increment to `plan`.

## Rules

- Numbers over adjectives: "p95 under 300 ms at 50 requests/s", not "fast".
- Design the path, not only the end state. A big-bang migration needs a reason.
- The page leaves the repository. Keep secrets, credentials, internal
  hostnames, IP addresses, and personal data out of it and out of the diagram.
- The document in the repository is the record; the page is a view of it for
  discussion. Change the document first, then republish.

## Output

- `docs/design/<slug>.md`, plus the diagram sources listed in
  `references/diagrams.md` (`<slug>.drawio` and `<slug>.drawio.svg`, or
  `<slug>.mmd`).
- The discussion page link, or its path when the Artifact tool is unavailable.
- A short message: the recommendation in one sentence, the decision the user
  must make, and the three open questions that matter most.
