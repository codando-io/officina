# Failure scenarios

Scenarios to verify beyond the happy path. Use the *Mandatory when* column: find
the rows whose trigger matches the change, and treat each as a behavior that
needs a test, or a written reason why it does not apply. Do not run the whole
catalog on every change.

Each row gives the question, how to verify it, the trigger, and the source
(keys at the end). Items marked UNVERIFIED are inferences a source did not
confirm. Stack-specific tools for each technique are in the active profiles'
`references/failure-testing.md`.

Method (Principles of Chaos [P]): define a measurable steady state, inject a
real-world event, keep the blast radius small, and compare.

## 1. Concurrency and data integrity

| What happens when... | Verify with | Mandatory when | Source |
|---|---|---|---|
| two writers change the same file at the same time? | two processes writing in a loop; assert the file is always whole | files written by more than one process | article |
| two sessions consolidate the same data at the same time? | two workers with a barrier; assert one result | batch or consolidation jobs | article |
| two requests read-modify-write the same row (lost update)? | real DB, two contexts load the same row and both save; the second must fail with a concurrency error or merge | new editable entity or UPDATE path | [EF-C] [NPG-C] [J-PH] |
| two transactions check a rule across rows, then write different rows (write skew)? | two connections with a barrier (both read, both write); assert the invariant | check-then-insert validation | [PG-ISO] [J-PG] |
| the database aborts the transaction (serialization failure, deadlock)? | force opposite lock order; assert the whole unit re-runs once, without duplicate side effects | explicit transactions, stricter isolation | [PG-SER] [SQL-DL] |
| the connection drops during COMMIT and the ORM retries? | interceptor that fails after the commit succeeds; assert no duplicate rows | connection retry enabled (e.g. `EnableRetryOnFailure`) | [EF-R] |
| two writers update the same blob? | two uploads with the same ETag; one must get 412 | read-modify-write on blob storage | [AZ-BLOB] |

## 2. Crash and partial failure

| What happens when... | Verify with | Mandatory when | Source |
|---|---|---|---|
| the process dies before finishing a write? | kill -9 mid-write, restart, check invariants; write via temp file + flush + rename (+ directory fsync) | files or state that must survive a restart | article [OSDI-P] [FSYNC] |
| the disk fails in the middle of a delete? | fault injection between steps; the operation is resumable or reversible | multi-step deletes | article |
| power is lost after rename but before the directory is flushed? | code review of the write sequence; VM hard reset (kill -9 does not cover it) | durable local files | [OSDI-P] [FSYNC] |
| the database commits but the publish, email, or blob upload fails? | throw after the save, run the relay twice; assert exactly one effect (transactional outbox) | any handler that writes to the DB and something else | [OUTBOX] [AZ-OUTBOX] |
| a job is killed in the middle of a batch? | `docker kill` mid-batch, restart; no skipped or duplicated items | long batches | [HOST] [QUARTZ] |
| housekeeping deletes temp or journal files before recovery runs? | crash, run cleanup, restart, check invariants | new temp-file cleanup | [SQLITE] |
| an error path runs (catch block)? | force each new error path in a unit test; flag empty or log-only handlers, catch-all aborts, TODO handlers | any new try/catch | [YUAN] |

## 3. Retries, duplicates, idempotency

| What happens when... | Verify with | Mandatory when | Source |
|---|---|---|---|
| a retried request was already applied? | same idempotency key twice, in sequence and concurrently; one effect; same key with a different body is rejected | new POST/command endpoint; adding retries (standard HTTP resilience retries POST too) | [AWS-IDEM] [STRIPE] [NET-RES] |
| a call times out after the server already committed (unknown outcome)? | a handler that forwards the request, then throws; the caller reconciles instead of applying twice | non-idempotent external calls | [AWS-DIST] [STRIPE] |
| every layer retries? | always-failing stub; count attempts; inspect the pipeline | new retry policy, SDK, or middleware | [AWS-TO] [SRE-OVL] [NET-RES] |
| the dependency recovers and all clients retry at once (retry storm)? | stub returning 429/503 then recovering; fake clock to check backoff, jitter, Retry-After, and caps | retry or reconnect loops | [AWS-TO] [AZ-STORM] [AZ-TF] |
| the user double-clicks submit? | browser test double-click with a delayed response; one effect; server-side idempotency as the real guard | create, pay, or send buttons | [RXJS-EX] [IETF-IK] |

## 4. Dependencies and overload

