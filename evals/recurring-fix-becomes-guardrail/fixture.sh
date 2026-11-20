#!/bin/bash
set -e
# An adopted project, so the session loads the harness policy.
mkdir -p .engineering/memory/gotchas
printf 'harness: "0.4"\nprofiles: []\nadr_dir: docs/adr\n' > .engineering/harness.yaml
printf '# Project memory\n\n- [gotchas/clock.md](gotchas/clock.md) - use the injected clock, never new Date() (verified 2026-10-02)\n' > .engineering/memory/INDEX.md
printf '# Use the injected clock\n\nNever call new Date() in src/; take a clock argument.\n' > .engineering/memory/gotchas/clock.md
printf '{ "name": "billing", "private": true, "type": "module", "scripts": { "test": "node --test", "lint": "node scripts/lint.mjs" } }\n' > package.json
git init -q
git config user.email eval@example.com
git config user.name eval
git config commit.gpgsign false
mkdir -p src tests scripts
cat > src/invoice.js <<'JS'
export function dueDate(invoice) {
  const issued = new Date();
  issued.setDate(issued.getDate() + invoice.termDays);
  return issued.toISOString().slice(0, 10);
}
JS
cat > src/clock.js <<'JS'
export const systemClock = { now: () => new Date() };
JS
cat > tests/invoice.test.js <<'JS'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dueDate } from '../src/invoice.js';

test('due date is the issue date plus the term', () => {
  assert.equal(dueDate({ termDays: 30, clock: { now: () => new Date('2026-01-01T00:00:00Z') } }), '2026-01-31');
});
JS
cat > scripts/lint.mjs <<'JS'
import { readdirSync, readFileSync } from 'node:fs';

const rules = [
  { name: 'no-console', pattern: /console\.log\(/, message: 'use the logger, not console.log' },
];

let failed = false;
for (const file of readdirSync('src').map((f) => `src/${f}`)) {
  const text = readFileSync(file, 'utf8');
  for (const { name, pattern, message } of rules) {
    if (pattern.test(text)) { console.error(`${file}: ${name}: ${message}`); failed = true; }
  }
}
process.exit(failed ? 1 : 0);
JS
git add -A && git commit -qm 'feat: invoice due dates'
