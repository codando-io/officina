# Keeping a Node.js backend current

Begin with `$HARNESS/bin/stack-report`. It prints the lockfile, `.nvmrc`, and
local Node, and online it adds `npm outdated` and `npm audit --omit=dev`. Those
two are npm commands: in a pnpm repository run `pnpm outdated` and
`pnpm audit --prod` instead.

## Support windows (verify before acting)

Checked 2026-11-06 on <https://nodejs.org/en/about/previous-releases> and
<https://github.com/nodejs/Release>:

| Line | Status | Maintenance from | End of life |
|---|---|---|---|
| Node 26 (Lithium) | Active LTS | 2027-10-20 | 2029-04-30 |
| Node 24 (Krypton) | Maintenance LTS | 2026-10-20 | 2028-04-30 |
| Node 22 (Jod) | Maintenance LTS | 2025-10-21 | 2027-04-30 |
| Node 20 (Iron) | End of life | - | 2026-04-30 |
| Node 27 | Alpha; Current from 2027-04-22, LTS from 2027-10-20 | - | 2030-04-30 |

From Node 27 on, one major ships per year (branched each October) and every
line becomes LTS, so an odd number no longer means a short-lived release.
Production runs Active or Maintenance LTS only. A service on Node 22 loses
patches in April 2027; plan its move to 24 or 26 now. An `engines` floor of 20
advertises a line that no longer gets security fixes.

Bundled npm, from <https://nodejs.org/dist/index.json> on the same date: Node
22.23 ships npm 10.9, Node 24.22 ships npm 11.19, Node 26.13 ships npm 11.20.
npm 12 (the registry's `latest`) only arrives when installed on purpose.

## Frameworks and tooling

Checked 2026-11-06 on the npm registry and the linked docs:

| Package | Latest | Notes |
|---|---|---|
| `@nestjs/core` | 12.4 | v12 since 2026-08-27; 11 is the `legacy` tag. See `nestjs.md` |
| `@modelcontextprotocol/server` | 2.4 | v2 since 2026-07-27; Node 20+, zod `^4.2.0`. See `mcp-servers.md` |
| `@modelcontextprotocol/sdk` | 1.32 | v1 line: bug and security fixes for at least six months after the v2 release (<https://github.com/modelcontextprotocol/typescript-sdk>) |
| `express` | 5.3 | Node 18+ |
| `fastify` | 5.12 | |
| `typescript` | 7.0 | `typescript-eslint` still declares `typescript >=4.8.4 <6.1.0`, and `@nestjs/schematics` 12 declares `>=6.0.0`; check the peers before moving to 7 |

## What to check

| Item | Where | Command / check |
|---|---|---|
| Node pin | `.nvmrc`, `engines.node`, CI (`setup-node`, Nix), Dockerfile `FROM`, bundler `--target` | every one names the same supported line |
| `@types/node` | `package.json` | major matches the production Node line |
| Package manager | `packageManager`, lockfile | one manager and one lockfile; CI uses the pinned version |
| Outdated | lockfile | `npm outdated`; `pnpm outdated -r` in a workspace |
| Vulnerable | lockfile | `npm audit --omit=dev` for what ships, plain `npm audit` for the build chain, `pnpm audit --prod`; both fail at or above `--audit-level` |
| Signatures | lockfile | `npm audit signatures` (registry signatures and provenance attestations) |
| Install scripts | `allowScripts` (npm 12), `allowBuilds` (pnpm) | each entry has a reason; new ones reviewed under `$HARNESS/core/security.md` §4 |
| Framework family | `package.json` | all `@nestjs/*` on one major; third-party Nest modules declare that major in their peers |
| MCP SDK | `package.json` | a server still on `@modelcontextprotocol/sdk` has a v2 migration planned |

## Recommended settings

- CI installs with `npm ci` or `pnpm install --frozen-lockfile`; both refuse to
  touch the lockfile.
- npm 12 blocks unapproved dependency install scripts by default; approvals
  live in `package.json` `allowScripts`, managed with `npm approve-scripts`.
  `strict-allow-scripts` turns the warning about a blocked script into a failed
  install. On npm 10 or 11, `ignore-scripts=true` in `.npmrc` stops every
  script, including the ones native packages need, so decide it per project.
- npm `min-release-age=<days>` holds back versions younger than that.
- pnpm (checked 2026-11-06 on <https://pnpm.io/supply-chain-security>): builds
  run only for `allowBuilds` entries, `strictDepBuilds` (on by default) fails
  the install on any other, `minimumReleaseAge` defaults to 1440 minutes,
  `blockExoticSubdeps` (on by default) keeps transitive dependencies off git
  and tarball URLs, and `trustPolicy: no-downgrade` refuses a version whose
  publishing trust level dropped.
- Dependabot or Renovate on the `npm` ecosystem, with framework families
  grouped so `@nestjs/*` or `@opentelemetry/*` move together.

## Upgrade order for a Node major

1. Green tests and a visible warning count on the current line.
2. Read the target line's breaking changes in its release post on nodejs.org.
3. Move `.nvmrc`, `engines`, CI, the base image, any bundler `--target`, and
   `@types/node` in one change.
4. Reinstall from an empty `node_modules`, so native addons rebuild for the new
   ABI.
5. Run the whole ladder, including starting the built entry on the new Node.

## Upgrade order for a NestJS major

1. With the global CLI on the new major, `nest upgrade --dry-run`, then
   `nest upgrade`: it moves every `@nestjs/*` package at once, raises
   TypeScript to 6, and applies the mechanical part of the migration.
2. Walk <https://docs.nestjs.com/migration-guide> item by item, with evidence
   for each (the 11 to 12 list is in `nestjs.md`).
3. Wait for each third-party Nest module to publish a release that accepts the
   new major, or record why the project carries it anyway.
