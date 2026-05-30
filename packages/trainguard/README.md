# TrainGuard

> A pre-flight CSAM screening gate that audits your training corpus against authoritative hash lists and emits a signed, chain-of-custody compliance report before fitting starts.

**Status:** see `STATUS` file. **License:** AGPL-3.0. **Recommendation:** `ship-with-caveats`.

## Problem

AI image/video model builders ingest web-scraped datasets (LAION-style) with no standard, auditable step that checks the corpus against known-CSAM hash lists before training. Stanford Internet Observatory's December 2023 finding that LAION-5B contained hundreds of confirmed CSAM URLs made the failure mode concrete: the material was discoverable with existing hashes, but no one ran the check at the dataset-assembly stage. Today this screening is improvised per-lab, gated behind hard-to-get credentials, and produces no portable artifact a legal/trust-and-safety team can rely on.

## Gap in ecosystem

The matching primitives exist (Meta PDQ/vPDQ, Microsoft PhotoDNA, NCMEC/IWF/Arachnid hash lists) but they are built for live content-moderation of user uploads, not for batch auditing of a static training corpus, and they are scattered behind separate credentialing regimes with no common interface. Meta's Hasher-Matcher-Actioner is an AWS-resident moderation service, not a portable dataset gate, and it ships no compliance/chain-of-custody report. No clean, vendor-neutral OSS tool today says "point me at your WebDataset/Parquet shards, screen them against every list I have credentials for, and hand me a signed report I can show counsel" — that orchestration-plus-provenance layer is the missing piece.

## Architecture

