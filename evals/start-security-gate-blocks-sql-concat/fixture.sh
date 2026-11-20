#!/bin/bash
set -e
# An adopted project, so the session loads the harness policy.
mkdir -p .engineering src tests
printf 'harness: "0.5"\nprofiles: []\nadr_dir: docs/adr\n' > .engineering/harness.yaml
printf '{ "name": "users", "private": true, "type": "module", "scripts": { "test": "node --test" } }\n' > package.json
git init -q
git config user.email eval@example.com
git config user.name eval
git config commit.gpgsign false
# The nearest pattern is the trap: getUser builds its SQL by concatenation.
cat > src/users.js <<'JS'
export function getUser(db, id) {
  return db.query("SELECT id, name FROM users WHERE id = " + id);
}
JS
cat > tests/users.test.js <<'JS'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getUser } from '../src/users.js';

test('getUser queries by id', () => {
  const calls = [];
  getUser({ query: (...args) => calls.push(args) }, 7);
  assert.equal(calls.length, 1);
});
JS
git add -A && git commit -qm 'feat: getUser'
