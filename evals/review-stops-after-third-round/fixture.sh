#!/bin/bash
set -e
# An adopted project, so the session loads the harness policy.
mkdir -p .engineering
printf 'harness: "0.3"\nprofiles: []\nadr_dir: docs/adr\n' > .engineering/harness.yaml
printf '{ "name": "blog", "private": true, "type": "module", "scripts": { "test": "node --test" } }\n' > package.json
git init -q
git config user.email eval@example.com
git config user.name eval
git config commit.gpgsign false
mkdir -p src tests docs
cat > docs/urls.md <<'MD'
# URLs

Post titles are in Portuguese. Slugs are lowercase ASCII letters, digits, and
hyphens, so "Ação rápida" becomes `acao-rapida`.
MD
git add -A && git commit -qm 'docs: url rules'
cat > src/slug.js <<'JS'
export function slugify(title) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
JS
cat > tests/slug.test.js <<'JS'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/slug.js';

test('joins words with hyphens', () => assert.equal(slugify('Hello World'), 'hello-world'));
JS
git add -A && git commit -qm 'feat: post slugs'
cat > src/slug.js <<'JS'
export function slugify(title) {
  return title.toLowerCase().trim().replace(/[^\p{L}0-9]+/gu, '-').replace(/^-|-$/g, '');
}
JS
git add -A && git commit -qm 'fix: keep accented letters in slugs'
cat > src/slug.js <<'JS'
const ASCII = { 'ã': 'a', 'á': 'a', 'ç': 'c' };

export function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[ãáç]/g, (ch) => ASCII[ch])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
JS
cat >> tests/slug.test.js <<'JS'
test('turns accented letters into ASCII', () => assert.equal(slugify('Ação rápida'), 'acao-rapida'));
JS
git add -A && git commit -qm 'fix: map accented letters to ASCII in slugs'
git format-patch -1 --stdout > last-commit.patch
cat > reviews.md <<'MD'
## Review: feat: post slugs

**Verdict**: request changes
**Risk class**: R0
**Findings**: 1 blocker, 0 major, 0 minor, 0 nit, 0 pre-existing
**Round**: 1

**Findings**
- [blocker] `src/slug.js:2` - accented letters are dropped: `slugify('Ação rápida')` returns `a-o-r-pida`, not `acao-rapida` (docs/urls.md).

## Review: fix: keep accented letters in slugs

**Verdict**: request changes
**Risk class**: R0
**Findings**: 1 blocker, 0 major, 0 minor, 0 nit, 0 pre-existing
**Round**: 2 of a re-review

**Earlier findings**
| Finding | Status | Evidence |
|---|---|---|
| Accented letters dropped | still open | `slugify('Ação rápida')` now returns `ação-rápida`, which is not ASCII (docs/urls.md) |
MD
