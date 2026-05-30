# EvidenceVault

> Defensible, jurisdiction-aware evidence retention for CSAM reports — chain of custody and preservation timers that hold up in court.

**Status:** see `STATUS` file. **License:** Apache 2.0. **Recommendation:** `ship-with-caveats`.

## Problem

When a platform detects and reports CSAM to NCMEC (or IWF/local hotlines), US law (18 U.S.C. 2258A, extended by the REPORT Act of 2024) obligates it to preserve the reported material and surrounding evidence for at least 1 year, on request of law enforcement and under strict access controls — but detection vendors stop at "report and take action" and hand the legal-hold problem back to the platform. Trust and Safety teams end up improvising preservation in S3 buckets or general legal-hold tools that are neither CSAM-aware (they must minimize human exposure, gate access, and never re-scan illegal bytes) nor wired to the specific statutory timers and per-jurisdiction retention rules. The result is custody gaps, over- or under-retention, and evidence that a defense attorney can challenge.

## Gap in ecosystem

The detection layer (Thorn Safer, Google Content Safety API/CSAI Match, Meta PDQ, Project Arachnid Shield) is well covered by OSS and vendors, and the obligation is defined by NCMEC/statute — but nothing open-source sits in between to govern the *evidence* after a report fires. General legal-hold and WORM tools (S3 Object Lock, Google Vault, Relativity, Logikcull, Hanzo) exist but are expensive, generic, and have no concept of the 2258A/REPORT Act preservation clock, CSAM-specific minimization, or per-jurisdiction schedules. No OSS project packages KMS-backed sealed evidence + tamper-evident chain of custody + statutory preservation timers as a purpose-built T&S primitive, because the crypto is commoditized and the hard part (governance + jurisdictional legal mapping + court-defensibility) is unglamorous and legally sensitive to ship.

## Architecture