| What happens when... | Verify with | Mandatory when | Source |
|---|---|---|---|
| a dependency is slow but still up? | latency proxy in front of the DB or HTTP stub; p99 bounded, pools not exhausted | new outbound call; timeout, pool, or client change | [AWS-TO] [AZ-TEST] [TOXI] |
| a noncritical dependency blackholes? | cut it with a proxy; critical endpoints and readiness stay healthy | dependency on the request path or in a health check | [SRE-CASC] [AWS-HC] |
| the fallback runs for the first time in production? | force the breaker open; load test with caches off | new fallback, breaker, or cache | [AWS-FB] [SRE-TEST] |
| load goes far past capacity, and comes back down? | ramp past the limit; goodput plateaus; probes do not restart pods | hot paths, limits, autoscaling, probes | [AWS-LS] [SRE-CASC] |
| the client already gave up? | cancel mid-request; downstream work stops (cancellation propagates) | long-running endpoints, in-memory queues | [AWS-LS] [SRE-CASC] |
| a new instance starts with a cold cache? | start under realistic load with an empty cache; DB load within capacity | cache changes, scaling | [AWS-CACHE] [SRE-CASC] |

## 5. Messaging and scheduled jobs

| What happens when... | Verify with | Mandatory when | Source |
|---|---|---|---|
| a message or job runs twice, or on two consumers at once? | deliver the same message id twice, also concurrently; unique constraint + effect in one transaction | new consumer or job | [AZ-IDEMC] [SB-LOCK] [HANGFIRE] |
| processing takes longer than the message lock? | slow handler past the lock duration; completion fails after the work; one effect | slower handlers, bigger batches | [SB-LOCK] [AWS-Q] |
| a poison message arrives? | malformed payload goes to the dead-letter queue; others keep flowing | message contract change | [SB-DLQ] [AWS-Q] |
| the consumer was down for an hour? | pre-filled queue; measure drain time and downstream load | new queue, consumer concurrency change | [AWS-Q] |
| scheduled runs overlap across instances? | two hosts firing the same job at once; one runs | scaling out; a job longer than its interval | [QUARTZ] |

## 6. Deployment, migration, configuration

| What happens when... | Verify with | Mandatory when | Source |
|---|---|---|---|
| old and new versions run side by side, and after rolling back? | upgrade-downgrade test: deploy half, finish, roll back; vN and vN+1 on the same DB | DTO, message, enum, cache format, or schema changes | [SRE-INTRO] [AWS-RB] |
| app version N-1 runs against the new schema? | run the N-1 integration suite against migration N in CI | rename/drop column, NOT NULL, type change | [STRIPE-MIG] [EF-MIG] |
| a migration locks a hot table? | migrate a production-sized copy under load; check worst latency | ALTER on a large table | [PG-ALTER] |
| every replica applies migrations at startup? | start three instances at once against one DB | runtime migrations | [EF-MIG] |
| a backfill dies at 60% and is rerun? | kill after N batches, rerun; result equals one clean run (idempotent, resumable: UNVERIFIED as a sourced rule) | any backfill | [STRIPE-MIG] |
| the pod is killed mid-request? | keep load running through a rolling restart; zero 5xx, no half-done work | shutdown code, hosted services | [K8S] [AZ-TEST] |
| a configuration value or feature flag changes, valid or not? | config tests vs source control; each flag combined with normal operations; dynamic reload | settings or flags | [YUAN] [SRE-TEST] [AZ-FMA] |
| a secret or certificate rotates or expires? | rotate the DB password while the service runs; two-credential rotation | new secret or connection string | [AZ-SEC] [KV-DUAL] [AWS-HC] |
| a browser tab from the previous build calls the new API? | load the app, swap build and contract, navigate | API field changes, lazy routes | [NG-SW] |

## 7. Time

| What happens when... | Verify with | Mandatory when | Source |
|---|---|---|---|
| a schedule crosses a DST gap or overlap? | fake clock with a time zone, at each transition | local-time schedules, "end of day" logic | [NET-TZ] [CRONOS] [NET-FAKE] |
| a local or unspecified date is written to a UTC column? | round-trip against the real DB | new date column, provider upgrade | [NPG-DT] |
| a token is checked right around expiry with clock skew? | validate at exp−1s, exp+1s, exp+skew+1s | auth or refresh changes | [IDM-SKEW] |
| the wall clock jumps? | fake clock jumps; durations use monotonic time | tokens, TTLs, leases | [AWS-HC] [AWS-LS] |
| a "changed since T" sync meets a transaction that commits late? | two transactions ordered with a barrier; the poller does not miss the row (UNVERIFIED inference) | incremental exports or sync | [PG-NOW] |
| the date is Feb 29? | add years and months across leap days | anniversaries, billing cycles | [NET-ADDY] |

