# Modern Angular by version

Which APIs to use in new code, by the project's Angular version. Status comes
from the source tags and changelogs of Angular 21.2 and 22.2, and from
<https://angular.dev>. Checked 2026-09-23.

## Versions

| Version | Status | Released | Active until | LTS until |
|---|---|---|---|---|
| 22 | Active | 2026-06-03 | 2027-06 | 2028-06 |
| 21 | LTS | 2025-11-19 | 2026-06-03 | 2027-06 |
| 20 | LTS | 2025-05-28 | 2025-11-19 | 2026-11-28 |

Verify on <https://angular.dev/reference/releases> before planning an upgrade.
Upgrade one major at a time with `ng update`.

## API status

| API | Angular 21 | Angular 22 | Use in new code |
|---|---|---|---|
| `signal`, `computed`, `effect`, `toSignal` | stable | stable | Yes |
| `linkedSignal` | stable | stable | Yes, for state derived from an input that the user can also change |
| `input`, `output`, `model`, signal queries | stable | stable | Yes |
| `resource`, `httpResource`, `rxResource` | experimental | stable | On 22. On 21, only if `AGENTS.md` accepts experimental APIs |
| Signal Forms (`@angular/forms/signals`) | experimental | stable | New forms on 22; reactive forms on 21 |
| `debounced()` | n/a | experimental | No |
| Zoneless change detection | stable, default for new apps | stable | Yes |
| OnPush | opt-in | default | Yes |
| Incremental hydration | stable | stable, on by default | With SSR |
| `@defer`, `@let`, built-in control flow | stable | stable | Yes |
| Exhaustive `@switch` with `@default never;` | stable (21.2) | stable | Yes, over union-typed values |
| Angular Aria | developer preview | stable | On 22 for accessible primitives |
| `@boundary` error boundaries | n/a | developer preview (22.2) | Only if `AGENTS.md` accepts developer preview |
| `@Service()` decorator, `injectAsync` | n/a | stable | On 22, if the project adopted it; do not mix with `@Injectable` in one area |

## Angular 22 breaking defaults

- Components are OnPush unless marked `ChangeDetectionStrategy.Eager`. Code
  that mutated inputs in place, or relied on zone-triggered checks, stops
  updating.
- `HttpClient` uses `FetchBackend` by default; `withFetch()` is deprecated.
  Progress events and some interceptors that relied on XHR behave differently.
- `?.` in templates returns `undefined` like standard JavaScript (it returned
  `null` before). `ng update` wraps existing expressions in
  `$safeNavigationMigration(...)`; remove those wrappers deliberately, one area
  at a time.
- Router `paramsInheritanceStrategy` defaults to `'always'`.
- TypeScript 6.0+ and Node 22.22+ or 24.13+ are required.

## Template syntax

- Built-in control flow; `@for` always has a `track` expression that identifies
  the item, never `$index` for lists that change.
- Recent expression features: tagged template strings, `typeof`, `in`,
  `instanceof`, `**`, spread and rest (21.1), exhaustive `@switch` (21.2).
- Keep logic out of templates: a `computed` with a name beats a long
  expression.

## Style guide points (<https://angular.dev/style-guide>)

- File names in kebab case after the class: `UserProfile` in
  `user-profile.ts`, with `.html`/`.css`/`.spec.ts` sharing the base name.
- Organize by feature, one concept per file; avoid `utils.ts`.
- `inject()` over constructor injection.
- Angular-specific members (injections, inputs, outputs, queries) before
  methods; `readonly` on `input`/`model`/`output`/queries; `protected` for
  members used only by the template.
- Event handlers named for what they do (`saveUserData()`, not `handleClick()`).

## Tooling

- The Angular CLI ships an MCP server (`npx @angular/cli mcp`, with
  `--read-only` and `--local-only`) that exposes documentation search and best
  practices to agents. Prefer read-only mode.
- Vitest is the default test runner for new CLI projects since v21; Karma is
  still supported.
