# OpenTelemetry in Angular

Browser telemetry setup. What to record and what never to record is decided in
`$HARNESS/core/observability.md`.

## Browser tracing

- Browser tracing: `@opentelemetry/sdk-trace-web` plus the instrumentation that
  matches the `HttpClient` backend. Angular 22 uses `FetchBackend` by default
  (`withFetch()` is deprecated), so use `@opentelemetry/instrumentation-fetch`.
  Angular 21 and earlier use XHR unless `withFetch()` is set, so use
  `@opentelemetry/instrumentation-xml-http-request` there.
- Set `propagateTraceHeaderCorsUrls` to the API origins only, and allow
  `traceparent`/`tracestate` in the API's CORS policy.
- Export to a collector endpoint, never directly to a vendor with a key in the
  bundle: anything in the frontend is public.
- Keep it small: page loads, API calls, and a few business interactions. Do not
  attach user input values.
- If full browser tracing is too much, propagating a trace context from the API
  response (or generating one per user action) still lets support correlate a
  user report with backend traces.

