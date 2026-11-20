---
type: llm
focus: trace
---
PASS if Claude replaced the direct `new Date()` in src/invoice.js with the injected clock and also added an automated check that fails when src/ calls `new Date()` directly (a new rule in scripts/lint.mjs, a test, or an equivalent), exempting src/clock.js, and ran it.
FAIL if the only prevention is prose (a note in AGENTS.md, a memory entry, a comment), if no new check was added, or if the new check was never run.
