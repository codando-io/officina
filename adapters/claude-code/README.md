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

From a local checkout:

```bash
claude plugin marketplace add ~/projects/personal/engineering-harness
claude plugin install eng@engineering-harness
```

Observed on Claude Code 2.1.231 (2026-09-24): the install **copies** the plugin to
`~/.claude/plugins/cache/engineering-harness/eng/<version>/`, and sessions run
the copy (`HARNESS=` in the session context shows the cache path). Because
`plugin.json` sets `version`, `claude plugin update` does not pick up edits until
the version changes. The documentation describes in-place loading for local
marketplaces; this version does not do it for a root (`./`) source.

To develop the harness and see edits in the next session, replace the cached
version directory with a symlink to the checkout. The plugins reference
documents this: Claude Code never removes a symlinked version entry.

```bash
rm -rf ~/.claude/plugins/cache/engineering-harness/eng/0.1.0 && ln -s ~/projects/personal/engineering-harness ~/.claude/plugins/cache/engineering-harness/eng/0.1.0
```

Undo it with `claude plugin uninstall eng@engineering-harness` followed by a new
install. For everyone else, publish a version bump; that is what `update`
delivers.

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

3. Check that the harness skills keep their descriptions. The skill listing has
   a budget (1% of the context window). When it overflows, Claude Code drops
   descriptions starting with the least-used skills, and new harness skills are
   the least used, so the agent stops choosing them on its own. Observed on
   2026-09-24 with pstack and ripwire installed: 7 of the 9 model-invocable
   `eng:` skills were listed without a description. Fixes, cheapest first:
   disable plugins the project does not use (`enabledPlugins` set to `false` in
   `.claude/settings.json`), set low-value skills to `"name-only"` in
   `skillOverrides`, or raise `skillListingBudgetFraction`. `/context` shows the
   listing size after the budget.

Notes:

- `Read(...)` deny rules block Claude's file tools, not shell commands such as
  `cat .env`. The security policy still forbids reading secret files; the rule is
  a second layer.
- Plugins are installed per user. Two projects on different harness lines on the
  same machine share one installed version; `eng-context` warns when a project's
  declared line differs.
