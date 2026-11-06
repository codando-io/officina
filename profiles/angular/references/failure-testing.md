# Failure-scenario testing tools (Angular)

How to run the frontend rows of `$HARNESS/skills/test/references/failure-scenarios.md`
on this stack. The user-facing guard usually belongs in the UI (an RxJS
operator, a disabled state), and the real guard in the API (idempotency); test
both.

| Technique | Tool | Scenarios |
|---|---|---|
| Control response order in unit tests | `provideHttpClientTesting()` and `HttpTestingController`: `expectOne(...)` for two requests, then `flush` them in reverse order | out-of-order responses (`switchMap` keeps the latest; `mergeMap` interleaves) |
| Control the network in the browser | Playwright `page.route` to delay, fail, abort, or rewrite a response | out-of-order responses, slow API, mutation cancelled mid-flight, stale bundle vs changed API |
| Double submit | Playwright `dblclick` with a delayed route; `exhaustMap` or a busy state in the component | create, pay, send buttons |
| Offline, several tabs, back button | Playwright `context.setOffline(true)`, two pages in one context, `page.goBack()` | offline behavior, logout in one tab, back/forward cache |
| Time | Playwright `page.clock` (`install`, `fastForward`) in e2e; Vitest `vi.useFakeTimers()` in unit tests | session expiry mid-form, polling, debounce |
| Generated inputs | fast-check properties (`fc.assert(fc.property(...))`) | Unicode text, large numbers, formatting, boundaries |
| Tests that would miss a bug | StrykerJS with the project's runner (`@stryker-mutator/vitest-runner` or `@stryker-mutator/karma-runner`), `--mutate` limited to the changed files, `--incremental` to reuse earlier results | weak assertions in changed components, services, and pipes |
| Precision across the wire | a contract test that round-trips `9007199254740993` and a 28-digit decimal | money and 64-bit ids |
