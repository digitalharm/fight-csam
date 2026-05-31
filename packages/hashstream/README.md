# HashStream

> Version control and an audit trail for the CSAM hash lists you're legally on the hook for.

**Status:** see [`STATUS`](STATUS) — for the canonical state across all tools, see [`docs/roadmap.md`](../../docs/roadmap.md). **License:** Apache 2.0. **Recommendation:** `ship-with-caveats`.

## Problem

Every platform that screens uploads against NCMEC, IWF, and Project Arachnid hash lists independently builds polling, diffing, deduplication, and storage logic, because none of those sources ship clean incremental updates — NCMEC's API forces you to page over date ranges and track timestamps yourself. Worse, when a match is later challenged (a CyberTipline dispute, a wrongful-takedown complaint, or discovery), almost no one can answer "exactly which hash, from which source, at which version, was active at the moment we flagged this file." HashStream is the shared mirror, version-control, and audit layer that removes both problems.

## Gap in ecosystem

The closest OSS tool, Meta's python-threatexchange/HMA, fetches and matches via checkpointable updates against NCMEC/StopNCII/TAT but explicitly keeps only current synchronized state in ~/.threatexchange — no versioned snapshots, no diff history, no "what was active when" audit log. Commercial tools (Thorn Safer, Hive, Cloudflare) are downstream matchers/classifiers that consume hash lists rather than version and attest to them. No one ships the corpus-versioning-and-provenance layer as standalone, self-hostable infrastructure.

## Architecture

Go monolith (single binary, optionally split into ingestor + API) over Postgres, with content-addressed snapshot blobs in S3-compatible object storage (MinIO for self-host). Source adapters implement a common Fetcher interface (NCMEC v2, IWF, Arachnid Shield, plus a generic ThreatExchange/StopNCII adapter wrapping python-threatexchange); a scheduler polls each source on its own cadence, normalizes records into a canonical hash row (algorithm, value, source, category, first_seen, last_seen, tombstone flag), and computes a deterministic Merkle-rooted snapshot per source per fetch. Each snapshot gets a monotonic version ID and a content hash; diffs (added/removed/recategorized) are materialized between consecutive versions. Consumers pull via a read API (full snapshot export in HMA/PDQ-compatible formats, or just-the-diff since version N), subscribe to HMAC-signed webhooks on new versions, and every served snapshot/diff is written to an append-only, hash-chained audit log. Deploys as Docker Compose for self-host or a multi-tenant hosted plane; source credentials live in env/Vault, never in the DB.

## Existing tooling

Meta ThreatExchange / Hasher-Matcher-Actioner / python-threatexchange (Apache-2.0): mature fetch+match with a checkpointable SignalExchangeAPI for NCMEC, StopNCII, and Tech Against Terrorism — HashStream integrates with it as both an upstream adapter and a downstream consumer rather than replacing the matcher. NCMEC Hash Sharing API v2, IWF Hash List, and Project Arachnid Shield are the upstream sources being mirrored (all credential/membership-gated). Thorn Safer, Hive AI, and Cloudflare's CSAM Scanning Tool are commercial matching/classification services that sit downstream of the hash corpus. HashStream layers above the sources and beside HMA: it is the versioning, diffing, distribution, and audit substrate none of them provide.

## v0.1 scope

- NCMEC Hash Sharing API v2 ingestor: poll /v2/entries by date range, track maxTimestamp, handle deletedImage/deletedVideo tombstones, normalize MD5/SHA1/PDQ/PhotoDNA into canonical rows.
- Versioned snapshots: each fetch produces an immutable, Merkle-rooted, content-hashed snapshot with a monotonic version ID, plus a materialized diff (added/removed/recategorized) against the prior version.
- Read API + exports: GET full snapshot or GET diff-since-version-N, served in HMA/PDQ-compatible and raw formats, with stable pagination.
- Signed webhook notifications on every new version, with HMAC signatures and at-least-once delivery plus retries.
- Append-only, hash-chained audit log answering 'which source+version was active at timestamp T and what did it contain' — queryable and exportable for disputes/discovery.
- Self-host deployment: Docker Compose bundle (Go binary + Postgres + MinIO) with credential config via env/Vault and a one-command bootstrap.
- Generic ThreatExchange/StopNCII adapter (wrapping python-threatexchange) so existing HMA users can put their exchanges under the same versioning/audit layer.

## APIs and specs

- NCMEC Hash Sharing API v2 — https://report.cybertip.org/hashsharing/v2/documentation/ (GET /v2/entries date-range query, maxTimestamp pagination, deletedImage/deletedVideo tombstones, Basic auth, XML/JSON)
- Meta python-threatexchange / HMA / SignalExchangeAPI — https://github.com/facebook/ThreatExchange/tree/main/python-threatexchange (checkpointable fetch_iter; NCMEC, StopNCII, TAT adapters)
- PDQ & TMK hashing algorithms (Meta) — https://github.com/facebook/ThreatExchange/tree/main/pdq
- IWF Image Hash List service — https://www.iwf.org.uk/our-technology/our-services/image-hash-list/ (PhotoDNA/SHA1/MD5, member distribution)
- Project Arachnid Shield (Canadian Centre for Child Protection) — https://projectarachnid.ca/en/ (PhotoDNA/MD5/SHA1 match API)
- C2PA Content Provenance spec (adjacent provenance standard, for future manifest signing) — https://c2pa.org/specifications/

## Funding model

Open-core. The Apache-2.0 self-hostable core (ingestors, snapshots, diffs, webhooks, audit log) is free so small platforms and NGOs adopt it and it becomes the reference standard. Revenue comes from a hosted multi-tenant plane sold to platform Trust & Safety / compliance leads — the buyer is a Head of T&S or Deputy General Counsel at a mid-size UGC platform (Discord/Roblox-scale down to a 30-person social app) who does not want to hold NCMEC credentials, run polling infra, or be the one explaining a stale hash list to a regulator: per-seat plus per-source subscription, roughly $2–6k/mo, covering managed credential brokering, SLA'd freshness, signed compliance-export bundles for EU DSA / UK Online Safety Act / US reporting, and audit-log retention. Secondary: child-safety foundation or EU-funded grants (in-scope for Safe Online / EU Internet Forum funding) to underwrite the OSS core and an NGO hosting tier.

## Risks

HashStream stores only hashes, never imagery, which keeps it on the right side of possession law — but mirroring NCMEC/IWF/Arachnid data is contractually gated, so the hosted plane must broker each tenant's own credentials rather than redistribute lists, and securing those data-sharing agreements is the real adoption bottleneck, not the code. Abuse vector: the diff/snapshot API leaks the rate and shape of hash-list growth, which adversaries could probe to infer detection coverage — diffs must be access-controlled, rate-limited, and never expose source imagery metadata. False-positive blast radius is inherited from the sources (a bad PhotoDNA/PDQ entry flags innocent users), so HashStream must support fast tombstoning/rollback and never present itself as the matcher or the arbiter of what is CSAM. Scope creep toward becoming a full HMA-style matcher would dilute the wedge and duplicate Meta's work; the discipline is to stay the version-control-and-audit layer.

---

See [the full design spec in docs/tools/hashstream.md](../../docs/tools/hashstream.md) for the
extended workflow-synthesis context. The portfolio overview lives in the
[root README](../../README.md).
