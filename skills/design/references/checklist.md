# System design checklist

Walk the sections in order and write down only what changes the design. A
section that does not apply gets one line saying why.

## 1. Frame

- Who uses it (people, devices, other services), and what do they need done?
- Goals stated as outcomes; non-goals stated just as clearly, because they
  are what keeps the design small.

## 2. Quality attributes, with numbers

| Attribute | Question | Example target |
|---|---|---|
| Load | Peak and average requests, messages, or events per second; how many clients connected at once | 2,000 devices, one message each per 10 s |
| Latency | Which operation, which percentile | p95 under 300 ms for command delivery |
| Availability | Allowed downtime, and for which path | 99.5% for telemetry ingest; admin UI best effort |
| Durability | What may be lost, how much | No acknowledged telemetry lost; RPO 15 min, RTO 1 h |
| Consistency | Who must see a write, and how soon | Device state visible to the operator within 5 s |
| Data | Volume per day and retention | 170 MB/day, 90 days hot, then archive |
| Security and compliance | Identities, data classes, regulations (LGPD) | Personal data stays in-region |
| Cost | Monthly ceiling, unit cost | Under R$ 300/month at 2,000 devices |
| Delivery | Deadline, team size, skills on hand | One developer, six weeks |

Every target says where it came from: a measurement, the user, or an
assumption to confirm.

## 3. Estimates

- Rate = clients × actions per client ÷ seconds. Multiply by a peak factor
  (2-10×) taken from real traffic when it exists.
- Storage per day = rate × payload size × 86,400; multiply by retention and by
  replicas or indexes.
- Connections, bandwidth, and any per-message cost (broker, cloud function,
  log ingestion) scale with the same rate; compute the one that is binding.
- Round aggressively. The goal is the order of magnitude that rules options in
  or out.

## 4. Building blocks to question

- **Synchronous or asynchronous.** A queue or broker buys decoupling and
  buffering, and costs ordering, duplicates, and an extra moving part.
- **State and data.** Who owns each piece of data; one writer per entity;
  relational, document, time-series, or blob storage, chosen by access pattern.
- **Idempotency and ordering.** Every retried operation has a key; consumers
  tolerate duplicates and out-of-order delivery; the outbox pattern when a
  database write and a message must both happen.
- **Failure handling.** Timeouts on every remote call, bounded retries with
  backoff and jitter, circuit breakers where a dependency can hang, a defined
  degraded mode, back-pressure instead of unbounded queues.
- **Identity.** How each actor (user, device, service) proves who it is, how
  credentials are issued, rotated, and revoked, and what one stolen credential
  can reach.
- **Multi-tenancy.** Where the tenant is enforced (query filter, row-level
  security, separate store) and how a leak across tenants is prevented twice.
- **Evolution.** Versioned contracts, expand-contract for schema and message
  changes, and how clients in the field (old apps, old firmware) keep working.

## 5. Operability

- The SLIs that show the design working, and the alert that fires before users
  notice.
- How it is deployed, migrated, rolled back, and backed up; what a restore
  test looks like.
- What a person must do by hand, and how often.

## 6. Comparing options

Use the same criteria for every option, in one table. Add "Do nothing" or "the
smallest change to what exists" when it is viable; it is often the right
answer for now. State what would make you switch to the runner-up: a number
crossing a threshold, a requirement changing, a cost appearing.
