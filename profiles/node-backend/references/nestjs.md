# NestJS 12

What to know when planning, writing, or reviewing NestJS code. Checked
2026-11-06 on <https://docs.nestjs.com/migration-guide>,
<https://docs.nestjs.com/techniques/validation>, <https://docs.nestjs.com/pipes>,
<https://docs.nestjs.com/exception-filters>,
<https://docs.nestjs.com/security/helmet>, <https://docs.nestjs.com/security/cors>,
<https://docs.nestjs.com/security/rate-limiting>, and
<https://docs.nestjs.com/fundamentals/lifecycle-events>.

## From 11 to 12

| Change | What it means for the code |
|---|---|
| Core packages are ESM | CommonJS apps keep running through `require(esm)`. Moving the app to ESM is optional: `"type": "module"`, `nodenext`, `.js` on relative imports, `import.meta.dirname` |
| Node 20.19+ or 22.12+ to run; 22.22.3+, 24.15+, or 26+ for the CLI generators | An app that runs on Node 20 still cannot use `nest generate` there |
| TypeScript 6 minimum | `@nestjs/schematics` 12 declares it as a peer |
| Jest loads the ESM-only packages only on Node 24.9+ | Older Node fails with `ERR_REQUIRE_ASYNC_MODULE`. New ESM projects default to Vitest, and every new project to oxlint |
| Standard Schema support | `schema` option on `@Body()`, `@Query()`, `@Param()`, `@MessageBody()`, `@Payload()`; `StandardSchemaValidationPipe`; `StandardSchemaSerializerInterceptor` |
| `ValidationPipe` `errorFormat` (`'list'` or `'grouped'`) | The validation error body is now a choice; clients may parse the old shape |
| `@nestjs/config` takes Standard Schema | Joi keeps working from v18, with its options under `validationOptions.libraryOptions` |
| Lifecycle hooks run by component hierarchy level | `onModuleInit` and shutdown order can change between dependent providers |
| `@Optional()` is not inherited by a redeclared constructor | 12.1 restores inheritance when the subclass declares no constructor |
| Removals and replacements | Terminus legacy health indicators removed (use `HealthIndicatorService`); GraphQL `subscriptions-transport-ws` removed (use `graphql-ws`); NATS moves from `nats` to `@nats-io/transport-node`; `--webpack` deprecated for `--builder rspack` |
| `HttpExceptionOptions.errorCode` | Serialized into the body for clients to branch on; `cause` is never serialized |
| 12.1 `app.useSecurityHeaders()` | Built-in security headers; see below |

## Validation

- Register `ValidationPipe` as an `APP_PIPE` provider. It can then inject
  dependencies, and e2e tests that import `AppModule` get it too; a pipe set
  with `useGlobalPipes()` in `main.ts` is absent from those tests, and in a
  hybrid app it does not reach connected microservices.
- Options: `whitelist: true`, `forbidNonWhitelisted: true`, and
  `transform: true` when handlers need DTO instances. Path and query values
  are strings; without `transform`, convert with `ParseIntPipe` or
  `ParseBoolPipe`.
- Nothing is validated for a parameter typed as an interface, a generic, or a
  type-only import (`import type` erases the class). `CreateUserDto[]` bodies
  need `ParseArrayPipe({ items: CreateUserDto })` or a wrapper class. Nested
  DTOs need `@ValidateNested()` and `@Type(() => Child)`, because
  class-validator only descends into class instances.
- `StandardSchemaValidationPipe` passes values without a `schema` through, so
  binding it globally is safe. Unknown keys follow the schema: in zod,
  `z.looseObject()` keeps them. Custom parameter decorators are skipped unless
  `validateCustomDecorators` is on.

## Bootstrap order in `main.ts`

```ts
const app = await NestFactory.create(AppModule);
app.useSecurityHeaders(); // 12.1+, right after create(), before any app.use()
app.enableCors({
  origin: ['https://app.example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});
app.enableShutdownHooks();
await app.listen(process.env.PORT ?? 3000);
```

- `useSecurityHeaders()` works the same on Express and Fastify. It sends
  Helmet 8's defaults (a CSP, HSTS for a year with subdomains, `nosniff`,
  `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer`, COOP and CORP
  `same-origin`) and removes `X-Powered-By`. It throws when called twice or
  after `init()`/`listen()`, and responses sent by middleware registered before
  it carry no headers. A project already on `helmet` (Express, `app.use`) or
  `@fastify/helmet` (Fastify, `app.register`) may keep it.
- CSP and dev tools: Swagger UI served over plain HTTP outside local
  development fails under `upgrade-insecure-requests`; GraphiQL and Apollo
  Sandbox load from CDNs. Loosen the policy for those outside production only.
- CORS runs on `cors` (Express) or `@fastify/cors` (Fastify), and their default
  methods differ: Express allows `PUT`, `PATCH`, and `DELETE`, Fastify does not.
- `@nestjs/throttler`: `ttl` is in milliseconds; `ThrottlerGuard` goes in
  `APP_GUARD`; `@Throttle()` tightens a route and `@SkipThrottle()` exempts one.
  The default store lives in process memory, so replicas need a shared store.
  Behind a proxy, trust it in the adapter or override `getTracker()`. On Fastify
  5.12.1+, a numeric `trustProxy` such as `1` trusts no proxy: pass the proxy's
  address or range. WebSocket and GraphQL use need a subclassed guard.
- Shutdown hooks are off by default. Without `enableShutdownHooks()`,
  `onModuleDestroy`, `beforeApplicationShutdown`, and `onApplicationShutdown`
  run only when code calls `app.close()`.

## Errors

- An exception that is not an `HttpException` reaches the client as
  `{"statusCode": 500, "message": "Internal server error"}`. A custom catch-all
  filter must keep that property: no `err.message` or stack in the body.
- Global filters: `APP_FILTER` providers can inject dependencies;
  `useGlobalFilters()` cannot, and does not cover gateways or hybrid apps.

## Tests

- `Test.createTestingModule({ imports: [AppModule] })` with
  `overrideProvider(...)` for the one dependency under control, then
  `createNestApplication()`. Global setup that lives only in `main.ts` (pipes,
  headers, CORS) is missing there unless the test applies it or it moves into
  module providers.
- Telemetry in a CommonJS Nest 12 app needs the ESM loader hook (see
  `observability.md`).
