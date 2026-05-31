# EvidenceVault · Counsel scope brief

**Status:** Draft. To be reviewed by outside counsel before any production
retention path lands. Covers what the tool retains, for how long, under
what jurisdictional rules, and the chain-of-custody guarantees.

## What the tool does

- Accepts encrypted evidence packages from upstream (csam-shield,
  detection pipelines, moderator review)
- Records chain-of-custody metadata (who created, who accessed, when)
- Enforces a retention schedule based on jurisdiction-specific rules
- Exposes a query API for authorized retrieval (subpoena response,
  internal audit)
- Logs every access with operator identity and stated purpose

## What it does NOT do

- Does not decide whether content is CSAM (csam-shield's job)
- Does not submit reports (cybertip-cli's job)
- Does not transcode or modify evidence (preservation rules require
  bit-exact retention)
- Does not provide legal advice on retention duration or access scope

## Jurisdiction-specific retention rules to encode

| Jurisdiction | Rule | Source |
|---|---|---|
| US federal | 18 U.S.C. § 2258A(h): 90 days, preservable on LE request | 2258A |
| US state varies | additional preservation may apply | per-state |
| EU | DSA Article 24: retention and traceability of orders | DSA |
| UK | Online Safety Act preservation requirements | OSA 2023 |
| AU | Online Safety Act eSafety preservation | OSA AU |

Counsel must confirm the specific timer values and the
preservation-extension triggers per jurisdiction.

## Open questions for counsel

1. **Encryption key custody.** Should EvidenceVault hold keys, or should
   keys live in the operator's KMS with EvidenceVault holding only
   wrapped ciphertext? (Recommended: the latter — minimizes blast
   radius if EvidenceVault is breached.)
2. **Access logging.** Every access logged with operator identity is
   the floor. Should we additionally require purpose-of-access
   attestation (subpoena number, internal audit reference)?
3. **Cross-border requests.** When a US-based operator receives a UK
   preservation request, what is EvidenceVault's role? Pass through to
   the operator, or store-and-acknowledge?
4. **Deletion certificates.** When retention expires, do we produce a
   tamper-evident deletion certificate? Required by some procurement
   standards.
5. **Counsel hold.** When litigation hold is invoked, automatic
   deletion must suspend. How is the hold signaled and revoked?
