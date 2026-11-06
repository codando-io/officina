# Failure-scenario testing tools (Node.js)

How to run the scenarios in `$HARNESS/skills/test/references/failure-scenarios.md`
on Node. Run them against the real engine: a mocked ORM or an in-memory store
cannot show locking, isolation levels, collation, or what raw SQL does.

| Technique | Tool | Scenarios |
|---|---|---|
| Real database or broker per run | Testcontainers for Node (`testcontainers`, `@testcontainers/postgresql` and sibling modules) | concurrency, migrations, collation, pagination, messaging |
| The app with its real pipeline | the app factory listening on port 0 and called with `fetch`; in Nest, `Test.createTestingModule(...).overrideProvider(...)` then `createNestApplication()` | end-to-end behavior, body limits, cancellation |
| Two actors at the same moment | two clients or connections run with `Promise.all`, gated by a `Promise.withResolvers()` barrier so both read before either writes | lost update, write skew, double submit, duplicate delivery |
| Slow, failing, or cut network | Toxiproxy in a container (`@testcontainers/toxiproxy`) in front of the database or an HTTP stub | slow dependency, blackhole, timeout after commit |
| Scripted HTTP answers for `fetch` | undici `MockAgent` installed with `setGlobalDispatcher` from the `undici` package: delays, errors, and 429/503 sequences per route | retry storms, Retry-After, fallback paths |
| Outcome unknown after a call | a stub server that records the request, then destroys the socket before answering | non-idempotent external calls |
| Caller gives up | an `AbortController` aborted mid-request; assert the signal reached `fetch` and the database call, and the work stopped | client gone, long-running endpoints |
| Time | `node:test` `mock.timers` (`enable({ apis: [...] })`, `tick(ms)`), Vitest `vi.useFakeTimers()` and `vi.setSystemTime()`, Jest fake timers | DST, expiry and skew, backoff, leases |
| Process death and restart | `child.kill('SIGKILL')` on a spawned server, or `docker kill` on its container; restart and check invariants | crash mid-write, job killed mid-batch |
| Rolling deploy | `SIGTERM` to a spawned server under load; in-flight requests finish, the process exits, nothing is half done | pod killed mid-request, shutdown hooks |
| stdio MCP lifecycle | spawn the built server, close its stdin, assert it exits and released its handles; parse every stdout line | client closes the pipe, stray stdout output |
| Generated inputs | fast-check properties over strings, sizes, dates, and JSON with `__proto__`/`constructor` keys | Unicode and case, boundaries, prototype pollution |
| Precision across the wire | a round-trip test with `9007199254740993` and a 28-digit decimal through `JSON.parse` and the driver | money and 64-bit ids (`bigint` columns read as strings or `BigInt`) |
