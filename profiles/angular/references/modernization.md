# Modernization catalog (Angular)

Legacy Angular idioms worth tracking, with the modern replacement and the risk.
Modernization rules are in `$HARNESS/core/lifecycle.md` (*Migration*); for
Angular, the vertical slice is one feature area. Official migrations run with
`ng generate @angular/core:<migration>` (list at
<https://angular.dev/reference/migrations>).

## Components and reactivity

| Legacy | Modern | Risk | Notes |
|---|---|---|---|
| `NgModule`-based components | Standalone | Low-Medium | Schematic `standalone`; feature by feature |
| Constructor injection | `inject()` | Low | Schematic `inject` |
| `*ngIf`/`*ngFor`/`*ngSwitch` | `@if`/`@for`/`@switch` | Low | Schematic `control-flow`; add a real `track` |
| `@Input`/`@Output`/`@ViewChild` | Signal inputs, `output()`, signal queries | Medium | Schematics exist; change detection behavior shifts |
| `@HostBinding`/`@HostListener` | `host` metadata object | Low | |
| `ngClass`/`ngStyle` | `class`/`style` bindings | Low | |
| `BehaviorSubject` state in services | Signals (`signal`, `computed`, `linkedSignal`) | Medium | Keep RxJS for event streams; `toSignal` at the boundary |
| Manual subscriptions | `takeUntilDestroyed`, `async` pipe, `toSignal` | Low | Fixes leaks |
| Hand-written loading/error state for reads | `httpResource`/`resource` (stable on 22) | Medium | One pattern for loading, error, and reload |
| Reactive forms | Signal Forms (stable on 22) | Medium | New forms first; migrate existing forms only with a reason |

## App configuration

| Legacy | Modern | Risk | Notes |
|---|---|---|---|
| Zone.js | Zoneless (`provideZonelessChangeDetection`) | Medium-High | After signals and OnPush are widespread; remove the zone.js polyfill in the same change so config and code agree |
| Default change detection | OnPush (default in 22) | Medium | Components that mutate in place break |
| `HttpClientModule`, class interceptors with `withInterceptorsFromDi` | `provideHttpClient(withInterceptors(...))`, functional interceptors | Low | Interceptor order matters |
| Class guards/resolvers | Functional | Low | |
| Webpack `browser` builder | `application` builder (esbuild) | Medium | Check custom webpack config |
| Karma | Vitest via the `unit-test` builder | Medium | Move the runner first, specs unchanged, then modernize specs |
| TSLint or legacy `.eslintrc` | angular-eslint flat config (or the project's chosen linter) | Low | Keep the lint plugin on the same major as Angular |
| `strict`/`strictTemplates` off | On | Medium | Turn on per project; fix, do not suppress |

## Design system

| Legacy | Modern | Risk | Notes |
|---|---|---|---|
| Hard-coded colors and spacing in components | Tokens | Low per component | Add a CI check first so the count only goes down |
| Page-level styles restyling primitives | Catalog components with variants | Low-Medium | See `components.md` |
| Two visual foundations in one app | One, chosen in an ADR | High | Migrate by feature area; delete the loser at the end |
| Library themed by per-component overrides | Library theme generated from tokens | Medium | |
