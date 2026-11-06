---
tags: [test, implement, needs-bash]
runs: 3
max_turns: 20
allowed_tools: [Read, Glob, Grep, Skill, Bash, Edit, Write]
---
Bug: a discount above 100% makes the cart total negative. The total should never go below zero. Please fix it.
