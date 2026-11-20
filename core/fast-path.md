# R0 fast path

Most changes are small and reversible. For those, the whole lifecycle is one
pass and one report:

1. Locate the cause or the place to change, with evidence.
2. Bugfix: write the test that reproduces it and watch it fail.
3. Make the change, following the nearest existing pattern.
4. Run the targeted test and the module's tests.
5. Read your own full diff.
6. Report in one message: what changed, the commands you ran and their results,
   and the risk class. If the change later turns out bigger or riskier than R0,
   stop and switch to the full lifecycle.
