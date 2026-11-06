# <Design title: the capability, not the technology ("Device provisioning at fleet scale")>

- Status: draft | in discussion | accepted | superseded by <link>
- Date: YYYY-MM-DD
- Authors: <names or roles>
- Discussion page: <link, or "not published">
- Decision: <ADR link once accepted>

## Problem

<What is wrong or missing today, for whom, with evidence (incidents, numbers,
files). One or two paragraphs.>

## Goals and non-goals

- Goal: <outcome>
- Non-goal: <what this design deliberately does not do>

## Requirements

<Functional requirements as a short list.>

| Quality attribute | Target | Source |
|---|---|---|
| <load, latency, availability, durability, data, security, cost, delivery> | <number> | <measured / user / assumption to confirm> |

## Estimates

<The arithmetic for the dominant load: rate, storage, connections, cost.>

## Current state

<What exists and constrains the design, with file paths and ADR numbers.>

## Options

| Criterion | <Option A> | <Option B> | <Smallest change> |
|---|---|---|---|
| Meets the requirements | | | |
| Complexity to build | | | |
| Operability | | | |
| Cost | | | |
| Reversibility | | | |
| Time to first value | | | |

**Recommendation:** <option>, because <the deciding criteria>. Switch to
<runner-up> if <the condition that would change the answer>.

## Recommended design

### Components

| Component | Responsibility | Technology | New or existing |
|---|---|---|---|

### Diagram

<Mermaid block, or ![<title>](<slug>.drawio.svg)>

[Edit in draw.io](<link from bin/drawio-url>)

### Data and contracts

<Who owns which data; schemas, topics, endpoints; versioning; idempotency keys.>

### Failure modes

| Failure | Effect | Detection | Handling |
|---|---|---|---|

### Security

<Trust boundaries, identities and how credentials are issued and revoked,
secrets, abuse cases.>

### Observability

<SLIs, the health signal for each increment, alerts.>

## Rollout

| Increment | Delivers | Class | Rollback |
|---|---|---|---|
| 1 | | R0/R1/R2 | |

## Open questions

- **Q1.** <question> Who can answer: <person or role>. If yes: <effect>. If no:
  <effect>.

## Discussion log

<What the discussion changed, with dates. Empty until someone comments.>