Polyglot service: a Go (or Rust) core API for the custody engine and a thin TypeScript admin/console, deployed as a stateless container fronting object storage and a KMS — runs self-hosted in the platform's own cloud account so illegal bytes never leave their trust boundary. An evidence package is a sealed envelope: reported media + report metadata + detection provenance, encrypted client-side with a per-package data key wrapped by the customer's KMS (AWS KMS / GCP KMS / Azure Key Vault / Vault Transit), written to WORM object storage (S3 Object Lock in COMPLIANCE mode or equivalent) so even an admin cannot delete before the timer expires. Chain of custody is an append-only, hash-chained event log (each entry references the prior entry's digest, à la a Merkle/transparency log; optionally anchored via an RFC 3161 timestamp authority) capturing every create/access/export/legal-hold/expiry event with actor, reason, and signed attestation. A policy engine evaluates declarative per-jurisdiction retention schedules (US, UK, EU, AU) and law-enforcement preservation requests, computing an effective retention/legal-hold expiry per package; a timer worker enforces preservation extensions and gated, audited destruction on expiry. Key abstractions: EvidencePackage, CustodyEvent, RetentionPolicy, PreservationRequest, LegalHold, AccessGrant (time-boxed, dual-control). No classifier and no thumbnailing of media ships in the box — it ingests sealed material plus the hash/decision from the upstream detector and deliberately does not look at the bytes.

## Existing tooling

Detection/hashing is owned by Thorn Safer, Google Content Safety API + CSAI Match, Meta PDQ/TMK+PDQF, Microsoft PhotoDNA, and Project Arachnid Shield; all explicitly end at "report and take action" and delegate evidence handling to the operator — EvidenceVault integrates downstream of them, not in competition. NCMEC CyberTipline and its ESP reporting API define the obligation but ship no retention tooling. C2PA/Content Credentials provides tamper-evident provenance manifests (COSE-signed claims, hard bindings) and is worth reusing as the *format* for asserting detection provenance inside a package, but it is built for authoring/publishing trust, not adversarial multi-year custody. The real incumbents are generic legal-hold/eDiscovery and WORM storage (AWS S3 Object Lock, Google Vault, Microsoft Purview, Relativity, Logikcull, Hanzo) — EvidenceVault layers a CSAM-aware governance and statutory-timer layer above S3 Object Lock/KMS rather than replacing them.

## v0.1 scope

- Sealed EvidencePackage ingest: accept media + report metadata + upstream detection provenance, envelope-encrypt with customer KMS, write to S3 Object Lock (COMPLIANCE mode). No bytes decrypted or thumbnailed server-side.
- Append-only hash-chained chain-of-custody log with signed entries (create/access/export/hold/expiry), each referencing the prior digest; tamper-evident and exportable as a verifiable audit bundle.
- US preservation timer wired to 2258A / REPORT Act (default 1-year clock) with one-button law-enforcement PreservationRequest extension and audited, dual-control gated destruction on expiry.
- Declarative per-jurisdiction RetentionPolicy packs for US/UK/EU/AU as versioned, human-readable YAML with an evaluation engine that computes effective expiry per package.
- Time-boxed, dual-control AccessGrant flow: every decrypt requires a reason + second approver, is fully logged, and auto-expires — enforcing minimization of human exposure.
- Admin console + REST/gRPC API + CLI for ingest, hold management, custody-bundle export, and a court-ready custody/attestation report (PDF + machine-readable).
- Reference adapters showing ingest from a Thorn Safer / PhotoDNA-style detection event so platforms can wire it behind existing pipelines.

## APIs and specs

- 18 U.S.C. § 2258A — ESP reporting & preservation duty: https://www.law.cornell.edu/uscode/text/18/2258A
- REPORT Act (Pub. L. 118-59, 2024) — extends CSAM preservation from 90 days to 1 year: https://www.congress.gov/bill/118th-congress/senate-bill/1080
- NCMEC CyberTipline / ESP resources (reporting API, espteam@ncmec.org): https://report.cybertip.org/ and https://www.missingkids.org/gethelpnow/cybertipline
- C2PA Content Credentials 2.x spec (provenance manifests, COSE claim signatures, hard bindings): https://spec.c2pa.org/specifications/specifications/2.1/index.html
- AWS S3 Object Lock (WORM / COMPLIANCE retention mode): https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html
- AWS KMS envelope encryption / GenerateDataKey: https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#enveloping
- RFC 3161 Time-Stamp Protocol (trusted timestamping for custody anchoring): https://www.rfc-editor.org/rfc/rfc3161
- EU DSA Art. 9/10 orders & UK Online Safety Act 2023 (jurisdictional retention drivers): https://eur-lex.europa.eu/eli/reg/2022/2065/oj and https://www.legislation.gov.uk/ukpga/2023/50

## Funding model

Buyer is the Head of Trust & Safety or the Deputy General Counsel / compliance officer at a mid-size UGC platform (dating, social, gaming, marketplaces, hosting) already reporting to NCMEC and scared of a custody challenge or an FTC/Ofcom audit — this comes from the legal-risk budget, not the detection-vendor budget. Apache-2.0 core drives adoption and trust (security-sensitive buyers must read the code); revenue is (1) a hosted control-plane SaaS that manages timers, jurisdictional policy packs, and audit reporting while encrypted bytes stay in the customer's own bucket — priced per active legal hold / per seat; (2) maintained, lawyer-reviewed jurisdiction policy packs (US/UK/EU/AU plus additions) sold as a content subscription; (3) enterprise support plus a 'court-defensibility' attestation/expert-declaration package for litigation; (4) for digitalharm.org specifically, a child-safety foundation or industry-consortium grant (Tech Coalition / Lantern-adjacent) to fund the public-good core and a free tier for smaller platforms that cannot afford Relativity.

## Risks

Biggest risk is legal-correctness liability: if a jurisdiction policy pack is wrong and a platform under-retains or destroys evidence on EvidenceVault's timer, that is federal exposure — every retention rule must be lawyer-reviewed, versioned, and shipped with explicit 'not legal advice / verify with counsel' framing, and destruction must be gated, reversible-until-committed, and dual-control. Second, abuse/over-exposure: the system by design holds sealed CSAM, so it is a high-value target and an insider-access vector; mitigations are no-decrypt-by-default, time-boxed dual-control access grants, full custody logging, and never re-scanning or thumbnailing bytes (avoid creating new illegal derivatives or re-victimization). Third, scope creep into becoming a detection or review tool — it must stay a custody/retention primitive and refuse to classify. Fourth, a mis-scoped legal hold could freeze and expose benign user content, so package scoping and minimization need hard guardrails. Adoption risk: large platforms have bespoke internal systems; the wedge is mid-size platforms and the grant-funded smaller tier.

---

See [the full design spec in docs/tools/evidencevault.md](../../docs/tools/evidencevault.md) for the
extended workflow-synthesis context. The portfolio overview lives in the
[root README](../../README.md).
