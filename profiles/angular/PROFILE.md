# Profile: angular

Angular applications in TypeScript, built with the Angular CLI and npm, with a
component catalog and design tokens as the source of every visual decision.

Last reviewed: 2026-09-23 (Angular 22 current, 21 in LTS).

## Detection

- `angular.json`, `package.json` with `@angular/core`, a lockfile
  (`package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`).
- Design system markers: a tokens file (`tokens.css`, `_tokens.scss`,
  Tailwind `@theme`), a shared UI folder (`ui/`, `shared/components/`), a
  component library (Angular Material, PrimeNG, spartan), Storybook.

Quick inventory: `$HARNESS/bin/stack-report --offline`.

## Verification ladder

Cheapest first:

1. `npx tsc -p tsconfig.app.json --noEmit` for types (templates are checked by
   the build).
2. The targeted spec: `npx ng test --watch=false --include <spec path>` (the
   test builder may be Vitest, Jest, or Karma; check `angular.json`).
3. `npx ng test --watch=false`, then the project's lint and style checks
   (`ng lint`, Biome, stylelint, a token or convention script).
4. `npx ng build --configuration production` (catches template type errors,
   budgets, and unused imports).
5. The e2e command, when the change touches a user journey, and a look at the
   component in the project's catalog (Storybook or catalog page) when it
   touches the design system.

## Conventions to discover

Projects differ on these, and each project's `AGENTS.md` decides:

- UI foundation: a hand-written catalog, Angular Material, PrimeNG, Tailwind,
  or a mix. Where the tokens live and how the library is themed from them.
- Where shared components live and their selector prefix (`app-`, `ag-`,
  `cen-`).
- Extraction threshold: the harness default is the second occurrence; some
  projects use the third. The project's rule wins.
- File naming: `user-profile.ts` + class `UserProfile` (current style guide) or
  `user-profile.component.ts` + `UserProfileComponent`.
- Test runner (Vitest, Jest, Karma), lint tool (angular-eslint, Biome),
  formatting (tabs or spaces).
- State: signal-based services or stores, facades, NgRx; HTTP through generated
  OpenAPI clients or hand-written services.
- Zone.js or zoneless; OnPush written explicitly or left to the v22 default.

## House defaults for new code

Rules that make these defaults safe:

- Use APIs that are **stable** in the project's Angular version. Developer
  preview APIs need a line in `AGENTS.md` accepting them; experimental APIs stay
  out of production code. The status table is in `references/modern-angular.md`.
- In an existing file, match that file's style; do not mix decorator and signal
  APIs in one component. Converting old code is a modernization change.
- The project's `AGENTS.md` and overrides win.

Defaults:

- Modern component authoring: standalone, `inject()`, signal `input()`/
  `output()`/`model()`, signal queries, built-in control flow (`@if`, `@for` with
  `track`, `@switch`, `@let`, `@defer`), the `host` metadata object instead of
  `@HostBinding`/`@HostListener`, `protected` members for template-only state,
  `class`/`style` bindings instead of `ngClass`/`ngStyle`.
- Reactivity: `signal`/`computed`/`linkedSignal`; `resource`/`httpResource` for
  reads and Signal Forms for new forms on Angular 22, where both are stable.
- Zoneless and OnPush (the defaults for new apps since v21 and v22).
- **Components before styles.** Before writing markup, search the catalog. When
  markup or behavior repeats, extract a component. Every visual value comes from
  a design token. The full rules are in `references/components.md`; read it
  before building or changing UI.

## Pitfalls

- `effect()` for state propagation. Prefer `computed` or `linkedSignal`; use
  `effect` for side effects only, and wrap reads that must not create
  dependencies in `untracked()`.
- Subscriptions without `takeUntilDestroyed` or the `async` pipe; nested
  `subscribe` calls.
- Secrets or internal URLs in `environment*.ts`: everything there ships to the
  browser.
- `bypassSecurityTrustHtml`/`Url`/`ResourceUrl`, `[innerHTML]` with API data,
  `ElementRef.nativeElement.innerHTML`: XSS unless the content is trusted and
  sanitized.
- Hard-coded colors, spacing, or font sizes in component styles; a component
  stylesheet longer than its template usually means a missing component.
- Angular 22 upgrade defaults: components are OnPush unless marked
  `ChangeDetectionStrategy.Eager`, `HttpClient` uses `FetchBackend`, `?.` in
  templates now returns `undefined` like JavaScript, and TypeScript 6 and Node
  22.22+/24.13+ are required.

## References

| File | Used by |
|---|---|
| `references/components.md` | `plan`, `implement`, `review` on UI changes; `architecture-audit` |
| `references/modern-angular.md` | `implement`, `review`, `dependency-update` (platform mode) |
| `references/currency.md` | `dependency-update`, `architecture-audit` (modernization) |
| `references/modernization.md` | `architecture-audit` (modernization), `plan` for migrations |
| `references/observability.md` | `observability` |
| `references/failure-testing.md` | `test`, `review` (tools for the failure-scenario catalog) |
