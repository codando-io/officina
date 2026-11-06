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
export function cartTotal(items, discountPercent = 0) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return subtotal - (subtotal * discountPercent) / 100;
}
JS
cat > tests/cart.test.js <<'JS'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cartTotal } from '../src/cart.js';

test('sums price times quantity', () => assert.equal(cartTotal([{ price: 10, qty: 3 }]), 30));
test('applies a discount', () => assert.equal(cartTotal([{ price: 100, qty: 1 }], 25), 75));
JS
git add -A && git commit -qm 'feat: cart total'
