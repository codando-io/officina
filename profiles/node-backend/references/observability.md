# OpenTelemetry for Node.js services

Node-specific setup. The rules on what to record, and what never to record,
are in `$HARNESS/core/observability.md`. Checked 2026-11-06 on
<https://opentelemetry.io/docs/zero-code/js/>,
<https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/esm-support.md>,
and the READMEs of `@opentelemetry/auto-instrumentations-node` and
`@opentelemetry/instrumentation-pino`.

## Starting the SDK

- Instrumentation must be running before the application's modules load. Put
  the SDK setup in its own file and preload it: `--require ./telemetry.js`
  for CommonJS, `--import ./telemetry.js` for ESM. Without code,
  `@opentelemetry/auto-instrumentations-node/register` does the same.
- ESM output also needs the loader hook, or imported packages stay unpatched:

  ```sh
  node --experimental-loader=@opentelemetry/instrumentation/hook.mjs \
    --import ./telemetry.js dist/main.js
  ```

- A CommonJS app needs that hook as well when an ESM dependency imports the
  package an instrumentation patches. In NestJS 12, `@nestjs/platform-express`
  is ESM and imports `express`, so without the hook the Express
  instrumentation patches nothing and server spans carry no `http.route`.
- Development runners: `tsx` running ESM takes the setup through `--import`;
  `ts-node` only works when the module format is CommonJS.
- A bundle that inlines instrumented packages (esbuild with no externals) may
  leave nothing for the instrumentation to patch (unverified: confirm the spans
  appear, or mark those packages external).
- Configure through the environment: `OTEL_SERVICE_NAME`,
  `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_RESOURCE_ATTRIBUTES` for
  `deployment.environment.name`, and `OTEL_NODE_ENABLED_INSTRUMENTATIONS` or
  `OTEL_NODE_DISABLED_INSTRUMENTATIONS` (the enabled list applies first).

## Instrumentations

- The auto-instrumentation bundle enables every supported package unless
  marked default-disabled, as `fs` and host metrics are. It includes `http`,
  `undici` (which carries Node's `fetch`), `express`, `nestjs-core`, `pino`,
  and `winston`.
- `@opentelemetry/instrumentation-fastify` was removed in March 2026; Fastify
  apps use `@fastify/otel`, maintained by the Fastify authors.
- Log correlation: the pino instrumentation adds `trace_id`, `span_id`, and
  `trace_flags` to each record written inside a span, and can also send records
  to the OpenTelemetry Logs SDK (`disableLogSending: true` turns that off).

## Manual spans and metrics

- One tracer and one meter per component (`trace.getTracer('orders')`,
  `metrics.getMeter('orders')`). Open spans at business operations, outbound
  calls the instrumentation misses, and each iteration of a background job.
- `tracer.startActiveSpan(name, async (span) => { ... })` with `span.end()` in
  a `finally`; on a handled failure that matters, `span.recordException(err)`
  and `span.setStatus({ code: SpanStatusCode.ERROR })`.
- Counters and histograms with bounded attribute values. The HTTP
  instrumentation already records server request duration; do not add a second
  one.

## MCP servers on stdio

`ConsoleSpanExporter` prints with `console.dir`, which writes to stdout and
slips past a redirect that only replaces `console.log` and its siblings. On a
stdio MCP server, export over OTLP instead.
