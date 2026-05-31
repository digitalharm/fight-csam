# CSAM-Shield

> One-line middleware that wires PhotoDNA, PDQ, Arachnid Shield, and Cloudflare behind a single match / nomatch / pending interface — for Express, Fastify, FastAPI, and Hono.

**Status:** see [`STATUS`](STATUS) — for the canonical state across all tools, see [`docs/roadmap.md`](../../docs/roadmap.md). **License:** Apache 2.0. **Recommendation:** `ship-with-caveats`.

## Problem

Any platform that hosts user-uploaded images is legally required (in the US, 18 U.S.C. §2258A) to report known CSAM to NCMEC, but the detection providers — Microsoft PhotoDNA, Meta PDQ, Canadian Centre Arachnid Shield, Cloudflare — each have different access gates, hash formats, auth schemes, response shapes, and retry semantics. A small engineering team faces a multi-week integration per provider before a single upload is screened, so most ship nothing. CSAM-Shield collapses that into a framework-native middleware call plus one config block, returning a normalized verdict and emitting an auditable event trail.

## Gap in ecosystem

Provider SDKs exist (Arachnid Shield ships official MIT SDKs in TS/PHP/Rust/Python; Meta's BSD ThreatExchange ships PDQ + Open Media Match), but each speaks only to its own backend with its own auth and response schema — there is no thin adapter layer that normalizes match/nomatch/pending across providers behind a framework request hook. Cloudflare's scanner is free but locked to its proxy with no standalone API, PhotoDNA has no public backend SDK, and the commercial bundles (Thorn Safer, Hive) are closed and priced for enterprises. Nothing OSS connects detection to the legally load-bearing CyberTipline reporting + preservation duty in the same flow.

## Architecture

TypeScript monorepo (pnpm workspaces) as the reference implementation, plus a thin Python package mirroring the same interface for FastAPI. Core is a runtime-agnostic `@csam-shield/core` engine: a `Scanner` orchestrator holding an ordered list of provider `Adapter`s (PhotoDNA, PDQ/OpenMediaMatch, ArachnidShield, Cloudflare-Images) each implementing `hash(buffer) → Hashes` and `match(hashes) → ProviderVerdict`. Adapters are pluggable and config-driven; the engine fans out (parallel or first-match-wins), normalizes results into a single `{verdict: 'match'|'nomatch'|'pending', confidence, matchType: 'exact'|'near', providers[], hashes}` envelope, and emits typed events (`scan.started`, `scan.matched`, `scan.pending`, `report.filed`) through an EventEmitter/async iterator. Framework bindings (`@csam-shield/express`, `/fastify`, `/hono`, `csam_shield.fastapi`) are ~50-line wrappers that pull the image buffer/stream from the request, call the engine, attach the verdict to the request context, and (on match) hand off to an optional `Reporter`. Long-running providers return `pending` immediately with a callback/poll handle backed by a pluggable queue interface (default in-memory, adapters for BullMQ/SQS). Secrets via env; no image bytes are persisted by default — only hashes and verdict metadata, written through a pluggable `AuditSink`.

## Existing tooling

Meta ThreatExchange (BSD) provides PDQ/vPDQ hashing and the Hasher-Matcher-Actioner / Open Media Match deployment — powerful but a full Python/C++ service you must host and feed your own hash database; not drop-in middleware. Canadian Centre for Child Protection's Arachnid Shield is a free HTTP API with official MIT SDKs (TS/PHP/Rust/Python) returning classification + match_type + near_match_details — CSAM-Shield wraps it as one adapter rather than replacing it. Cloudflare's CSAM Scanning Tool is free but tied to its caching proxy with no standalone API. Microsoft PhotoDNA is access-gated with no public backend SDK. Thorn Safer and Hive are closed commercial products (also bundling NCMEC reporting). CSAM-Shield integrates with and layers above these — it is an abstraction/orchestration tier, not a new hash algorithm or detection model.

## v0.1 scope

- Core engine + adapter interface with two working adapters: Arachnid Shield (free, immediate access, normalized from its MIT SDK) and a self-hosted PDQ/Open Media Match adapter — proving the multi-provider normalization works end to end.
- Express and Fastify bindings: `app.use(csamShield({ providers: [...] }))` attaches a normalized `req.csam` verdict; documented FastAPI dependency and Hono middleware ship in the same release.
- Unified response contract { verdict: match|nomatch|pending, matchType, confidence, providers[], hashes } plus typed events (scan.started/matched/pending, report.filed) via EventEmitter and async iterator.
- Pending-result handling for slow providers: immediate `pending` return with a queue-backed poll/callback handle (in-memory default).
- Pluggable AuditSink that records hashes + verdict + timestamp (never image bytes by default) so platforms have a defensible compliance trail; console + JSONL sinks included.
- Optional NCMEC CyberTipline Reporter stub interface (clearly marked as requiring the platform's own NCMEC ESP credentials and legal sign-off) — wiring point, not an auto-reporter.
- Test fixtures using public non-CSAM test vectors / synthetic hashes only, a mock provider adapter, and a hard CI rule that no real or sample illegal content ever enters the repo.

## APIs and specs

- Microsoft PhotoDNA (access-gated): https://www.microsoft.com/en-us/photodna/documentation
- Meta PDQ / vPDQ / Open Media Match (BSD): https://github.com/facebook/ThreatExchange
- Canadian Centre for Child Protection — Arachnid Shield API (OpenAPI 3.1): https://shield.projectarachnid.com/docs/
- Arachnid Shield official TypeScript SDK (MIT): https://github.com/CdnCentreForChildProtection/arachnid-shield-sdk-ts
- Cloudflare CSAM Scanning Tool (proxy-bound, no standalone API): https://blog.cloudflare.com/the-csam-scanning-tool/
- NCMEC CyberTipline / ESP reporting + legal duty (18 U.S.C. §2258A): https://www.missingkids.org/theissues/csam and https://report.cybertip.org/ispws/documentation
- C2PA content provenance spec (adjacent, for AI-generated-media labeling): https://c2pa.org/specifications/specifications/2.1/index.html

## Funding model

Self-funding via three named buyers. (1) The platform CTO / head of trust & safety at a Series-A–C UGC startup (Discord-likes, image hosts, dating, marketplaces) who needs §2258A coverage before launch — sell a hosted control-plane: managed provider credential brokering, a verdict/audit dashboard, and SLA'd pending-queue infrastructure at ~$500–2k/mo, while the middleware stays free OSS. (2) The compliance officer / DPO at a mid-market platform — sell an enterprise support + indemnity-adjacent tier (audit-log retention, signed compliance attestations, priority CVE response) at ~$15–40k/yr. (3) Foundation/grant funding for the open core: child-safety and internet-integrity funders (e.g. Tech Coalition / Lantern-adjacent programs, internet-safety grant lines) fund the OSS adapters and docs as public infrastructure, since this directly increases the number of small platforms that can report to NCMEC at all.

## Risks

False-positive blast radius is the central danger: a near-match hash on a legitimate upload can wrongly flag a user as a CSAM offender, so the engine must surface confidence/matchType and default to human-in-the-loop on near matches rather than auto-actioning — the library must never auto-report or auto-ban. Abuse and jurisdiction risk: PhotoDNA/NCMEC access is intentionally gated, the CyberTipline duty is US-specific and interacts with EU/UK e-evidence and data-protection law differently, and an OSS tool could be misread as making provider hash databases or detection thresholds more accessible than the providers intend — the Reporter is deliberately a stub requiring the platform's own credentials and counsel. Scope creep toward becoming a full moderation platform (queues, review UI, novel-CSAM classifiers, video) would dilute the one-line-middleware value and pull the project into liability it should not hold; v0.1 must stay an adapter/normalization layer, ship only with synthetic test vectors, and document loudly that hosting/transmitting real CSAM for testing is itself a crime.

---

See [the full design spec in docs/tools/csam-shield.md](../../docs/tools/csam-shield.md) for the
extended workflow-synthesis context. The portfolio overview lives in the
[root README](../../README.md).
