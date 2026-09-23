# Contributing to the harness

The harness is software. Changes go through the same process it asks of
projects: evidence, small diffs, tests, review, versioning.

## Where a change belongs

Ask in this order and stop at the first yes:

1. Is it a fact about one project? → that project's `AGENTS.md` or
   `.engineering/`. Not here.
2. Can a script answer it without judgment? → a script (profile `scripts/` or
   `bin/`), not prose.
3. Does it hold for every task? → `core/policy.md`, only if it is short and
   loading it in every session is worth the tokens. Otherwise another `core/` file.
4. Does it change with the stack? → a profile.
5. Is it a repeated procedure with steps, gates, and an output? → a skill,
   subject to the admission rule below.
6. Is it one project's exception? → that project's override.

One rule, one place. Skills refer to policy sections instead of restating them.

## Admission rule for a new skill

A new skill must meet all of these, stated in the PR:

- It is a procedure run repeatedly, across projects, the same way.
- It ends in an artifact someone can check (report, plan, diff, tag).
- The work has gone wrong at least once without it: name the incident.
- It does not overlap an existing skill; if it does, extend that skill instead.
- The skill count stays within the cap enforced by `tests/structure.test.mjs`
  (12 total, 10 model-invocable). Raising the cap needs its own PR with the
  reason.

Rarely used or outward-facing skills set `disable-model-invocation: true` so they
cost nothing in routing.

Not skills: code generators (`create-controller`, `create-component`),
framework tutorials, one tool's usage, anything a living example in a project
already shows.

## Writing skills

- Agent Skills format: `skills/<name>/SKILL.md`, `name` equal to the directory,
  `description` that says what it does, when to use it, and when not to.
- No agent-specific tool names or variables in `core/`, `skills/`, `profiles/`
  (checked by tests). Refer to harness files as `$HARNESS/...`.
- First step reads `.engineering/overrides/<skill>.md`.
- An `## Output` section with the artifact's format.
- Under 200 lines; move detail to a profile reference or `core/` file.
- Write rules as standing guidance with the reason, not as shouting.

## Removing things

A skill, rule, or profile section nobody used for 90 days is a candidate for
removal. Removal of a skill or change of a project-facing format is breaking:
bump accordingly and write the Migration section.

## Release process

1. `node --test tests/*.test.mjs` and `claude plugin validate . --strict` pass.
2. Classify changes: breaking (renamed/removed skill, changed project file
   format or override semantics), addition, fix.
3. Bump `VERSION` and `.claude-plugin/plugin.json` together (a test checks), move
   `Unreleased` to the new version in `CHANGELOG.md`, write **Migration** for
   breaking changes.
4. Commit, wait for green CI on that SHA, then `git tag -a vX.Y.Z`.
5. Never move or recreate a published tag.
