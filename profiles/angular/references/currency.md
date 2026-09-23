# Keeping an Angular app current

Start from the `$HARNESS/bin/stack-report` output: Angular version, lockfile,
Node pin, test builder, and (online) `npm outdated` and `npm audit`.

## Support windows

See the table in `modern-angular.md` and verify on
<https://angular.dev/reference/releases>. Stay on a supported major; an app on
Angular 20 loses LTS on 2026-11-28. Node must be an Active or Maintenance LTS
release that the Angular version supports
(<https://nodejs.org/en/about/previous-releases>).

## What to check

| Item | Where | Command / check |
|---|---|---|
| Angular | `package.json` | `npx ng version`; `npx ng update` lists updates and migrations |
| Outdated packages | `package.json` + lockfile | `npm outdated` |
| Vulnerabilities | lockfile | `npm audit --omit=dev` for runtime; full `npm audit` for the build chain |
| Node | `.nvmrc`, `engines`, CI `setup-node` | one version everywhere, supported by the Angular version |
| angular-eslint, TypeScript, RxJS, UI library | `package.json` | on the versions the Angular major expects; a lint plugin two majors behind is a finding |
| Test runner | `angular.json` | a runner that still receives updates |

## Recommended settings

- Lockfile committed; `npm ci` in CI, never `npm install`.
- Dependabot or Renovate with the `npm` ecosystem, Angular packages grouped so
  they move together.
- Review `postinstall`/`prepare` scripts of new packages
  (`$HARNESS/core/security.md` §4).

## Upgrade order for an Angular major

1. Start from a green build and tests on the current major.
2. `npx ng update @angular/core @angular/cli` (one major at a time), and the UI
   library's own `ng update` if it has one.
3. Commit the generated migrations separately from manual fixes.
4. Walk the breaking defaults for the target version (`modern-angular.md`) with
   evidence per item.
5. Update Node in CI and `.nvmrc` together.
6. Follow <https://angular.dev/update-guide> for the pair of versions.