Python 3.11 monorepo shipped as a CLI (`trainguard`) plus a thin library, with an optional FastAPI control-plane for CI integration; packaged via PyPI and an OCI image. Core abstractions: (1) a `DatasetReader` plugin layer that streams samples from local dirs, WebDataset tar shards, Parquet/Arrow, and HF `datasets`, decoding images/video-keyframes lazily; (2) a `Matcher` backend interface so each hash source is a swappable adapter — PDQ and vPDQ ship in-box (Meta's BSD code, no external account), while PhotoDNA, NCMEC Hash Sharing, IWF, and Arachnid Shield are operator-credentialed adapters that the operator activates with their own keys. A `ScreeningEngine` fans shards across a worker pool, computes hashes once and queries every enabled matcher, and writes structured findings to a local SQLite/Parquet ledger. A `ReportBuilder` emits a deterministic JSON report plus a human-readable PDF, signed with the operator's key (COSE/X.509) and optionally embedded as a C2PA manifest attached to a dataset-manifest asset. Hard architectural invariant: TrainGuard never bundles or redistributes any hash list and never persists matched media bytes — it stores only hashes, shard offsets, match verdicts, and timestamps, so the tool itself never becomes a CSAM repository or a hash-list leak vector.

## Existing tooling

Meta ThreatExchange (BSD) provides PDQ (256-bit perceptual image hash), TMK+PDQF and vPDQ (video), the python-threatexchange library, and Hasher-Matcher-Actioner / Open Media Match — these are the matching engines TrainGuard reuses, but they target live moderation, not corpus auditing, and emit no compliance artifact. Microsoft PhotoDNA is the industry-standard perceptual hash but is closed, Microsoft-gated, and cannot be redistributed (so it can only ever be an operator-credentialed adapter, never bundled). NCMEC Hash Sharing v2, the IWF Hash List (paid membership), and Project Arachnid Shield (free, self-serve API key, exact + PhotoDNA close-match) are the authoritative hash sources, each behind its own access regime. Thorn Safer and Hive AI offer commercial managed CSAM-detection APIs but are proprietary, per-scan-priced SaaS aimed at UGC platforms. Cloudflare's CSAM Scanning Tool is free but scopes to sites behind Cloudflare. HF NSFW classifiers detect adult content, not known CSAM, and are not legally meaningful here. TrainGuard integrates with (does not replace) the hash sources and the Meta matchers, and layers the missing dataset-gate + signed-report function above all of them.

## v0.1 scope

- `trainguard scan <path>` CLI that streams a local directory or WebDataset tar shards, computes PDQ on every image (decoded once, parallelized), and matches against an operator-supplied hash file with a configurable Hamming-distance threshold.
- In-box PDQ image matching with zero external credentials (using Meta's BSD reference implementation) so the tool is useful on day one before any list access is granted; vPDQ video-keyframe matching as a fast-follow.
- Pluggable operator-credentialed adapter for at least one live list — Project Arachnid Shield first, since it has a free, self-serve API key — with a credential-config file that never logs or persists the keys.
- A deterministic, machine-readable JSON compliance report (corpus hash, shard inventory, counts scanned/skipped/matched, per-match score and source, tool+list versions, UTC timestamps) plus a rendered PDF summary.
- Cryptographic signing of the report with the operator's X.509 key (COSE), producing a tamper-evident chain-of-custody artifact; optional C2PA manifest embedding behind a flag.
- Safe-by-default findings handling: matches are flagged for human review with confidence bands, never auto-deleted and never auto-reported to NCMEC; matched media bytes are never written to disk by TrainGuard.
- A GitHub Action / CI wrapper and non-zero exit code on match, so the screen can gate a training pipeline (block-on-match or warn-only, configurable).

## APIs and specs

- Meta ThreatExchange / PDQ / vPDQ / Hasher-Matcher-Actioner (BSD): https://github.com/facebook/ThreatExchange
- python-threatexchange library: https://pypi.org/project/threatexchange/
- NCMEC Hash Sharing API v2 (credentialed; CSAM/Exploitative/Generative-AI environments; MD5, SHA1, PhotoDNA, PDQ, NetClean, TMK+PDQF): https://report.cybertip.org/hashsharing/v2/documentation/
- Project Arachnid Shield API (free, self-serve API key; exact + PhotoDNA close-match), C3P: https://projectarachnid.ca/en/
- IWF Hash List (paid membership; PhotoDNA, MD5, SHA-1, PDQ): https://www.iwf.org.uk/our-technology/our-services/hash-list/
- Microsoft PhotoDNA (closed, Microsoft-gated): https://www.microsoft.com/en-us/photodna
- C2PA 2.1 specification (manifests, claims, COSE signing, c2pa.actions / training-mining assertions for provenance): https://spec.c2pa.org/specifications/specifications/2.1/index.html
- WebDataset shard format (training-pipeline input): https://github.com/webdataset/webdataset

## Funding model

Three concrete buyers. (1) Foundation/public-interest grant funding for the core OSS: the in-box PDQ/vPDQ screening, dataset readers, and report format stay free — pitched to Knight Foundation, the Patrick J. McGovern Foundation, or AI-safety funders (the same constituency that funds Thorn-adjacent work), with digitalharm.org as fiscal/branding host. (2) A hosted compliance tier sold to the platform CTO or Head of Trust & Safety at mid-size generative-AI labs and dataset vendors (the Stability/Midjourney/LAION-consumer tier) who want screening run inside their VPC with credential brokerage, signed reports retained for audit, and SLA support — AGPL is the lever that pushes these commercial users to the paid hosted/dual-license tier rather than self-forking a closed copy. (3) Enterprise support + dual-license contracts sold to the compliance officer / outside counsel who needs to attest screening occurred under EU AI Act and US REPORT Act / PROTECT Act diligence expectations and wants indemnifiable, supported software rather than a community project. The recurring maintenance cost (keeping list adapters current as APIs change) is funded by (2) and (3); (1) bootstraps v0.1.

## Risks

False positives are the sharpest risk: a perceptual-hash collision flags benign images, and a tool that mislabels a user's data as CSAM creates legal and reputational blast radius — so TrainGuard must report match scores/distances with confidence bands and a "flag-for-review, never auto-delete or auto-report" default, leaving NCMEC reporting to the human operator who has the legal standing to do it. Abuse vectors: the tool must not become a way to test whether a given image is in the hash lists (a known oracle attack that helps offenders evade detection) — mitigations include rate limiting, operator-credentialed-only access to remote lists, and refusing to persist or expose matched media. Jurisdiction: lawful handling of suspected CSAM differs by country (mandatory-reporting duties, who may possess it), and only NCMEC-registered ESPs may file CyberTipline reports, so the tool stays a screening-and-evidence layer and is explicit that it is not legal advice. Scope creep is real — resist drifting into general NSFW classification, takedown automation, or becoming a hash-list mirror; staying a thin, auditable orchestration-plus-provenance gate is what keeps it both safe and shippable.

---

See [the full design spec in docs/tools/trainguard.md](../../docs/tools/trainguard.md) for the
extended workflow-synthesis context. The portfolio overview lives in the
[root README](../../README.md).
