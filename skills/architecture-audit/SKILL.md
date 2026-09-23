---
name: architecture-audit
description: Audit the architecture of a repository for problems no single PR review catches - architectural duplication, conflicting abstractions, circular dependencies, broken boundaries, dead code, overloaded components, duplicate APIs, old and new patterns coexisting, growing technical debt, backend/frontend inconsistency, stale feature flags, and stale project memory. Also runs modernization audits with the stack profile. Produces a prioritized backlog. Use periodically or when asked about codebase health, tech debt, or modernization. Not for reviewing one diff.
---

# Architecture audit

Code review looks at one diff. Drift happens across many. This audit looks at
the whole and returns a short, prioritized backlog with evidence, not a lecture.

## Before you start

- If `.engineering/overrides/architecture-audit.md` exists, read it and apply it.
- Read `AGENTS.md` (intended architecture), the ADR directory (decisions), and
  `.engineering/memory/INDEX.md`.
- Pick the focus: `general` (default) or `modernization`. For modernization,
  read each active profile's `references/modernization.md` and
  `references/currency.md`.
- Stay read-only. The output is a backlog; each item is executed later through
  the normal lifecycle.

## Procedure

1. **Reconstruct the actual architecture.** Projects/modules, their
   dependencies, layers, entry points. Compare it with what `AGENTS.md` and the
   ADRs say. Differences are findings.
2. **Look for each smell** below. For each hit, collect concrete evidence: paths,
   counts, examples. Use search and the stack's tools (project references,
   import graphs) rather than impressions.

| Smell | Evidence to collect |
|---|---|
| Architectural duplication | Two or more implementations of the same concern (HTTP clients, validation, mapping, error handling, auth checks, date handling) |
| Conflicting abstractions | Parallel ways to do one thing (repository + direct DbContext, two mediator styles, two state management approaches) |
| Circular dependencies | Project/module reference cycles, services injecting each other |
| Broken boundaries | UI calling data layer, domain referencing infrastructure, controllers with business rules, shared "Common" projects that everything depends on |
| Dead code | Unreferenced types, endpoints without callers, unused components, config never read |
| Overloaded components | Very large classes/files, services with many dependencies, components doing fetch + state + presentation |
| Duplicate APIs | Endpoints returning the same resource in different shapes; frontend services wrapping the same endpoint twice |
| Old and new patterns coexisting | Count of each; is migration progressing or stalled? |
| Backend/frontend inconsistency | DTOs vs TypeScript models, enum values, date/decimal formats, error contract, pagination shape, validation rules duplicated with different limits |
| Stale feature flags | Flags fixed at one value for months, flags with no remaining branches |
| Stale knowledge | `AGENTS.md` commands that fail, memory entries whose evidence no longer exists, ADRs contradicted by code |
| Growing debt | Areas with high churn and complexity (`git log` frequency on large files), warnings trend, suppressed analyzers |

3. **Modernization focus** adds: obsolete/deprecated API usage (compiler and
   analyzer warnings), platform and framework versions against support windows,
   legacy idioms listed in the profile, and the cost of each migration.
4. **Prioritize.** For each finding estimate impact (bugs, velocity, security,
   cost) and effort (S/M/L). Recommend at most five items to do next. Prefer
   items that unblock others and items that stop the problem from growing (e.g.
   an analyzer rule) over one-off cleanups.

## Output

```markdown
## Architecture audit: <repo>, <focus>, <date>

**Actual architecture**: short description or diagram; differences from documented

**Findings**
| # | Smell | Evidence | Impact | Effort | Suggested action |
|---|---|---|---|---|---|

**Recommended next 5**: ordered, each with change type (refactor/migration) and reversibility
**Stop the bleeding**: rules, analyzers, or conventions that would prevent regression
**Knowledge fixes**: AGENTS.md, memory entries, or ADRs to update or retire
```

When a finding reflects a decision that should be recorded or revisited, suggest
an ADR. Do not open issues or PRs unless the user asks.
