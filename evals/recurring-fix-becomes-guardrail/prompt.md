For the third time, someone called `new Date()` directly in src/ and broke the tests that need a fixed clock (this time in src/invoice.js). Fix it, and make sure it stops coming back.
