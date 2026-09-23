# Observability policy

Observability answers one question after a deploy: is it working for users, and
if not, where does it break? Instrument to answer that question, not to collect
data.

## Signals (OpenTelemetry)

| Signal | Use for | Typical mistake |
|---|---|---|
| Traces | Following one request across services, finding where time goes and where it fails | Spans for every function; missing spans at process boundaries |
| Metrics | Rates, errors, durations, saturation; alerting; trends | High-cardinality labels (user id, full URL) |
| Logs | Discrete events with context that traces and metrics cannot carry | Logging what a span or metric already records; unstructured strings |

Prefer the project's existing setup. Do not introduce a second telemetry stack.

## Context and correlation

Put stable identity on the **resource**, not on every log line:

| Attribute | Where it goes |
|---|---|
| `service.name`, `service.version` | Resource attributes |
| `deployment.environment.name` | Resource attribute (older semconv: `deployment.environment`; follow what the project's SDK version emits) |
| `trace_id`, `span_id` | Injected into logs by the OpenTelemetry logging integration; do not add by hand |
| Operation | Span name and semantic attributes (`http.route`, `db.operation.name`, `messaging.operation.name`) |
| `request_id` | Keep only if an existing consumer depends on it; `trace_id` already correlates a request |

Propagate W3C `traceparent` across HTTP and messaging. Frontend-to-API
propagation requires the API's CORS policy to allow the `traceparent` and
`tracestate` headers.

## Custom attributes

- Use the semantic conventions when one exists. Check before inventing.
- Namespace custom attributes with the application or organization
  (`app.intent`, `acme.tenant.tier`). Do not use namespaces owned by the
  conventions: `telemetry.*` is reserved (`telemetry.sdk.*`), so do not create
  `telemetry.intent`.
- An intent attribute (`app.intent = "checkout.apply_coupon"`) is useful when
  one route serves several business operations. Keep it low-cardinality.

## What never goes into telemetry

- Secrets, tokens, API keys, connection strings, cookies, `Authorization` headers.
- Personal data (names, emails, documents, addresses, IPs where regulated)
  unless the project has an explicit, documented policy allowing it.
- Full request or response bodies, SQL with literal parameter values, or LLM
  prompts and completions. Record sizes, counts, hashes, or ids instead. If a
  payload is truly needed for debugging, make it opt-in, sampled, redacted, and
  time-limited.

## What a change should leave behind

For new or changed server behavior, the reviewer should be able to answer:

1. Which span shows this operation, and what are its key attributes?
2. Which metric would move if it broke (error rate, latency, a business counter)?
3. Which log event explains a failure that the span status alone does not?
4. How would you find this in the project's backend (query, dashboard, alert)?

"None, because the existing instrumentation already covers it" is a valid
answer when you show where.

## Cost and noise

- Sample traces at the head or tail according to the project's setup; keep
  errors.
- Metrics dimensions must be bounded. Ask "how many distinct values in a day?".
- Log levels mean something: `Error` is actionable, `Warning` is unexpected but
  handled, `Information` is a business event, `Debug` is off in production.
