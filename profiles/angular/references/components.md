# Components and design system

The goal: every screen is assembled from a small, documented set of components,
and every visual value comes from a token. A new screen should need new
composition, rarely new CSS.

## Before writing markup

1. Search the catalog (the shared UI folder, the component library, the
   Storybook or catalog page) for a component that already does the job.
2. If one does, use it. If it almost does, extend it with an input or a variant;
   do not copy it.
3. If none does, decide whether the new markup is a one-off or the start of a
   pattern (see *When to extract*).

## When to extract a component

Extract on the **second occurrence** of the same markup or behavior, unless the
project sets another threshold. Signs that you are writing the second
occurrence:

- the same group of classes on the same element structure (buttons, cards,
  field wrappers, dialog footers);
- the same state block copied between pages: loading, empty, error, "busy"
  button with a spinner;
- a component stylesheet that restyles a primitive the catalog already has;
- a stylesheet borrowed from another page through `styleUrls`.

In the same change:
- if both occurrences are in the files you are changing, extract the component
  and use it in both;
- if the first occurrence is elsewhere, use the new component in your code and
  record the other site for a follow-up refactor (a memory entry or a
  backlog item), instead of widening the diff.

Do not extract:
- markup that looks alike but means different things and will evolve apart;
- a wrapper with one caller "for later";
- layout that is only a few utility classes and has no behavior.

## How to build a catalog component

- **Typed variants, not free-form classes.** Inputs with literal union types map
  to token-based classes:

  ```ts
  @Component({
    selector: 'button[uiButton]',
    host: {
      '[class]': 'classes()',
      '[attr.aria-busy]': 'busy()',
      '[disabled]': 'disabled() || busy()',
    },
    template: `
      @if (busy()) {
        <span class="ui-spinner" aria-hidden="true"></span>
      }
      <ng-content />
    `,
  })
  export class UiButton {
    readonly variant = input<'primary' | 'secondary' | 'danger' | 'ghost'>('primary');
    readonly size = input<'sm' | 'md'>('md');
    readonly busy = input(false);
    readonly disabled = input(false);
    protected readonly classes = computed(() => `ui-btn ui-btn--${this.variant()} ui-btn--${this.size()}`);
  }
  ```

  Used as `<button uiButton variant="danger" [busy]="saving()">Delete</button>`:
  an attribute selector on the native element keeps button semantics, focus, and
  form behavior for free.

- **Content projection** (`<ng-content>`, named slots with `select`) for what
  varies; inputs for what is chosen from a fixed set.
- **Host element first.** Apply roles, ARIA attributes, and classes on the host
  through the `host` object; set `:host { display: block }` (or the right
  display) so the component lays out predictably.
- **Accessibility is part of the component.** Use Angular Aria or the CDK for
  behavior patterns (listbox, menu, dialog focus trap, tabs) instead of
  hand-rolled keyboard handling. Every interactive primitive has a keyboard path
  and a visible focus state.
- **States are components too.** Loading, empty, and error states, and the busy
  state of actions, belong in the catalog so every page shows them the same way.
- **One component per folder**, named for what it is (`ui-button`,
  `ui-empty-state`), with its spec and, where the project uses Storybook, its
  story in the same change.

## Design tokens

- Every color, spacing, radius, shadow, font size, z-index, and motion duration
  comes from a token: CSS custom properties, Tailwind `@theme`, or the
  library's theme mapped to the same tokens.
- Name tokens by role, not by value: `--color-surface`, `--color-danger`,
  `--space-3`, not `--blue-500` in components. Raw palette values live only in
  the tokens file.
- Theme third-party libraries (Material, PrimeNG) from the tokens, not with
  component-level overrides.
- Dark mode and other themes swap token values; components never branch on the
  theme.
- A script in CI rejects hard-coded values in component styles (hex, `rgb(`,
  raw `px` for spacing outside the tokens file). If the project has none, write
  one: a rule a script can check does not belong in review.

## Keeping it maintainable

- The catalog is the documentation. Storybook or a catalog route shows every
  component with its variants and states; a component without an entry is not
  finished.
- Deprecate before deleting: when a component is replaced, mark the old one,
  migrate callers, then delete it in one wave.
- Watch drift in `architecture-audit`: count hard-coded values in component
  styles, repeated class families, pages that restyle catalog primitives, and
  duplicated state blocks. Rising counts are findings.
- One visual foundation per app. A second one (Material next to PrimeNG next to
  hand-written styles) needs an ADR and a plan for which one wins.

## Review checklist for UI changes

- New markup reuses catalog components where one exists.
- No new hard-coded visual values; new tokens added to the tokens file with a
  role name.
- Repeated markup was extracted or recorded.
- Loading, empty, error, and disabled states exist and use the shared
  components.
- Keyboard and screen-reader behavior checked for new interactive elements.
