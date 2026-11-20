# Invariants: property-based tests and model checks

Some bugs live in combinations no example test lists: a total that must be
conserved, a payment that must not happen twice, a state machine that must not
skip a step. For an R2 change, name those invariants and check them.

## 1. State the invariant

One sentence, in the domain's words, that is true before and after every
operation: "the sum of ledger entries for an order equals its total",
"a shipped order is never cancelled". If you cannot state it, say so in the
plan; that is a finding about the design.

## 2. Pick the check

| Invariant is about | Check | Tool |
|---|---|---|
| One function or a round trip: parsing, serializing, rounding, money, ordering, idempotency | Property-based test with generated inputs | the profile's `references/failure-testing.md` (*Generated inputs*) |
| A UI that must hold a rule across any sequence of actions | Property-based test over action sequences, with the invariant as the oracle | the browser test tool, with generated sequences |
| Several actors, retries, crashes, or message orders: sagas, queues, locks, expand-contract phases | Model check of the protocol: write the states and steps, let the checker explore every interleaving | TLA+ with TLC or Apalache |
| A small core algorithm whose bug is expensive and whose spec is exact | Machine-checked proof | Lean, Dafny, or the language's prover |

Start from the cheapest row that can fail. A property test runs in the normal
suite; a model check or a proof is worth its cost only when the invariant
protects money, data, or safety and examples cannot reach the bug.

## 3. Record

Invariant, check, command, and result: runs and seeds for a property test,
states explored and the counterexample for a model check. Keep a failing
generated input as an example test. A model proves the model, not the code:
name the code that each step of the model stands for.
