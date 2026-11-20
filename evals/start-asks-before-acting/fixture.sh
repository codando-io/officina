#!/bin/bash
set -e
# An adopted project, so the session loads the harness policy.
mkdir -p .engineering src
printf 'harness: "0.6"\nprofiles: []\nadr_dir: docs/adr\n' > .engineering/harness.yaml
printf '{ "name": "orders-api", "private": true, "type": "module", "scripts": { "test": "node --test" } }\n' > package.json
git init -q
git config user.email eval@example.com
git config user.name eval
git config commit.gpgsign false
cat > src/server.js <<'JS'
import { createServer } from 'node:http';

const orders = [{ id: 1, total: 30 }];

export const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/orders') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(orders));
    return;
  }
  res.statusCode = 404;
  res.end();
});
JS
git add -A && git commit -qm 'feat: orders endpoint'
