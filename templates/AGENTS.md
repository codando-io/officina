# <Project name>

<One paragraph: what this system does, for whom, and what matters most (e.g.
correctness of billing, latency of search).>

This repository uses the engineering harness. Harness configuration, project
overrides, and project memory live in `.engineering/`. Decisions live in the
ADR directory declared in `.engineering/harness.yaml` (`adr_dir`).

## Commands

Verified on <date>. Run from the repository root.

| Purpose | Command |
|---|---|
| Restore | `...` |
| Build | `...` |
| Fast tests | `...` |
| Full tests | `...` |
| Run locally | `...` |
| Lint / format check | `...` |

## Architecture

<The actual structure: solutions/projects/apps, layers, how requests flow, where
business rules live, how the frontend talks to the backend. Link ADRs.>

## Conventions

<Only conventions that differ from framework defaults or that an agent would
get wrong: error handling, result types, DTO naming, folder layout, state
management, test naming.>

## Reference implementations

Copy these when adding something similar:

- Endpoint: `path/to/best/example`
- Frontend feature: `path/to/best/example`
- Integration test: `path/to/best/example`

## Testing

<Frameworks, where tests live, test data strategy, how to run a single test,
what CI runs.>

## Observability

<What exists: SDK, exporters, backend, dashboards, how to find a request by
trace id. "None yet" is a valid answer.>

## Delivery

| Item | Value |
|---|---|
| Hosting / provider | ... |
| Environments | ... |
| Staging gate | ... |
| Deploy trigger | ... |
| Rollback | ... |
| Feature flags | ... |
| Database migrations | ... |

## Security notes

<Auth model, where secrets come from at runtime, sensitive data handled, areas
that need extra care.>
