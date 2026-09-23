# Claude Code adapter

Uses only native Claude Code mechanisms: a plugin served from a marketplace, a
`SessionStart` hook, and project settings.

## How it works

| Contract item | Mechanism |
|---|---|
| Expose skills | The harness repository is a marketplace whose single plugin, `eng`, has `source: "./"`. Its `skills/` directory is the harness `skills/`. Skills appear as `/eng:investigate`, `/eng:review`, etc. |
| Session context | `adapters/claude-code/hooks.json` registers a `SessionStart` hook (all sources: startup, resume, clear, compact) that runs `bin/eng-context`. Its stdout becomes context. |
| `$HARNESS` | Printed by `eng-context` as `HARNESS=<plugin root>`. |
| Tools on PATH | The plugin's `bin/` is added to the Bash tool's PATH, so `eng-context` can be run by name. |
| Frontmatter | `disable-model-invocation: true` keeps `release` and `adopt` out of automatic routing. |

Files: `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` (at the
repository root, where Claude Code requires them) and `adapters/claude-code/hooks.json`.

## Machine setup (once per machine)

From a published repository:

```bash
claude plugin marketplace add <owner>/engineering-harness
claude plugin install eng@engineering-harness
```

For development against a local checkout (edits apply on the next session or
`/reload-plugins`):

```bash
claude plugin marketplace add ~/projects/personal/engineering-harness
claude plugin install eng@engineering-harness
```

Validate the plugin after changing manifests:

```bash
claude plugin validate . --strict
```

## Project setup

Applied by the `adopt` skill; listed here so it can be done or checked by hand.

1. `CLAUDE.md` at the repository root imports the canonical context:

   ```text
   @AGENTS.md
   ```

   If `CLAUDE.md` already exists with project content and there is no
   `AGENTS.md`, move the project facts into `AGENTS.md` (they serve every agent),
   keep only Claude-specific instructions in `CLAUDE.md`, and put the import on
   its first line. Show the move as a diff.

2. `.claude/settings.json` declares the marketplace and enables the plugin for
   everyone who trusts the folder, and denies reads of common secret files. Merge
   `templates/claude-settings.json` into the existing file and keep existing keys.
   For the marketplace `source`, use the source this machine registered
   (`claude plugin marketplace list --json`). If that source is a local directory,
   the setting only works on this machine: say so, and leave the
   `extraKnownMarketplaces` entry out until the harness is published to a git
   host that teammates can reach. The `deny` rules are useful either way.

3. Optional: if other installed plugins overlap with harness skills (for example
   other review or security-review skills), consider disabling them in this
   project's `.claude/settings.json` to reduce routing ambiguity.

Notes:

- `Read(...)` deny rules block Claude's file tools, not shell commands such as
  `cat .env`. The security policy still forbids reading secret files; the rule is
  a second layer.
- Plugins are installed per user. Two projects on different harness lines on the
  same machine share one installed version; `eng-context` warns when a project's
  declared line differs.
