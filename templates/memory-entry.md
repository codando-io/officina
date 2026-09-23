<!--
Project memory entry. Save as .engineering/memory/<gotchas|discoveries>/<slug>.md
and add one line to .engineering/memory/INDEX.md:

- [gotchas/<slug>.md](gotchas/<slug>.md) - <one-line hook> (verified YYYY-MM-DD)

Write an entry only if ALL are true:
1. it cost real time to discover;
2. it is not derivable from the code or git history;
3. it will matter again.

gotchas/     unexpected behavior that bit someone (infra, framework, database, API)
discoveries/ investigated knowledge (API limits, deployment details, data quirks)
Decisions go to ADRs, not here.

Never store secrets, personal data, conversation summaries, or task logs.
-->

# <Short statement of the fact>

- Type: gotcha | discovery
- Verified: YYYY-MM-DD
- Area: <module, service, or path>

## Context

<When does this matter? What were you doing when it surfaced?>

## Fact

<What is true, stated precisely.>

## Evidence

<How we know: file:line, command and output, commit, ticket, documentation link.>

## How to apply

<What to do (or avoid) because of this.>
