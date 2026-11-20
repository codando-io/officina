# Verification skill for the running app

A project needs a scripted way to launch the real app, use a feature the way a
user would, and keep the evidence. This reference generates that as a
project-local skill (`.claude/skills/verify-<app>/`) and keeps it true. The
reader is an agent that has never seen the app, mid-task. Run it only when the
user asks, or when `adopt` offers it and they accept.

## 1. Interview the repository

Answer from the code; ask only what you cannot observe.

- **Surface**: web UI, CLI or TUI, desktop app, API, mobile app, library. Pick
  the primary one and note the rest.
- **Run**: the repository's own dev command, with ports, environment variables,
  seed data, and auth.
- **Drive**: existing harnesses first (Playwright or Cypress specs, expect
  scripts, curl-able endpoints, a debug port); then a generic recipe (browser
  through the Chrome DevTools Protocol, a PTY or tmux session, plain HTTP).
- **Observe**: screenshots, terminal transcripts, response bodies, logs, exit
  codes, database state.
- **Isolate**: can two instances run side by side? If not, say so: refusing to
  drive a shared instance beats corrupting someone's session.

If the checkout does not build or start, fix that or report it first.

## 2. Generate the skill

Frontmatter that names the app, the surface, and when to use it, then:

- **Launch**: the exact command, how to tell it is ready, and teardown. Launch
  must reach a usable state from an empty data directory, migrations and seed
  data included. Ready means usable, not that a process answers: a database
  health check can pass while its init scripts still run. A short-lived CLI has
  no server to keep alive; build once, then start each drive in its own isolated
  PTY or tmux session.
- **Doctor**: one read-only check that answers "is this instance worth
  driving?" (process up, right build, port owned by us, auth valid). Run it
  first whenever anything looks off.
- **Drive**: real selectors and commands from this repository. Prefer stable
  handles (ARIA labels, data attributes, route paths) over coordinates.
- **Evidence**: what to capture and where it goes. Exercise the real user path,
  not internal setters; capture the action and the resulting state; verify side
  effects (files, rows, messages) next to what is visible. Observe what a dry
  run skips instead of trusting its name.
- **Cleanup**: stop what you started, never by process name. Evidence survives
  cleanup.
- **Helpers**: executable scripts with their invocation shown in the skill.

Add the `Covers:` and `Sync commit:` lines described in
`formal-verification.md`, listing the source directories the drive recipes rely on.

## 3. Feature recipes

The `AGENTS.md` feature map is the index of features. In the verify skill, add
`features/README.md` and one `features/<feature>.md` for each of the three to
five most important features.

The README holds what every recipe shares:

- **Baseline preconditions**: the address, a disposable data directory per run
  so concurrent runs do not share state, seed data, the tools on `PATH`, and the
  doctor result to require. Never drive an instance this run did not start.
- **Driving conventions**: start each recipe from the baseline; prefer ARIA
  roles and accessible names over selectors; treat every command as literal;
  restore seeded data after a mutation, and keep proof artifacts.
- **Proof and skip reporting**: capture the action and the resulting state; UI
  proof is an ARIA snapshot plus a screenshot with the app identity visible; CLI
  proof is the command, stdout, stderr, and exit code; mutation proof adds a
  read-only second view of the stored value; every artifact records the feature
  and the entry point used. Report an unreachable path with the command tried
  and the unmet precondition, and never count a skipped entry point as verified
  through another path.

Each feature file opens with an H1 and one paragraph on the user-visible
behavior, then exactly four sections in this order: `Sub-features` (short IDs,
one line each), `How to get to it (user POV)` (every entry point), `Driving it
with <harness>` (starts with `Preconditions:`, then each user action paired with
an exact command and observable result), and `Gotchas` (traps that can waste or
invalidate a run). If the seed data lacks a precondition a journey needs, the
journey reports a failure and the reason goes in `Gotchas`; never weaken the
journey to make it pass. A proof that drives one convenient entry point is
incomplete when the map lists others.

## 4. Prove it

Run the skill's own instructions once: launch, doctor, drive one mapped feature,
capture evidence, clean up, and confirm the evidence still exists. Run the
cleanup after every failed iteration too, so broken attempts strand no
processes or ports. A skill that was never executed is a draft. If you proved it
in a stand-in for the real target (a container for a fresh VM, a local stack for
a remote one), list every setup step the stand-in did that the target will not;
those stay unverified until a run on the real target covers them.

## 5. Maintenance pass

A feature map rots when the app changes. This pass keeps a verify skill and its
map honest; the unit of rigor is the feature, not every sentence. Run it only
when the user asks, or when `adopt` finds the map stale. Say which outcome:

- **clean**: every feature got source and live coverage and nothing is worth
  shipping. No branch, no pull request.
- **changed**: one pull request ships proven corrections to the docs, harness,
  or map.
- **blocked**: coverage could not finish, or a proven fix could not ship
  safely. Say exactly what blocked it.

**Edit scope**: only the verification skill's own directory (its `SKILL.md`,
`features/`, and the harness scripts it owns), never product code. A behavior
the map describes that the app no longer has is doc drift (fix the map) or a
product regression (report it, do not paper over it in the docs).

0. **Locate the target**: the project skill whose body has launch and drive
   sections and a feature map (usually `.claude/skills/verify-*/`). Several
   candidates: ask which. None: stop and offer to generate one.
1. **Index hygiene**: fix missing, extra, duplicate, or dead entries in the map.
2. **Source wave**: one read-only subagent per feature file, run concurrently.
   Each explains how the feature works from source, flags likely drift with
   citations, and returns one live recipe. Children never drive the app and never
   edit files.
3. **Reconcile**: merge overlapping recipes into as few app states as practical,
   spot-check cited drift, and sweep recent changes for user-facing surfaces the
   map misses. A missing surface needs a concrete source path.
4. **Live pass**, required even when the source looks clean. You drive, serially
   for a long-lived instance, or one fresh isolated session per drive for a
   short-lived CLI. Exercise every feature at least once. Hold three
   invariants: never drive an instance you have not health-checked since it last
   did something surprising (doctor before the first drive and after any failed
   drive; reset or relaunch when doctor cannot see the failure); keep evidence
   through every cleanup, checked at its location; clean the residue of failed
   drives without killing a shared instance. A doctor failure caused by skill
   drift is drift: fix it and retry once before calling the pass blocked. A
   feature is `verified-unreachable` only with the concrete prerequisite and the
   route tried. Drive any harness fix again before it ships, and tear down after
   the last drive.
5. **Triage**: a wrong or missing user-POV description is doc drift, fix it.
   Working behavior the harness cannot drive is a harness gap, fix it. Broken app
   behavior is a product gap: record it for the user and keep it out of this change.
6. **Ship or stop**: for changed, one pull request of proven corrections, after
   re-reading every changed file. For clean or blocked, report the outcome and
   the coverage honestly.

Keep short run notes (features covered, unreachable prerequisites, confirmed
drift, outcome) in a scratch location and do not commit them.
