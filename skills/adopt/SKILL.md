---
name: adopt
description: Adopt the engineering harness in the current repository, upgrade a repository to a newer harness version, or check an adopted repository for drift. Creates or updates AGENTS.md, .engineering/ (config, overrides, memory), and the agent adapter files, filling project context from verified facts. Run only when the user asks.
disable-model-invocation: true
---

# Adopt

Run this skill only when the user explicitly asks for it.

Connect a repository to the harness with a small, reviewable change. The harness
brings process; the repository brings its own facts. Never overwrite a file the
project already has: merge into it and show the diff.

## Modes

Pick from the arguments or the repository state:

- **adopt**: `.engineering/harness.yaml` does not exist.
- **upgrade**: it exists and declares an older harness line than
  `$HARNESS/VERSION`.
- **check**: it exists and matches; verify the setup is still correct.

## Adopt

If the working tree has uncommitted changes, stop and ask before starting.

1. **Inspect the repository** (read-only): languages, solution/project files,
   package manifests, Docker and CI files, existing agent instruction files
   (`AGENTS.md` and those named in `$HARNESS/adapters/README.md`), the ADR
   directory (`docs/adr`, `adr/`, `docs/decisions`), test projects, telemetry
   setup, deploy configuration.
2. **Choose profiles** from `$HARNESS/profiles/README.md` by matching each
   profile's *Detection* section. If none fits, use no profile and say so; do
   not force one.
3. **Create `.engineering/`** from the templates:
   - `harness.yaml` from `$HARNESS/templates/harness.yaml`: the current harness
     line (major.minor of `$HARNESS/VERSION` while in 0.x), the profiles, the ADR
     directory actually used (default `docs/adr`).
   - `memory/INDEX.md` from `$HARNESS/templates/memory-index.md`, and empty
     `memory/gotchas/` and `memory/discoveries/` directories (keep them with
     `.gitkeep`).
   - Do not create the ADR directory; the first ADR creates it.
   - `overrides/` only if the project already has rules that differ from the
     harness (e.g. a documented branching model). Use
     `$HARNESS/templates/override.md`. Do not create empty override files.
4. **Project context in `AGENTS.md`.** Use `$HARNESS/templates/AGENTS.md` as the
   section list. If `AGENTS.md` exists, add only missing sections. Fill sections
   with facts you verified:
   - run the build and test commands and record the ones that worked. Before
     the first restore or install, check the manifests for install scripts and
     unusual sources (`$HARNESS/core/security.md` §3-4) and ask if anything
     looks odd. If a command needs infrastructure you do not have (Docker, a
     database), record it as `(unverified)` instead of guessing;
   - name two or three reference implementations (the best existing examples of
     an endpoint, a component, a test) as file paths;
   - describe the actual architecture, not an ideal one;
   - leave a clearly marked `(unknown - ask the team)` where you could not verify.
5. **Agent adapter.** For each agent the project uses (ask if unclear; default
   to the one running this skill), apply the setup in
   `$HARNESS/adapters/<agent>/README.md`, section *Project setup*.
6. **Ignore working files**: add `.engineering/work/` to `.gitignore`.
7. **Verify.** Run `$HARNESS/bin/eng-context --check` from the repository root
   and show its output. It must exit 0 and list the right version, profiles, and
   memory index. Then check the adapter files against the adapter README.
8. **Deliver** as one commit on a new branch (`chore: adopt engineering harness
   vX.Y`), and summarize: files created, sections left unknown, suggested first
   memory entries. Ask before pushing or opening a PR.

## Upgrade

1. Read the `$HARNESS/CHANGELOG.md` entries between the project's line and the
   current version. Apply each *Migration* section in order.
2. Mechanical changes (renamed keys, moved files): apply them.
3. Changes that need judgment (a changed override semantic, a removed skill the
   project's overrides reference): list them and ask.
4. Update `harness:` in `.engineering/harness.yaml`. Run the verification step.
5. One commit: `chore: upgrade engineering harness to vX.Y`.

## Check

Report, without changing anything:
- `eng-context` output and warnings;
- `AGENTS.md` commands that no longer work (run them);
- overrides that reference skills or sections that no longer exist;
- memory entries whose evidence (files, commands) no longer exists;
- adapter files that drifted from `$HARNESS/adapters/<agent>/README.md`.

## Output

List of files created or changed with one line each, the verification output,
and open questions for the team.
