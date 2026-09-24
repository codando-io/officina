# Failure-scenario testing tools (.NET)

How to run the scenarios in `$HARNESS/skills/test/references/failure-scenarios.md`
on this stack. Real dependencies over fakes: EF Core's in-memory provider and
SQLite hide collation, transaction, and raw SQL behavior, so failure scenarios
run against the real database engine.

| Technique | Tool | Scenarios |
|---|---|---|
| Real database, broker, or blob store per test run | Testcontainers for .NET (`Testcontainers.PostgreSql`, `Testcontainers.MsSql`); the broker's emulator or container | concurrency, migrations, collation, pagination, messaging |
| App under test with real pipeline | `WebApplicationFactory<Program>` with `ConfigureTestServices` to swap one dependency at a time | end-to-end API behavior, cancellation, size limits |
| Two actors at the same moment | two `DbContext` instances (or two `HttpClient`s) and a `Barrier`/`TaskCompletionSource` so both read before either writes | lost update, write skew, double submit, duplicate delivery |
| Slow, failing, or cut network | Toxiproxy container in front of the database or HTTP stub, toxics set through its HTTP API | slow dependency, blackhole, timeout after commit |
| Faults inside the resilience pipeline | Polly chaos strategies (`AddChaosLatency`, `AddChaosFault`, `AddChaosOutcome`, namespace `Polly.Simmy`); `Polly.Testing` `GetPipelineDescriptor` to assert the pipeline shape | retry amplification, circuit breaker and fallback paths |
| Outcome unknown after a call | a `DelegatingHandler` that sends the request, then throws | non-idempotent external calls |
| Failure after commit | a `DbTransactionInterceptor` (from `Microsoft.EntityFrameworkCore.Relational`, included by the Npgsql and SqlServer providers) whose `TransactionCommittedAsync` throws | connection retry with `EnableRetryOnFailure`, dual write |
| Time | `FakeTimeProvider` (`Microsoft.Extensions.TimeProvider.Testing`): `SetUtcNow`, `Advance`, `SetLocalTimeZone` | DST, expiry and clock skew, backoff and Retry-After, leases |
| Process death | `docker kill` (SIGKILL) on a Testcontainers-hosted service, or killing the test host process; restart and check invariants | crash mid-write, job killed mid-batch, outbox relay |
| Rolling deploy | run the previous release's integration suite against the new migration; start several instances at once | N-1 against new schema, startup migrations |
| Generated inputs | FsCheck properties over strings, sizes, and dates | Unicode and case, boundaries, leap days |
