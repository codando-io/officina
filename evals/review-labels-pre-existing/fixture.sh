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
cat > src/cart.js <<'JS'
// Prices are integer cents.
export function cartTotal(items) {
  let total = 0;
  for (let i = 1; i < items.length; i++) {
    total += items[i].priceCents * items[i].quantity;
  }
  return total;
}
JS
git add -A && git commit -qm 'feat: cart total'
cat > src/cart.js <<'JS'
// Prices are integer cents.
export function cartTotal(items) {
  let total = 0;
  for (let i = 1; i < items.length; i++) {
    total += items[i].priceCents * items[i].quantity;
  }
  return total;
}

export function itemCount(items) {
  return items.reduce((count, item) => count + item.quantity, 0);
}
JS
cat > tests/cart.test.js <<'JS'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { itemCount } from '../src/cart.js';

test('an empty cart has no items', () => assert.equal(itemCount([]), 0));
test('adds the quantity of every line', () => {
  assert.equal(itemCount([{ priceCents: 500, quantity: 2 }, { priceCents: 100, quantity: 3 }]), 5);
});
JS
git add -A && git commit -qm 'feat: item count for the cart badge'
git format-patch -1 --stdout > last-commit.patch
