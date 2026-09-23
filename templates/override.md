<!--
Project override. Save as:
  .engineering/overrides/policy.md    added to the harness policy in every session
  .engineering/overrides/<skill>.md   read by that skill before it starts

Semantics:
- Rules here add to the harness rules.
- When a rule here conflicts with a harness rule on the same subject, this one wins.
- The harness security floor cannot be relaxed; such rules are ignored and reported.
- If the same override appears in three projects, propose it for the harness.

Keep each rule short and give the reason, so it can be removed when the reason goes away.
-->

# <skill or policy> overrides

- <Rule>. Reason: <why this project differs>.
