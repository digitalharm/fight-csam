# Security policy

## Reporting a vulnerability

Email `security@digitalharm.org` with:

- The package and version affected
- A description of the issue
- Reproduction steps
- Any disclosure timeline you'd like us to honor

**Do not file a public GitHub issue for security-sensitive vulnerabilities.** We will
respond within 5 business days.

## Scope

In scope:

- Bugs that cause hash drift between language bindings of [hashkit](../packages/hashkit)
- Bypass of the safety guard CI (`scripts/safety-check.sh`)
- Authentication or authorization flaws in [hashstream](../packages/hashstream),
  [cybertip-cli](../packages/cybertip-cli), or [evidencevault](../packages/evidencevault)
- Cryptographic issues in [c2pa-lite](../packages/c2pa-lite)
- Anything that could cause real CSAM material to be incorrectly handled, stored, or
  exposed

Out of scope:

- Theoretical issues without practical exploit paths in the documented threat model
- Issues in upstream dependencies (file upstream)
- Social engineering of maintainers

## Threat model summary

The portfolio's threat model is documented in [docs/safety-policy.md](../docs/safety-policy.md).
At a high level:

- These tools are **detection-assist**, not detection guarantees. False negatives
  are the most serious failure mode and are why every release is gated by a frozen,
  cross-validated conformance suite.
- The portfolio **deliberately does not handle real CSAM imagery or real hash lists**.
  Credentialed list access lives with NCMEC, IWF, and Project Arachnid.
- The most plausible attack surface is **list-source spoofing** in
  [hashstream](../packages/hashstream): tampering with the cache between upstream and
  consumers. Mitigations are signed snapshots and pinned upstream certificates.

## Responsible disclosure

We follow [Coordinated Vulnerability Disclosure](https://www.first.org/cvss/). We will:

- Confirm receipt within 5 business days
- Investigate and respond with a remediation plan within 30 days
- Coordinate disclosure timing with you
- Credit you in the release notes unless you ask otherwise
