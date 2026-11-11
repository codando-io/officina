# Before and after GIFs

A pull request that changes what users see shows the change: the same journey
recorded on the base and on the branch, as two GIFs side by side. Reviewers
judge the behavior without checking out the branch, and the recording is a
self-check: looking at it catches what green tests miss (a flash of empty
content, focus that jumps, a dialog that never opens).

## When

The diff changes rendered output: components and templates, styles and themes,
routes, copy and translations, images and icons, or client code that changes
what appears after an action. Pure refactors with no visible change, backend
code, and test files do not need GIFs; say so in one line instead.

Project specifics (the dev command, a test login, seed data, the ports) belong
in `AGENTS.md` or `.engineering/overrides/test.md`; read them first.

## 1. Plan the journeys

One journey per surface the diff touches, each 3 to 15 seconds: open the page,
do the action that shows the change, hold the end state. A static change needs
only the page and a short scroll, which is the default journey. Name what the
reviewer should look at; that sentence becomes the label.

A journey is a module the recorder imports, kept with the evidence, never in
the repository:

```js
// journey.mjs
export default async (page) => {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByRole('status').waitFor();
};
```

Use roles and labels, so the same journey runs on both versions. When the
change renames what the journey clicks, write `journey-before.mjs` and
`journey-after.mjs` that reach the same state.

## 2. Run both versions

- Keep the evidence outside the repository: the session scratchpad, or
  `mktemp -d`. GIFs never go into a commit.
- **After**: the branch, with its dev server, as `AGENTS.md` starts it.
- **Before**: the merge base, in a second worktree with its own install, on
  another port:

  ```bash
  base=$(git merge-base HEAD origin/<base-branch>)
  git worktree add --detach "$EVIDENCE/base" "$base"
  ```

  Install dependencies there with the project's clean-install command. Do not
  symlink `node_modules`: dev servers refuse files outside their root and
  silently render fallback fonts. Remove the worktree when done.
- Uncommitted work only: capture after, `git stash`, capture before,
  `git stash pop`.
- Both runs use the same data, viewport, theme, and locale. Sign in with the
  project's test user. No real names, emails, tokens, or customer data may be
  visible in any frame.

## 3. Record

```bash
$HARNESS/bin/ui-gif record --url http://localhost:4201 --journey journey.mjs --out "$EVIDENCE/<journey>-before.gif"
$HARNESS/bin/ui-gif record --url http://localhost:4200 --journey journey.mjs --out "$EVIDENCE/<journey>-after.gif"
```

Without `--journey` it opens `--path` (default `/`) and scrolls. Other options:
`--viewport 1280x800` (use `390x844` for a mobile change), `--color-scheme dark`
(record both schemes when the change touches theming), `--width` and `--fps`
for the GIF size. It drives the installed Google Chrome headless through
`playwright-core`, converts with `ffmpeg`, and prints the GIF path, its size,
and three frames (first, middle, last) as PNG. Exit code 3 names what is
missing and the command that installs it; Node 20 or newer must be first on
PATH.

## 4. Look before you publish

Read the three frames of each GIF. Check that the first frame shows the page,
not a blank or a loading state; that the last shows the end state the label
promises; and that no secret or personal data appears. Identical before and
after frames are a finding: the change is not visible, or the journey missed
it. Fix the journey, or the code, before going on.

A GIF over 10 MB is refused by GitHub: shorten the journey, or lower `--fps`
or `--width`.

## 5. Publish

Write the pull request body in the evidence directory and reference each GIF
by its relative path, in the repository's language. One table row, or one
table per journey when each needs its own label:

```markdown
## Before and after

**<what to look at>**

| Before | After |
|---|---|
| ![Before: <state>](./<journey>-before.gif) | ![After: <state>](./<journey>-after.gif) |
```

- **GitHub**: `gh pr create --body-file "$EVIDENCE/body.md" --attach "$EVIDENCE/<journey>-before.gif" --attach "$EVIDENCE/<journey>-after.gif"`
  (or `gh pr edit <number>` for an open pull request). `gh` uploads the files
  and rewrites the relative references. It needs a `gh` whose
  `gh pr create --help` lists `--attach`.
- **Forgejo**: create the pull request first, then upload and rewrite with a
  token that has the `write:issue` scope in `FORGEJO_TOKEN`:

  ```bash
  $HARNESS/bin/ui-gif forgejo-attach --repo https://<host>/<owner>/<repo> --pr <number> --body-file "$EVIDENCE/body.md" > "$EVIDENCE/body-final.md"
  fj pr edit <number> body "$(cat "$EVIDENCE/body-final.md")"
  ```

  Without a token, give the user the GIF paths to drag into the pull request
  and say so.

Open the published pull request and confirm both GIFs render and no relative
path is left.

When capture is impossible (no browser, a login the agent cannot complete, a
native app), the block says why in one line. Never describe a GIF that was not
recorded.
