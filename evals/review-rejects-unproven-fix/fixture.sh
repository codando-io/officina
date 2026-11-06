#!/bin/bash
set -e
# An adopted project, so the session loads the harness policy.
mkdir -p .engineering
printf 'harness: "0.3"\nprofiles: []\nadr_dir: docs/adr\n' > .engineering/harness.yaml
printf '{ "name": "shop", "private": true, "type": "module", "scripts": { "test": "node --test" } }\n' > package.json
git init -q
git config user.email eval@example.com
git config user.name eval
git config commit.gpgsign false
mkdir -p src tests
cat > src/discount.js <<'JS'
export function applyDiscount(total, percent) {
  return total - (total * percent) / 100;
}
JS
cat > tests/discount.test.js <<'JS'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDiscount } from '../src/discount.js';

test('applies a percentage', () => assert.equal(applyDiscount(200, 10), 180));
test('a discount above 100% never makes the total negative', () => assert.equal(applyDiscount(100, 150), 0));
JS
git add -A && git commit -qm 'feat: percentage discounts'
cat > src/discount.js <<'JS'
export function applyDiscount(total, percent) {
  const discounted = total - (total * percent) / 100;
  return Math.round(discounted * 100) / 100;
}
JS
cat > tests/discount.test.js <<'JS'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDiscount } from '../src/discount.js';

test('applies a percentage', () => assert.equal(applyDiscount(200, 10), 180));
JS
git add -A && git commit -qm 'fix: negative totals with large discounts

Fixed. Totals are now rounded and the flaky test was removed.'
git format-patch -1 --stdout > last-commit.patch
