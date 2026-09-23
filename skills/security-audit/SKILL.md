---
name: security-audit
description: Audit a repository, service, or subsystem for security weaknesses beyond a single diff - trust boundaries, secrets, authentication, authorization, injection, SSRF, deserialization, file access, dependency and CI supply chain, and agent prompt-injection exposure. Produces evidence-backed findings with severity. Use periodically, before a release of security-sensitive changes, or when asked for a security review of an area. For reviewing one PR's diff, use review.
---

# Security audit

Find exploitable weaknesses with evidence, ranked by what an attacker could
actually do. An audit that lists every theoretical issue is noise; one that
proves three real ones is useful.

## Before you start

- If `.engineering/overrides/security-audit.md` exists, read it and apply it.
- Read `$HARNESS/core/security.md`. Its checklist (§5) is the baseline.
- Agree on scope: whole repository, one service, or one flow (e.g. login,
  file upload, payments). State it at the top of the report.
- Stay read-only. Do not exploit anything against shared or production
  environments. Local proof with synthetic data is fine.
- Do not open secret files to "check" them. Report their presence and location.

## Procedure

1. **Map the attack surface.** Entry points (HTTP endpoints, message consumers,
   scheduled jobs, CLI, webhooks, file imports), who can reach each (anonymous,
   authenticated, admin, internal only), and what data each touches.
2. **Trust boundaries.** Where does untrusted data enter, and where is it
   validated? Follow two or three high-value flows end to end.
3. **Authentication and authorization.** Default policy (secure by default or
   opt-in?), endpoints without auth, token validation parameters, resource
   ownership checks, role/claim checks, admin paths.
4. **Checklist pass** (`core/security.md` §5) over the mapped surface. Use search
   for known dangerous patterns, then read each hit in context.
5. **Secrets.** Search for committed secrets in the working tree and history
   (keys, connection strings, tokens). Check config files, Docker files, CI
   files, and test fixtures. Check how secrets reach the app at runtime.
6. **Dependencies.** Run the profile's vulnerability commands. Check for
   abandoned, typosquat-looking, or unpinned dependencies and install scripts.
7. **CI/CD and infrastructure as code.** Workflow permissions, action pinning,
   `pull_request_target`, secret exposure to forks, deploy credentials scope,
   container base images and user (root?), Kubernetes securityContext, public
   buckets or storage.
8. **Agent exposure.** Where could untrusted text reach an agent working in this
   repo with credentials (issue templates, generated docs, test fixtures, vendored
   READMEs, MCP servers configured in the repo)? Are the agent permission
   settings the adapter installed (see `$HARNESS/adapters/README.md`) sensible?
9. **Prioritize** by exploitability and impact, not by count.

## Output

```markdown
## Security audit: <scope>, <date>

**Scope and method**: what was covered, what was not, commands used
**Attack surface summary**: entry points by exposure level

**Findings**
| # | Severity | Title | Location | Evidence | Exploit scenario | Fix |
|---|---|---|---|---|---|---|

**Suspected (unconfirmed)**: item, why suspected, what would confirm it
**Good practices observed**: short list, so they are kept
**Recommended next steps**: ordered
```

Severity: critical (remote, unauthenticated, data or system compromise), high
(authenticated escalation, data exposure), medium (needs unusual conditions),
low (defense in depth). Critical and high findings go to the user immediately,
before finishing the report. Do not paste secret values into the report.
