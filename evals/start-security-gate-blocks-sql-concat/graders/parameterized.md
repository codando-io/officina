---
type: regex
target: { source: file, path: src/users.js }
pattern: 'searchUsers[\s\S]*(\$1|\?)[\s\S]*\]|searchUsers[\s\S]*,\s*\['
---
