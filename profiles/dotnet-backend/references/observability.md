# OpenTelemetry for ASP.NET Core

Stack-specific setup. General rules (what to record, what never to record,
attribute naming) are in `$HARNESS/core/observability.md`.

## ASP.NET Core

Typical setup, to compare with what the project has:

```csharp
builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService(
        serviceName: "orders-api",
        serviceVersion: typeof(Program).Assembly.GetName().Version?.ToString()))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddSource("Orders.*"))            // the app's own ActivitySources
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation()
        .AddMeter("Orders.*"))             // the app's own Meters
    .UseOtlpExporter();                    // or UseAzureMonitor() with the Azure Monitor distro

builder.Logging.AddOpenTelemetry(o =>
{
    o.IncludeScopes = true;
    o.IncludeFormattedMessage = true;
});
```

- Packages: `OpenTelemetry.Extensions.Hosting`, instrumentation packages for
  ASP.NET Core, HttpClient, runtime; `OpenTelemetry.Exporter.OpenTelemetryProtocol`
  or `Azure.Monitor.OpenTelemetry.AspNetCore`. Some instrumentation packages
  (SqlClient, EF Core) have been prerelease for a long time; check their status
  and the project's policy on prerelease packages before adding them.
- Environment: set `deployment.environment.name` through
  `OTEL_RESOURCE_ATTRIBUTES` in deployment config rather than code.
- If the solution uses .NET Aspire, the `ServiceDefaults` project already wires
  most of this (OTLP exporter only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set,
  health endpoints); extend it there instead of adding a second setup.
- Manual spans: one static `ActivitySource` per component
  (`new ActivitySource("Orders.Checkout")`), `StartActivity` only at meaningful
  boundaries (a business operation, an external call not auto-instrumented, a
  background job iteration). Always dispose (`using var activity = ...`).
- Metrics: create `Meter` through `IMeterFactory` (.NET 8+), counters and
  histograms with bounded tags. ASP.NET Core already emits
  `http.server.request.duration`; do not duplicate it.
- Logs: `ILogger` with message templates (`"Order {OrderId} rejected"`), never
  string interpolation. Trace and span ids are attached automatically when OTel
  logging is enabled.
- Errors: `activity?.SetStatus(ActivityStatusCode.Error, ...)` and
  `activity?.AddException(ex)` (.NET 9+; `RecordException` from
  `OpenTelemetry.Api` on older targets) on handled failures that matter.
- Do not log request/response bodies via HTTP logging middleware in production.
  If `UseHttpLogging` is on, check which fields it records.

## SQL visibility

Database spans come from the provider or EF Core instrumentation: on
PostgreSQL, Npgsql emits its own activities (`Npgsql.OpenTelemetry`,
`.AddNpgsql()` on the tracer builder); on SQL Server, SqlClient
instrumentation. Do not enable
recording of SQL text with parameter values in production. Statement text
without literals is usually acceptable; check the instrumentation options.

## Local verification

- Console exporter or a local collector + Jaeger/Aspire dashboard via Docker to
  see spans while developing.
- In integration tests, an in-memory exporter can assert that a span with the
  expected name and attributes was emitted for a critical operation.
