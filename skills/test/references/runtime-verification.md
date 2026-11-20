# Runtime verification

Unit and integration tests show that parts work. Starting the real system and
watching it do the thing shows that the parts are wired. Do it when a behavior
depends on startup, configuration, the browser, several processes, or a
dependency a test replaces.

## Procedure

1. **Start it** with the project's *Run locally* command from `AGENTS.md`, with
   local or test data and no production credentials (`$HARNESS/core/security.md`).
2. **Pick the cheapest probe that can fail:**
   - HTTP API or service: a client call (`curl`, the project's HTTP file) and the
     status and body fields that matter;
   - CLI or worker: run it on a fixture and read its output and exit code;
   - browser: drive the page through the Chrome DevTools Protocol (Playwright, or
     the Chrome tools of the session) and read the accessibility tree or the page
     text. A screenshot is for appearance questions only; the before and after
     GIFs of `ui-evidence.md` cover those;
   - background effects: the structured log line or the span the plan names as
     the health signal.
3. **Assert, do not look.** Each probe prints one line that is true or false
   (`order 42 status=paid`), not a page dump. A probe that prints a wall of
   output costs tokens and hides the result.
4. **Repeat the probe on the base** when the question is "what changed"; the
   difference is the evidence.
5. **Keep a probe you will run again.** Save it as a script under
   `.engineering/work/`. When it keeps paying off, propose it as a project
   script (a small CLI that prints the result in a few lines).

## Record

Command or probe, what it printed, and the feature it checks, named as in the
`AGENTS.md` feature map. A runtime check you could not run (no local database,
no browser) is reported as not run, with what stands in for it.
