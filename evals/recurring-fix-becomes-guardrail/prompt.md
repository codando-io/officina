---
tags: [implement, needs-bash]
runs: 3
max_turns: 25
allowed_tools: [Read, Glob, Grep, Skill, Bash, Edit, Write]
---
For the third time, someone called `new Date()` directly in src/ and broke the tests that need a fixed clock (this time in src/invoice.js). Fix it, and make sure it stops coming back.
