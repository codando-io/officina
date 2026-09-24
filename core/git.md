# Git policy

Project conventions win. Check `AGENTS.md`, `CONTRIBUTING.md`, commit history, and
commitlint config before applying the defaults below.

## Commits

- One logical change per commit. A reviewer should be able to revert it alone.
- Conventional Commits: `type(scope): summary`, with types `feat`, `fix`,
  `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `revert`.
  Breaking change: `type!:` or a `BREAKING CHANGE:` footer.
- The summary says what changes, in the imperative. The body says why and what
  evidence supports it. Match the repository's language for commit messages.
- Separate mechanical commits (formatting, renames, generated files) from
  behavior commits.
- Never commit secrets, local config, build output, or large binaries.
- No tool or model attribution: no `Co-Authored-By` trailer for an AI tool, no
  "Generated with" line. Human co-authors are fine.
- `$HARNESS/bin/check-commit-msg <file>` checks the header format and the
  attribution rule; `--summary-only` also rejects a body. Use it as the
  project's `commit-msg` hook or in CI.

## Branches and history

- Work on a branch; do not commit to `main`/`master` unless the project works that
  way and the user asked.
- Never force-push a shared branch or rewrite published tags. Force-pushing your
  own unpublished branch is fine.
- Rebase or merge according to the project's convention. When unsure, merge.
- Resolve conflicts by understanding both sides; never pick "ours" or "theirs"
  wholesale to make the conflict disappear.

## Versioning

- Libraries and published artifacts follow SemVer. The change classification
  decides the bump: fix → patch, compatible addition → minor, breaking → major.
  In 0.x, breaking changes bump minor.
- A version that contradicts the changelog classification needs explicit
  confirmation.
- Tags are annotated (`git tag -a vX.Y.Z`) and created on a SHA with green CI.

## Pull requests

- Small, single-purpose. Title in Conventional Commit form when the project
  squashes.
- Description: the five blocks of `$HARNESS/templates/pull-request.md` (What,
  Why, How to verify, Risk, Reviewer focus), unless the repository has its own
  template.
- Bullets only, one line each, at most five per block. No paragraphs.
- How to verify and Risk are always present: the commands run and their
  results, the risk class, and the rollback. Drop any other block that would be
  empty.
- Why names the actual problem, links the issue, and says why this approach.
  "Fix bug" or "Fix build" is not a why.
- Language follows the repository. Same attribution rule as commits.
