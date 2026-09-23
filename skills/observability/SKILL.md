---
name: observability
description: Add, fix, or audit telemetry (OpenTelemetry traces, metrics, logs) so a feature or service can be seen working and failing in production, and check a deployed change's health signal. Covers resource attributes, spans at boundaries, low-cardinality metrics, correlated structured logs, propagation, and sensitive-data checks. Use when a change adds server behavior, when asked "how would we know if this breaks" or "is the deploy healthy", when instrumenting a service, or when auditing telemetry quality. Not for performance tuning without telemetry questions.
---

# Observability

Make the behavior visible where it runs, with the least telemetry that answers:
is it working, and if not, where does it break?

## Before you start

- If `.engineering/overrides/observability.md` exists, read it and apply it.
- Read `$HARNESS/core/observability.md` (conventions and what never goes into
  telemetry) and each active profile's `references/observability.md` (stack
  setup).
- Find the existing setup: SDK and version, exporters, backend (e.g. Azure
  Monitor, Grafana, Datadog, Jaeger), sampling, logging integration. Extend it;
  never introduce a parallel stack.

## Modes

- **instrument**: add telemetry for a specific feature or change.
- **audit**: assess a service's telemetry quality and gaps.
- **post-deploy**: check that a deployed change is healthy, using the health
  signal named in its plan or release.

## Procedure (instrument)

1. **Write the questions** an on-call engineer would ask about this behavior
   (did it run, did it fail, how slow, for which operation, how often).
2. **Map each question to a signal**: span (flow and latency), metric (rates and
   alerting), log event (context a span cannot carry). Remove signals that
   answer no question.
3. **Check what automatic instrumentation already gives** (HTTP server/client,
   database, messaging). Add manual spans only at meaningful boundaries the
   automatic layer misses, using the project's existing activity source or
   tracer.
4. **Attributes**: semantic conventions first; custom ones namespaced (e.g.
   `app.*`) and low-cardinality. Record ids and counts, not payloads.
5. **Errors**: set span status and record the exception on failure paths; log
   once at the boundary that handles the error, not at every layer.
6. **Sensitive data check**: grep your diff for any logged or attributed value
   that could hold secrets or personal data. Remove or redact.
7. **Verify locally**: run the app or an integration test with a console or
   local OTLP exporter and show the emitted span/metric/log. Telemetry that was
   never observed is not verified.
8. **Document how to find it**: the query, dashboard, or alert that uses the new
   signals, if the project keeps those in the repo.

## Procedure (audit)

1. Check resource attributes (`service.name`, `service.version`, environment).
2. Check propagation across service boundaries and from the frontend.
3. Check that logs carry trace context and are structured.
4. Check metric cardinality and naming, sampling configuration, and error
   recording.
5. Search for sensitive data in log statements and span attributes.
6. Pick two critical user flows and check whether a failure in each would be
   visible and attributable. Gaps here are the top findings.

## Procedure (post-deploy)

1. Find the health signal the plan or release named. If none was named, derive
   one: the error rate and latency of the changed operation, plus any business
   counter it moves.
2. Query it in the target environment with the access the project documents in
   `AGENTS.md` (*Observability*). If you have no access, write the exact query
   for the human to run and stop there.
3. Compare with the period before the deploy: same operation, same time window.
4. Report healthy, degraded, or unknown, with the numbers. Degraded means
   recommend the rollback from the plan; the human decides.

## Output

```markdown
## Observability: <feature or service>, <mode>

**Questions -> signals**
| Question | Signal | Name / attributes | Status |
|---|---|---|---|

**Changes** (instrument): files and what each adds
**Local evidence**: exporter output or test showing the signal
**Findings** (audit): severity, evidence, fix
**Sensitive data check**: result
**Post-deploy**: signal, before vs after, verdict (healthy/degraded/unknown)
```
