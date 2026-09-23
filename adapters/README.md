# Adapters

An adapter delivers the harness to one agent. It contains no engineering
content: policies, skills, profiles, and templates are agent-neutral and live
outside `adapters/`. If an adapter needs to change engineering content to work,
the content is wrong, not the adapter.

## Contract

Every adapter must:

1. **Expose `skills/`** through the agent's skill discovery, without copying
   them into projects.
2. **Deliver the session context**: the output of `bin/eng-context` for the
   current repository (core policy, project policy overrides, version check,
   active profiles, memory index). Deliver it again after context compaction if
   the agent supports that.
3. **Define `$HARNESS`**: `bin/eng-context` prints `HARNESS=<absolute path>`;
   the adapter must make sure the agent sees that line.
4. **Tolerate frontmatter** it does not understand (the Agent Skills standard
   lets agents ignore unknown fields).
5. **Document project setup** in its README under a *Project setup* section.
   The `adopt` skill follows that section.

## Agent instruction files by agent

| Agent | Project instruction file | Adapter |
|---|---|---|
| Claude Code | `CLAUDE.md` (reads `AGENTS.md` only when no `CLAUDE.md` exists; `@AGENTS.md` import covers both cases) | [claude-code](claude-code/README.md), implemented |
| Codex | `AGENTS.md` | [codex](codex/README.md), design only |
| GitHub Copilot | `AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md` | [copilot](copilot/README.md), design only |

`AGENTS.md` is the canonical project context. Other instruction files point to it.
