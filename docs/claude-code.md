# Claude Code setup

The harness is a Claude Code plugin and uses only native mechanisms: a plugin served from a marketplace, a
`SessionStart` hook, and project settings.

## How it works

| What | Mechanism |
|---|---|
| Expose skills | The harness repository is a marketplace whose single plugin, `eng`, has `source: "./"`. Its `skills/` directory is the harness `skills/`. Skills appear as `/eng:investigate`, `/eng:review`, etc. |
| Session context | `hooks/hooks.json` registers a `SessionStart` hook (all sources: startup, resume, clear, compact) that runs `bin/eng-context`. Its stdout becomes context. |
| Secret files in shell commands | A `PreToolUse` hook on Bash (`bin/eng-guard-secrets`) asks the user before a command touches `.env`, key, certificate, or credential files; `.env.example` and similar templates pass. Deny rules in settings cover only Claude's file tools. |
| Instructions hidden in what Claude reads | A `PostToolUse` hook on Read, Grep, Bash, and WebFetch (`bin/eng-flag-injection`) adds a note when a result contains text addressed to an AI agent ("note for AI agents", "ignore previous instructions", `curl ... \| sh`), so Claude reports it instead of following it. |
| Check before finishing | A `Stop` hook (`bin/eng-stop-check`) runs the project's `stop_check` from `.engineering/harness.yaml` when Claude finishes with uncommitted changes, and sends Claude back with the output when it fails. No `stop_check`, no effect. |
| `$HARNESS` | Printed by `eng-context` as `HARNESS=<plugin root>`. |
| Tools on PATH | The plugin's `bin/` is added to the Bash tool's PATH, so `eng-context` can be run by name. |
| Frontmatter | `disable-model-invocation: true` keeps `release` and `adopt` out of automatic routing. |

Files: `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` (at the
repository root, where Claude Code requires them) and `hooks/hooks.json`.

## Machine setup (once per machine)

The marketplace is the harness repository, public on GitHub as
`codando-io/officina`. No SSH key or GitHub account is needed; without SSH,
the clone falls back to HTTPS:

```bash
claude plugin marketplace add codando-io/officina
claude plugin install eng@engineering-harness
```

From a local checkout, for harness development:

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
h=~/projects/personal/engineering-harness
c=~/.claude/plugins/cache/engineering-harness/eng/$(cat "$h/VERSION")
rm -rf "$c" && ln -s "$h" "$c"
```

`claude plugin install` and `claude plugin update` replace the symlink with a
copy, so redo it after either, including after every version bump. Undo it with `claude plugin uninstall eng@engineering-harness` followed
by a new install. For everyone else, publish a version bump; that is what `update`
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
   `AGENTS.md`, move the project facts into `AGENTS.md` (the context `eng-context` and the skills read),
   keep only Claude-specific instructions in `CLAUDE.md`, and put the import on
   its first line. Show the move as a diff.

2. `.claude/settings.json` declares the marketplace and enables the plugin for
   everyone who trusts the folder, denies reads of common secret files, and asks
   before hard-to-reverse commands (force push, merge, publish, release, destroy). Merge
   `templates/claude-settings.json` into the existing file and keep existing keys.
   The template carries the public GitHub source, which any machine can
   fetch. Keep it even when this machine registered the marketplace another way
   (an `ssh://` URL, a local directory): those sources work on this machine
   alone.

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
