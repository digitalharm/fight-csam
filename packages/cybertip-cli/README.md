# CyberTip CLI

> The §2258A CyberTipline report-filing layer every platform's lawyer currently rebuilds from a PDF.

**Status:** see [`STATUS`](STATUS) — for the canonical state across all tools, see [`docs/roadmap.md`](../../docs/roadmap.md). **License:** Apache 2.0. **Recommendation:** `ship-with-caveats`.

## Problem

US electronic service providers are legally required under 18 U.S.C. §2258A to report apparent CSAM to NCMEC's CyberTipline, but NCMEC ships only a PDF spec and an XSD for its REST/XML ESP API. Every platform's engineering and legal team independently rebuilds the same submit→upload→fileinfo→finish state machine, retry logic, evidence packaging, and audit trail — error-prone work that, when it fails silently, becomes a federal compliance gap.

## Gap in ecosystem

The entire commercial and OSS CSAM ecosystem (Thorn Safer, Hive, PhotoDNA, IWF, Project Arachnid Shield) stops at detection, hashing, and takedown notices — none file the actual statutory CyberTipline report, which platforms must do themselves. The only OSS CyberTipline clients are abandonware (ello/ncmec_reporting, Ruby, 7 stars, untouched since 2022) or unofficial type stubs (Johannes-Andersen/CyberTipline-Tools, TS). No maintained, audited, language-agnostic library packages the submission workflow with retries, redaction, and audit logging.

## Architecture

A Rust core library (memory-safety matters when the payload is CSAM evidence) compiled to a static CLI binary, with thin FFI/native bindings published to PyPI and npm so existing Python/Node trust-and-safety stacks can embed it. Report objects are generated from NCMEC's published XSD at build time (codegen, not hand-rolled XML) so schema drift is a version bump, not a silent break. The submission engine is an idempotent state machine over the five ESP operations (submit/upload/fileinfo/finish/retract) with a durable on-disk WAL so a crashed finish resumes rather than orphaning a report or double-filing. Pluggable trait-based modules: a Transport (the NCMEC REST client plus a record/replay mock for CI), a RedactionPolicy (strips reporter PII and internal IDs from local audit copies per a declared retention class), and an AuditSink (append-only, hash-chained JSONL, tamper-evident for the §2258A preservation requirement). Ships an explicit sandbox/test-mode flag wired to NCMEC's test endpoint so no one accidentally files live reports during integration.

## Existing tooling

Detection/hashing/takedown is well-served and should be integrated with, not rebuilt: Thorn Safer (commercial, classifies + hashes), Hive (commercial moderation API), Microsoft PhotoDNA (hash matching), IWF and Project Arachnid Shield (free hash lists + takedown notices, C3P-operated), Meta's PDQ/TMK+PDQF and ThreatExchange (OSS hashing primitives). CyberTip CLI sits strictly downstream: it consumes a detection result plus evidence and produces a filed NCMEC report. For provenance metadata it can optionally embed C2PA manifest data where present. It replaces only the bespoke, per-platform glue code that bridges "we detected something" to "NCMEC has a valid report," and integrates with the rest.

## v0.1 scope

- XSD-codegen of the NCMEC report model plus a typed builder API that fails closed on missing mandatory fields (incident type, reporter name/email, at least one internet-incident detail)
- Idempotent submit→upload→fileinfo→finish state machine with crash-resumable WAL, exponential-backoff retries, and the 24-hour auto-deletion window surfaced as a hard deadline
- First-class sandbox mode bound to NCMEC's test/status endpoint, with a loud refusal to file live without an explicit --production flag and valid credentials
- Append-only hash-chained audit log of every request/response and a one-command redacted report export for §2258A preservation and external audit
- CLI for one-off and batch filing plus a stable library API, with Python (PyPI) and Node (npm) bindings over the Rust core
- Record/replay mock transport so platforms can test the full workflow in CI without touching NCMEC
- A from-the-PDF documentation site mapping each XSD field to plain-English meaning and the statutory basis

## APIs and specs

- NCMEC CyberTipline ESP Reporting API (REST/XML, basic auth; operations submit/upload/fileinfo/finish/retract; XSD at /xsd) — https://report.cybertip.org/ispws/documentation
- 18 U.S.C. §2258A reporting + §2258B liability protection — https://www.law.cornell.edu/uscode/text/18/2258A
- C2PA content provenance spec (optional evidence-provenance metadata) — https://c2pa.org/specifications/
- Meta PDQ / TMK+PDQF perceptual hashing (upstream detection primitives) — https://github.com/facebook/ThreatExchange
- Prior art to supersede — https://github.com/Johannes-Andersen/CyberTipline-Tools and https://github.com/ello/ncmec_reporting

## Funding model

The open-source core stays free to maximize §2258A compliance adoption, with maintenance underwritten by a child-safety foundation grant (NCMEC or a Tech Coalition member, whose mandate is exactly this). Revenue comes from the buyer who feels the pain at scale: the Trust & Safety lead or compliance officer at a Series B–D platform — past the point where reports are routine but before they have dedicated T&S engineering. They buy a hosted managed tier: a SOC 2 audited submission relay with retry SLAs, a verified-against-NCMEC-staging conformance badge, queue dashboards, and indemnity-grade audit-log retention. Secondary streams: paid enterprise support and a commercial dual-license for detection vendors (Thorn, Hive) who want to embed report-filing without the Apache attribution surface.

## Risks

Abuse vector: a frictionless filing tool could be weaponized for false or mass reports against NCMEC and law enforcement — mitigated by requiring valid ESP credentials (NCMEC gatekeeps these) and never shipping a public hosted submit endpoint. False positives carry real blast radius (a wrongly-filed report can trigger law-enforcement contact against an innocent user), so the tool must remain a downstream formatter that never decides what is CSAM — that judgment stays with human review. Jurisdictional scope creep is the biggest trap: NCMEC is US-only, and bolting on IWF, C3P, and EU regimes would balloon scope and dilute correctness, so v0.1 must stay US-only. Handling real CSAM bytes locally is a hazard; the design must default to never persisting media (only hashes/metadata), and the redaction and audit modules must be the most heavily tested code in the repo.

---

See [the full design spec in docs/tools/cybertip-cli.md](../../docs/tools/cybertip-cli.md) for the
extended workflow-synthesis context. The portfolio overview lives in the
[root README](../../README.md).
