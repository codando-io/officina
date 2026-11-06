# MCP servers in TypeScript

Checked 2026-11-06 on specification revision 2026-07-28
(<https://modelcontextprotocol.io/specification/2026-07-28/basic/transports>),
<https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices>,
the SDK repository <https://github.com/modelcontextprotocol/typescript-sdk>
(`docs/serving/`, `docs/servers/tools.md`, the v2 upgrade guide), and the npm
registry.

## SDK lines

| | v1 | v2 |
|---|---|---|
| Packages | `@modelcontextprotocol/sdk` | `@modelcontextprotocol/server` and `/client`; adapters `@modelcontextprotocol/node`, `/express`, `/hono`, `/fastify` (the framework is a peer you install) |
| Latest | 1.32.2 | 2.4.0 (2.0.0 on 2026-07-27) |
| Tool schemas | zod 3.25+ or 4; raw shapes | Standard Schema objects (`z.object(...)`; raw shapes deprecated); zod `^4.2.0`; JSON Schema 2020-12 on the wire |
| stdio | `new StdioServerTransport()` plus `server.connect()` | `serveStdio(() => server)` from `@modelcontextprotocol/server/stdio` |
| HTTP | `StreamableHTTPServerTransport`, `SSEServerTransport` | `createMcpHandler(factory)`; the SSE server transport is gone (a frozen copy lives in `@modelcontextprotocol/server-legacy/sse`) |
| Runtime | Node 18+ | Node 20+; ESM with a CommonJS build |
| Support | fixes for at least six months after 2026-07-27 | the stable line |

Migration: run the SDK's codemod, then the manual steps in
<https://ts.sdk.modelcontextprotocol.io/v2/migration/upgrade-to-v2>. Both lines
install side by side under different names, so a large server can move
directory by directory, but objects must not cross between v1-imported and
v2-imported code. In a workspace pinned to zod 3, each v2 package nests its own
zod 4 copy until the workspace moves to `^4.2.0`.

## Choosing a transport

- stdio: the client launches the server as its child process. One client, no
  listening socket. The default for a server that people run on their own
  machine (local files, devices, credentials that must stay local).
- Streamable HTTP: one POST endpoint that many clients share. Revision
  2026-07-28 removed protocol sessions and the GET stream. v2's handler still
  answers 2025-era clients statelessly by default (`legacy: 'stateless'`;
  `'reject'` makes it modern-only), without their sessions. The 2024-11-05
  HTTP+SSE transport is deprecated: build nothing new on it.
- The 2026-07-28 protocol is stateless and servers send no requests of their
  own; they return an `InputRequiredResult` when they need input. State that
  spans calls travels as an explicit handle, bound server-side to the verified
  user; holding a handle is never proof of identity.

## stdio

- The spec forbids writing anything to stdout that is not a valid MCP message
  and allows UTF-8 logging on stderr, which clients should not read as errors.
- ESM evaluates every static import before the entry module's own body runs.
  A `console` redirect called in `main.ts`'s body therefore comes after any
  imported module that logs while loading; put the redirect in a side-effect
  module imported first, or preload it with `--import`.
- The redirect must cover every `console` method that prints to stdout,
  `dir` and `table` included. Loggers that default to stdout (pino, for one)
  need an explicit stderr destination, and a direct `process.stdout.write`
  stays a bug.
- Keep a test that spawns the built server, writes requests to stdin, and
  parses every stdout line as JSON-RPC, as a client would.
- Exit when stdin reaches end-of-file: the spec makes that the primary
  shutdown signal, and clients escalate to SIGTERM and then SIGKILL. v2 closes
  the transport itself on EOF; release timers, pools, and device handles in
  `server.server.onclose`, or the process stays alive holding them.

## Streamable HTTP

- The spec requires validating `Origin` on every connection (403 when present
  and invalid), and recommends binding to 127.0.0.1 when local and
  authenticating every connection.
- v2's `createMcpHandler` checks no `Host`, no `Origin`, and no token.
  `createMcpExpressApp`, `createMcpHonoApp`, and `createMcpFastifyApp` add the
  `Host` and `Origin` checks on localhost binds; on plain `node:http`, put
  `localhostHostValidation()` and `localhostOriginValidation()` from
  `@modelcontextprotocol/node` in front. The `Host` check is what stops DNS
  rebinding against a local server.
- Verify the bearer token in front of the handler and pass the result as
  `authInfo`. Accept only tokens issued for this server, and call downstream
  APIs with the server's own credentials: forwarding the client's token
  (token passthrough) is forbidden by the authorization spec.
- The factory runs once per request. Register tools inside it; create pools and
  caches once at module scope.

## Tools

- The SDK validates arguments against `inputSchema` before the handler runs and
  answers a failure with an `isError: true` result the model can correct. Put
  every bound in the schema: `.min()`, `.max()`, `.int()`, enums, string
  formats.
- A schema checks shape, not permission. Ownership, existence, and tenant
  checks run in the handler against the authenticated caller.
- Arguments come from a model that may have read injected text, and resources
  or fetched pages can carry instructions. Fetched text never decides which
  command, URL, or path the server acts on: paths resolve under a fixed root,
  URLs pass the SSRF checks in the profile.
- Irreversible tools: a read tool reports exactly what will change plus a
  confirmation value, and the write tool requires that value. The description
  tells the model to confirm with the user first.
- Secrets a tool needs (passwords, Wi-Fi passphrases, API keys) should reach
  the server through a local page, environment, or keychain, never as tool
  arguments that pass through the model and the client.
- Clients may place tool descriptions, schemas (including `.describe()` text,
  the only field documentation the model gets), and server instructions in the
  model's context on every turn, used or not. Keep them to guardrails, and hold
  their total size under a budget asserted by a test.
- `outputSchema` with `structuredContent`: the SDK validates the value before
  it leaves the server.
- v1 schemas reach clients with a draft-07 `$schema` stamp (observed on 1.30,
  not documented), which a 2020-12-only client can refuse; v2 emits 2020-12.

## Testing

- In process (v2): `InMemoryTransport.createLinkedPair()` from
  `@modelcontextprotocol/client`, one end to the server and one to a `Client`.
- Over stdio: `StdioClientTransport` from `@modelcontextprotocol/client/stdio`
  spawns the built server; a raw spawn also proves stdout stays clean.
- By hand: the MCP Inspector (`npx @modelcontextprotocol/inspector@<version>
  node dist/main.js`), with the version pinned as `$HARNESS/core/security.md`
  §3 asks.
