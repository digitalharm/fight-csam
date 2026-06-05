---
name: Feature request / design proposal
about: Propose a change in behavior, an API addition, or an adapter (within the 11-tool scope)
title: "[proposal] <package or area>: <short summary>"
labels: ["type:enhancement", "needs-triage"]
assignees: []
---

<!--
  Before filing:
  - The portfolio is intentionally bounded at 11 tools. A NEW top-level tool/package
    is a high bar — start a Discussion instead: https://github.com/digitalharm/fight-csam/discussions
  - Some surfaces will NOT be accepted (see "Contributions we are NOT taking" in
    CONTRIBUTING.md): a bundled hash list; wiring cybertip-cli to real submission or
    evidencevault to enforced retention/live KMS; a general rules engine / case-mgmt /
    PII detector / toxicity classifier; or any "compliance attestation" / "beats Meta"
    framing.
  - Security/abuse-sensitive ideas go to security@digitalharm.org, not here.
-->

### Which package or area?

<!-- e.g. hashkit-match, csam-shield, an atproto-adapter, docs, conformance -->

### The problem / use case

<!-- What can't be done today, and who needs it? Tie it to a real adopter scenario if you can. -->

### Proposed change

<!-- The behavior or API you'd add. Reference the package README (the design contract) and how this fits it. -->

### Alternatives considered

<!-- Including: is there an upstream tool we should WRAP-AND-CREDIT instead of building this? -->

### Safety & gate review

- [ ] This does **not** add, require, or assume a bundled hash list or any real CSAM data.
- [ ] This does **not** open or weaken a gated path (cybertip-cli production submit; evidencevault retention/KMS). If it touches a gate, it only *strengthens* the stub.
- [ ] This introduces no "compliant" / "turnkey compliance" / "beats Meta/PDQ" claim.
- [ ] If this is a brand-new top-level tool, I understand it likely belongs in Discussions first.