## 8. Input and contract boundaries

| What happens when... | Verify with | Mandatory when | Source |
|---|---|---|---|
| two strings look the same (Unicode normalization, case)? | property-based string generators against the real DB, never an in-memory provider | unique text columns, login, search | [UAX15] [PG-COLL] [EF-TEST] |
| the request body is at the size limit ±1? | send limit±1 through the real proxy; clean rejection, no leftover temp files | upload or import endpoints | [KESTREL] |
| an IN list has 0 or thousands of items? | parameterize 0, 1, 2100, 2101, 10k | new IN queries, list parameters, ORM upgrade | [EF10] [SQL-LIM] |
| pages share a sort key, or rows change between pages? | seed ties, delete while paging; pages together equal the set once | new list endpoint or sort | [EF-PAGE] [PG-LIMIT] |
| a 64-bit integer or decimal reaches JavaScript? | round-trip 9007199254740993 and 28-digit decimals | money, bigint ids | [RFC8259] [MDN-SAFE] |
| responses arrive out of order? | delay the first response more than the second; the UI shows the latest | typeahead, filters, polling | [RXJS-SW] [RXJS-MM] |
| a mutation is cancelled mid-flight? | abort, reload, check state (the server may have committed: UNVERIFIED) | cancellable writes | [NG-HTTP] |
| the user is offline, uses two tabs, goes back, or the session expires mid-form? | browser tests with offline mode, shared context, back/forward cache, fake clock past expiry | auth, token lifetime, forms | [PW-CTX] [PW-CLOCK] [BFCACHE] [BCAST] |

## Evidence on frequency

- About 70% of Google's outages come from changes to a live system [SRE-INTRO].
- In Yuan et al. (OSDI 2014): 92% of catastrophic failures come from wrong
  handling of non-fatal errors; 58% would be caught by simple testing; 35%
  fall into three trivial patterns (empty or log-only handler, abort on an
  over-general exception, TODO in the handler); 77% reproduce with a unit test;
  98% need 3 nodes or fewer; configuration changes trigger 23% [YUAN].
- Pillai et al. (OSDI 2014): 60 crash vulnerabilities in 11 applications [OSDI-P].
- Overload is the most common cause of cascading failures [SRE-CASC].

## Sources

