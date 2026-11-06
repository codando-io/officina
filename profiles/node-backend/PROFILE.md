# Profile: node-backend

Node.js services in TypeScript (or JavaScript checked through JSDoc): HTTP APIs
on `node:http`, Express, Fastify, Hono, or NestJS, workers, and MCP servers
built on the MCP TypeScript SDK, installed with npm or pnpm.

Last reviewed: 2026-11-06 (Node 26 Active LTS; NestJS 12; MCP TS SDK v2).

## Detection

- `package.json` with `@nestjs/core`, `express`, `fastify`, `hono`, or `koa`,
  or code calling `createServer` from `node:http`. MCP servers depend on
  `@modelcontextprotocol/server` (v2) or `@modelcontextprotocol/sdk` (v1).
- `package-lock.json` means npm; `pnpm-lock.yaml` plus `pnpm-workspace.yaml`
  means pnpm. `packageManager` in `package.json` pins the version.
- Node pin: `.nvmrc`/`.node-version`, `engines.node`, CI setup, `FROM node:<n>`,
  or a Nix/devenv package (`nodejs_22`). `nest-cli.json` marks NestJS.
- Not for frontend-only build scripts; a repo with an app and a server lists
  both profiles.

Quick inventory: `$HARNESS/bin/stack-report --offline` (lockfile, `.nvmrc`).

## Verification ladder

Cheapest first; `<pm>` is `npm` or `pnpm`; a `check` script is the last rung.

