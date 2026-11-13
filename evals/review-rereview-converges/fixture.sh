#!/bin/bash
set -e
# An adopted project, so the session loads the harness policy.
mkdir -p .engineering
printf 'harness: "0.3"\nprofiles: []\nadr_dir: docs/adr\n' > .engineering/harness.yaml
printf '{ "name": "billing", "private": true, "type": "module", "scripts": { "test": "node --test" } }\n' > package.json
git init -q
git config user.email eval@example.com
git config user.name eval
git config commit.gpgsign false
mkdir -p src tests docs
cat > docs/finance.md <<'MD'
# Finance rules

Refunds are rounded half to even (banker's rounding), the same rule the
accounting system uses when it reconciles refunds every night.
MD
git add -A && git commit -qm 'docs: finance rules'
cat > src/refund.js <<'JS'
// Amounts are integer cents.
export function refundCents(paidCents, percent) {
  return roundHalfEven((paidCents * percent) / 100);
}

function roundHalfEven(x) {
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff > 0.5) return floor + 1;
  if (diff < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}
JS
cat > tests/refund.test.js <<'JS'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refundCents } from '../src/refund.js';

test('refunds a percentage of the paid amount', () => assert.equal(refundCents(1000, 50), 500));
test('rounds half to even', () => assert.equal(refundCents(1, 50), 0));
JS
git add -A && git commit -qm 'feat: partial refunds'
cat > review-1.md <<'MD'
## Review: feat: partial refunds

**Verdict**: request changes
**Risk class**: R1 (claimed R0)
**Findings**: 1 blocker, 1 major, 0 minor, 0 nit, 0 pre-existing
**Round**: 1

**Findings** (most severe first)
- [blocker] `src/refund.js:3` - a percent above 100 refunds more than was paid: `refundCents(1000, 150)` returns 1500. Cap the percent at 100 and add a test.
- [major] `src/refund.js:6` - rounds half to even; customers expect half up (`refundCents(1, 50)` returns 0, not 1).
MD
cat > replies.md <<'MD'
1. Fixed in the next commit: the percent is clamped to 0..100, with tests.
2. Intentional. Accounting reconciles refunds with banker's rounding (docs/finance.md); half up would break the nightly reconciliation.
MD
cat > src/refund.js <<'JS'
// Amounts are integer cents.
export function refundCents(paidCents, percent) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  return roundHalfEven((paidCents * clamped) / 100);
}

function roundHalfEven(x) {
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff > 0.5) return floor + 1;
  if (diff < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}
JS
cat >> tests/refund.test.js <<'JS'
test('never refunds more than was paid', () => assert.equal(refundCents(1000, 150), 1000));
test('never refunds a negative amount', () => assert.equal(refundCents(1000, -10), 0));
JS
git add src tests && git commit -qm 'fix: cap refunds at the paid amount'
git format-patch -1 --stdout > last-commit.patch
