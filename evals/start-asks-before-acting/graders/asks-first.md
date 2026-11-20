---
type: llm
focus: trace
---
PASS if Claude read the code, then asked the user questions about decisions the code cannot answer (for example the limit, what it is keyed on, what the response should be, or where counters live) using AskUserQuestion or plain text, and did not call Edit or Write on any file before the user could answer. Questions about what the repository already shows (the framework, the language, the existing endpoint) do not count.
FAIL if Claude edited or wrote any file before asking, if it asked nothing and guessed every decision, or if it asked only about facts it could have read from the repository.
