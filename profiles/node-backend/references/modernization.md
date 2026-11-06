# Modernization catalog (Node.js)

Older Node idioms, what replaces each, and the risk of the move.
`architecture-audit` (focus `modernization`) measures how much old and new
coexist and turns that into a backlog; every item is then carried out as a
refactor or migration following `$HARNESS/core/lifecycle.md` (*Migration*).

## Runtime and tooling

| Legacy | Modern | Risk | Notes |
|---|---|---|---|
| Node 20 or older, Node 22 | Node 24 or 26 | Medium | Order in `currency.md` |
| CommonJS (`require`, `module.exports`) | ESM | Medium-High | Import extensions, `import.meta.dirname` for `__dirname`. CommonJS can load ESM-only packages through `require(esm)`, so the move is a choice, not a forced one |
| `ts-node` or `tsx` in production | `tsc` or bundle output; Node's type stripping for erasable-only code | Low-Medium | Stripping is stable since 24.12 and 25.2. It rejects `enum`, runtime `namespace`, parameter properties, and decorators, so Nest code still needs a compiler |
| `nodemon` | `node --watch` | Low | Stable since 22.0 and 20.13 |
| `dotenv` | `--env-file`, `--env-file-if-exists` | Low | Both left experimental status in 24.10 and 22.21 |
| `request`, `node-fetch`, `axios` for simple calls | global `fetch` with `AbortSignal.timeout` | Low-Medium | Interceptors, default timeouts, and error-on-4xx behavior need explicit replacements |
| Jest with `ts-jest` or Babel | `node:test` or Vitest | Medium | Jest loads the ESM-only Nest 12 packages only on Node 24.9+ |
| ESLint and Prettier | Biome or oxlint | Low-Medium | Keep a type-aware floating-promise check; Biome's is still a nursery rule |
| `new Buffer(...)` | `Buffer.from`, `Buffer.alloc` | Low | |
| Callback `fs`, `util.promisify` wrappers | `node:fs/promises`; `node:` specifiers | Low | Only in files already being changed, or as one mechanical commit |
| `Math.random()` identifiers or tokens | `crypto.randomUUID()`, `crypto.randomBytes()` | Low | A security fix when the value is a secret |

## Frameworks and libraries

| Legacy | Modern | Risk | Notes |
|---|---|---|---|
| Express 4 | Express 5 | Medium | Named wildcards (`/*splat`), braces for optional segments, `req.body` undefined until parsed, `urlencoded` `extended` now false, rejected async handlers reach error middleware |
| NestJS 11 | NestJS 12 | Medium | `nestjs.md` lists the changes; `nest upgrade` does the mechanical part |
| class-validator DTOs | Standard Schema (`schema` option, `StandardSchemaValidationPipe`) | Medium | Optional in Nest 12. Convert module by module; one module validated two ways is the worst state |
| `helmet` in a Nest app | `app.useSecurityHeaders()` (12.1) | Low | Same option names; function values in CSP directives and Helmet's legacy option names are not accepted |
| `@opentelemetry/instrumentation-fastify` | `@fastify/otel` | Low | The old package was removed in March 2026 |
| zod 3 | zod 4 | Medium | Required by MCP SDK v2 (`^4.2.0`); follow zod's own migration guide |

## MCP servers

| Legacy | Modern | Risk | Notes |
|---|---|---|---|
| `@modelcontextprotocol/sdk` (v1) | `@modelcontextprotocol/server` (v2) | Medium | Codemod plus manual steps; `serveStdio`, `createMcpHandler`, `z.object` schemas. See `mcp-servers.md` |
| HTTP+SSE transport (2024-11-05) | Streamable HTTP | Medium | Deprecated by the spec since 2025-03-26; absent from SDK v2 |
| Session-based Streamable HTTP (up to 2025-11-25) | Stateless revision 2026-07-28, state in explicit handles bound to the user | Medium-High | Clients on the old revision still need answers during the transition |