- article: Fabio Akita, "Parem de inventar desculpas e façam mais deploy", 2026-09-22 (A1 in the harness RESEARCH.md)
- [P] https://principlesofchaos.org/
- [YUAN] https://www.usenix.org/conference/osdi14/technical-sessions/presentation/yuan
- [OSDI-P] https://www.usenix.org/system/files/conference/osdi14/osdi14-paper-pillai.pdf
- [FSYNC] https://man7.org/linux/man-pages/man2/fsync.2.html
- [SQLITE] https://www.sqlite.org/atomiccommit.html
- [SRE-INTRO] https://sre.google/sre-book/introduction/
- [SRE-TEST] https://sre.google/sre-book/testing-reliability/
- [SRE-OVL] https://sre.google/sre-book/handling-overload/
- [SRE-CASC] https://sre.google/sre-book/addressing-cascading-failures/
- [AWS-TO] https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/
- [AWS-IDEM] https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/
- [AWS-FB] https://aws.amazon.com/builders-library/avoiding-fallback-in-distributed-systems/
- [AWS-Q] https://aws.amazon.com/builders-library/avoiding-insurmountable-queue-backlogs/
- [AWS-RB] https://aws.amazon.com/builders-library/ensuring-rollback-safety-during-deployments/
- [AWS-LS] https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/
- [AWS-CACHE] https://aws.amazon.com/builders-library/caching-challenges-and-strategies/
- [AWS-HC] https://aws.amazon.com/builders-library/implementing-health-checks/
- [AWS-DIST] https://aws.amazon.com/builders-library/challenges-with-distributed-systems/
- [STRIPE] https://stripe.com/blog/idempotency
- [STRIPE-MIG] https://stripe.com/blog/online-migrations
- [OUTBOX] https://microservices.io/patterns/data/transactional-outbox.html
- [AZ-OUTBOX] https://learn.microsoft.com/azure/architecture/databases/guide/transactional-outbox-cosmos
- [AZ-FMA] https://learn.microsoft.com/azure/well-architected/reliability/failure-mode-analysis
- [AZ-TEST] https://learn.microsoft.com/azure/well-architected/reliability/testing-strategy
- [AZ-TF] https://learn.microsoft.com/azure/architecture/best-practices/transient-faults
- [AZ-STORM] https://learn.microsoft.com/azure/architecture/antipatterns/retry-storm/
- [AZ-IDEMC] https://learn.microsoft.com/azure/architecture/patterns/idempotent-consumer
- [AZ-SEC] https://learn.microsoft.com/azure/well-architected/security/application-secrets
- [KV-DUAL] https://learn.microsoft.com/azure/key-vault/secrets/tutorial-rotation-dual
- [AZ-BLOB] https://learn.microsoft.com/azure/storage/blobs/concurrency-manage
- [SB-LOCK] https://learn.microsoft.com/azure/service-bus-messaging/message-transfers-locks-settlement
- [SB-DLQ] https://learn.microsoft.com/azure/service-bus-messaging/service-bus-dead-letter-queues
- [HANGFIRE] https://docs.hangfire.io/en/latest/best-practices.html
- [QUARTZ] https://www.quartz-scheduler.net/documentation/quartz-3.x/tutorial/more-about-jobs.html
- [HOST] https://learn.microsoft.com/dotnet/core/extensions/generic-host
- [K8S] https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
- [EF-C] https://learn.microsoft.com/ef/core/saving/concurrency
- [EF-R] https://learn.microsoft.com/ef/core/miscellaneous/connection-resiliency
- [EF-MIG] https://learn.microsoft.com/ef/core/managing-schemas/migrations/applying
- [EF-TEST] https://learn.microsoft.com/ef/core/testing/choosing-a-testing-strategy
- [EF-PAGE] https://learn.microsoft.com/ef/core/querying/pagination
- [EF10] https://learn.microsoft.com/ef/core/what-is-new/ef-core-10.0/whatsnew
- [NPG-C] https://www.npgsql.org/efcore/modeling/concurrency.html
- [NPG-DT] https://www.npgsql.org/doc/types/datetime.html
- [PG-ISO] https://www.postgresql.org/docs/current/transaction-iso.html
- [PG-SER] https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html
- [PG-ALTER] https://www.postgresql.org/docs/current/sql-altertable.html
- [PG-NOW] https://www.postgresql.org/docs/current/functions-datetime.html
- [PG-COLL] https://www.postgresql.org/docs/current/collation.html
- [PG-LIMIT] https://www.postgresql.org/docs/current/queries-limit.html
- [SQL-DL] https://learn.microsoft.com/sql/relational-databases/sql-server-deadlocks-guide
- [SQL-LIM] https://learn.microsoft.com/sql/sql-server/maximum-capacity-specifications-for-sql-server
- [J-PH] https://jepsen.io/consistency/phenomena
- [J-PG] https://jepsen.io/analyses/postgresql-12.3
- [NET-RES] https://learn.microsoft.com/dotnet/core/resilience/http-resilience
- [NET-FAKE] https://learn.microsoft.com/dotnet/core/extensions/timeprovider-testing
- [NET-TZ] https://learn.microsoft.com/dotnet/api/system.timezoneinfo.isinvalidtime
- [NET-ADDY] https://learn.microsoft.com/dotnet/api/system.datetime.addyears
- [CRONOS] https://github.com/HangfireIO/Cronos
- [IDM-SKEW] https://learn.microsoft.com/dotnet/api/microsoft.identitymodel.tokens.tokenvalidationparameters.defaultclockskew
- [KESTREL] https://learn.microsoft.com/aspnet/core/fundamentals/servers/kestrel/options
- [TOXI] https://github.com/Shopify/toxiproxy
- [UAX15] https://unicode.org/reports/tr15/
- [RFC8259] https://www.rfc-editor.org/rfc/rfc8259#section-6
- [MDN-SAFE] https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
- [RXJS-EX] https://github.com/ReactiveX/rxjs/blob/7.x/src/internal/operators/exhaustMap.ts
- [RXJS-SW] https://rxjs.dev/api/operators/switchMap
- [RXJS-MM] https://rxjs.dev/api/operators/mergeMap
- [IETF-IK] https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/
- [NG-HTTP] https://angular.dev/guide/http/making-requests
- [NG-SW] https://angular.dev/ecosystem/service-workers/devops
- [PW-CTX] https://playwright.dev/docs/api/class-browsercontext
- [PW-CLOCK] https://playwright.dev/docs/clock
- [BFCACHE] https://web.dev/articles/bfcache
- [BCAST] https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
