---
name: Bug report
about: Something in a published or buildable package behaves incorrectly
title: "[bug] <package>: <short summary>"
labels: ["type:bug", "needs-triage"]
assignees: []
---

<!--
  STOP — is this security- or abuse-sensitive?

  Do NOT use this template (and do NOT open any public issue) for:
    - a safety-guard bypass, a detection-bypass technique, or a way to make real
      CSAM slip through;
    - authn/authz or crypto flaws in hashstream / cybertip-cli / evidencevault / c2pa-lite;
    - any case where real CSAM or a real hash list may have been committed.
  Email security@digitalharm.org instead. See .github/SECURITY.md.

  NEVER attach, paste, or link real CSAM or a real hash list. Reproduce ONLY with
  the synthetic fixtures from packages/detectkit-test.
-->

### Affected package & version

<!-- e.g. hashkit 0.1.0 (crate `digitalharm-hashkit`); promptshield 0.1.0; hashstream @ packages/hashstream/v0.1.0 -->

- Package:
- Version / commit:
- Language toolchain & OS/arch (e.g. Rust 1.x on macOS arm64; Python 3.12 on Ubuntu):

### What happened

<!-- The actual behavior. Include error output / logs. Redact anything sensitive. -->

### What you expected

### Minimal reproduction (synthetic fixtures only)

<!--
  Smallest steps/code to reproduce. Use detectkit-test fixtures or documented
  seeds — never real imagery, real hashes, or live credentials. If credentials
  are involved, show only placeholder names (e.g. NCMEC_API_KEY=your-key-here).
-->

```
# commands / code here
```

### Conformance note (only if this is a hashkit PDQ / cross-binding mismatch)

<!--
  Which reference are you comparing against (e.g. facebook/ThreatExchange C++ PDQ),
  and on what synthetic vector? Include the vector identifier/seed, not the image.
-->

### Confirmations

- [ ] This is **not** a security- or abuse-sensitive issue (those go to security@digitalharm.org, privately).
- [ ] My reproduction uses **synthetic fixtures only** — no real CSAM, no real hash list, no live credentials.