1. Types: the `typecheck` script, else `<pm> exec tsc --noEmit -p <tsconfig>`
   (the server's tsconfig when a frontend shares the repo). Type stripping,
   `tsx`, and esbuild run code without checking any types.
2. The targeted test: `node --test --test-name-pattern "<name>" <file>`,
   `<pm> exec vitest run <file> -t "<name>"`, or `<pm> exec jest <file> -t
   "<name>"`. When the `test` script builds or bundles first, run the script.
3. `<pm> test`, then the lint script (Biome, ESLint, oxlint) with the warning
   count compared before and after.
4. `<pm> run build`, then start the built entry (`node dist/main.js`) until it
   listens or answers once; ESM/CJS interop errors surface only there. For a
   published package, `npm pack --dry-run` shows what actually ships.
5. Dependencies changed: a clean `npm ci` or `pnpm install --frozen-lockfile`,
   then `npm audit --omit=dev` or `pnpm audit --prod`. `docker build .` when the
   image or startup changed; for an MCP server, list its tools from the build.

## Conventions to discover

Each project settles these in `AGENTS.md`; read its answer before writing:

- Module system and TypeScript execution: ESM or CommonJS; `tsc` output, an
  esbuild/tsup bundle, `tsx`, Node running `.ts` directly (erasable syntax,
  `.ts` import extensions, no tsconfig `paths`), or JavaScript with `checkJs`.
- Layout: Nest feature modules or plain handlers; pure domain code apart from
  the HTTP edge; an app factory (`createApp(config)`) separate from `listen`.
- Validation: class-validator DTOs behind `ValidationPipe`, Standard Schema
  (zod, Valibot) via `StandardSchemaValidationPipe` or middleware, or
  hand-written readers. Which zod major.
- Config (`@nestjs/config`, a `readConfig(env)` that throws, `--env-file`,
  dotenv); the error body shape; the logger (Nest `Logger`, pino, `console`).
- Tests: node:test, Vitest, or Jest; beside the source or under `test/`; a real
  server on port 0, `supertest`, or `Test.createTestingModule`.
- Monorepo: pnpm workspaces with `catalog:` versions and `workspace:*` links.

## House defaults for new code

They yield to `AGENTS.md`, to the file being edited, and to pinned versions.

- Node 26 (Active LTS) or the newest LTS the platform runs; ESM; `strict` with
  `noUncheckedIndexedAccess`; built-ins (`fetch`, `node:test`, `--env-file`).
- Edge schemas that reject unknown keys; config validated once at startup.

## Pitfalls

Runtime:
- Event-loop blocking: `fs.*Sync`, `pbkdf2Sync`/`scryptSync` on a request path,
  `JSON.parse` of huge bodies, user input in a backtracking regex. Measure with
  `monitorEventLoopDelay` (`node:perf_hooks`); offload to `worker_threads`.
- Floating promises lose errors and ordering; `void` handles nothing. Lint with
  `@typescript-eslint/no-floating-promises` (Biome's rule is nursery, opt-in).
- Unhandled rejections end the process (mode `throw`, default since Node 15);
  a listener that only logs keeps a broken process alive. Express 4 leaves a
  rejected async handler unhandled; Express 5 passes it to error middleware.
- `fetch` without a deadline: undici allows 10 s to connect, then 300 s for
  headers and 300 s between body chunks. Pass `AbortSignal.timeout(ms)`, joined
  to the caller's signal with `AbortSignal.any`.
- No SIGTERM handling, so deploys cut requests. Nest runs shutdown hooks on
  signals only after `app.enableShutdownHooks()`.
- A type or `as` cast on a body validates nothing. `ValidationPipe` keeps
  undecorated fields; `whitelist: true` strips them silently, and adding
  `forbidNonWhitelisted: true` rejects the request. In zod, `z.object()`
  strips and `z.strictObject()` rejects.

Security, by area of `$HARNESS/core/security.md` §5:
- Injection: Prisma `$queryRawUnsafe`/`$executeRawUnsafe`, TypeORM `query()` or
  string-built `.where()`, Knex `whereRaw` without bindings, Drizzle
  `sql.raw()`; Mongo operators in JSON (`{"$ne": null}`); `child_process.exec`
  with user input instead of `execFile` with an argument array.
- SSRF: `fetch` to a host from the request, a webhook, or a federation lookup
  that accepts IP literals or follows redirects. Allowlist or egress proxy.
- Deserialization: `JSON.parse` throws on bad input (answer 400) and keeps
  `"__proto__"` as a key, so a deep merge or `obj[a][b] = v` with user keys
  pollutes `Object.prototype`. Use `Map` or `Object.create(null)`.
- Authorization: controllers the global guard (`APP_GUARD`) does not cover or
  a public decorator exempts; `jwt.verify` without `algorithms`;
  `jose.jwtVerify` without `audience`.
- Mass assignment: `repository.save({ ...req.body })`, `Object.assign(entity,
  dto)`, `prisma.x.update({ data: body })`. Copy allowed fields; `whitelist`
  does not help when the DTO itself declares `ownerId`.
- Abuse: auth and costly routes without `@nestjs/throttler` (`ThrottlerGuard`
  as `APP_GUARD`, `@Throttle()` per route; its memory store is per instance).
  Express `trust proxy` set to `true` believes a client-written
  `X-Forwarded-For`; name the proxy address or hop count instead.
- Web and headers: CORS `origin: true` (or an unanchored origin RegExp) with
  `credentials: true` lets any site read authenticated responses. No security
  headers by default: NestJS 12.1+ `app.useSecurityHeaders()`, else `helmet`.
- Limits and exposure: a `node:http` body reader with no byte cap (answer 413),
  queries without `take`/`limit`, `req.headers` or whole bodies in logs.
- Crypto: tokens from `Math.random()`, secrets compared with `===` (use
  `crypto.timingSafeEqual`), passwords hashed without Argon2id, bcrypt, scrypt.

Supply chain:
- `npm install` in CI rewrites the lockfile; `npm ci` fails on a mismatch and
  never writes. pnpm freezes the lockfile in CI by default.
- npm 12 blocks dependency install scripts missing from `allowScripts`; Node 22
  to 26 bundle npm 10/11, which run them. pnpm runs only `allowBuilds` entries.
  A new approval is a review item under `$HARNESS/core/security.md` §4, as is
  `npx -y <pkg>` without a version.
- Node versions that disagree across `.nvmrc`, `engines`, CI, the image, and a
  bundler `--target`. npm ignores `engines` unless `engine-strict` is set.

MCP servers (details in `references/mcp-servers.md`):
- stdio: one `console.log` on stdout corrupts the protocol stream; point
  `console` at stderr first. Streamable HTTP: check `Origin` and `Host`, bind to
  127.0.0.1 locally, authenticate, never forward the client's token.
- Tool arguments and fetched content are untrusted (`$HARNESS/core/security.md`
  §1): bound every `inputSchema` field, check permissions in the handler, and
  make destructive tools require an explicit confirmation argument.

## References

| File | Used by |
|---|---|
| `references/nestjs.md` | `plan`, `implement`, `review` on NestJS code |
| `references/mcp-servers.md` | `plan`, `implement`, `review`, `security-audit` on MCP servers |
| `references/currency.md` | `dependency-update`, `architecture-audit` (modernization), `security-audit` |
| `references/modernization.md` | `architecture-audit` (modernization), `plan` for migrations |
| `references/observability.md` | `observability` |
| `references/failure-testing.md` | `test`, `review` (tools for the failure-scenario catalog) |
