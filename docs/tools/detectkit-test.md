# DetectKit-Test

> Synthetic, CSAM-free test fixtures and a false-positive harness so engineers can prove their detection plumbing works in CI without ever touching illegal material.

**Status:** see `STATUS` file. **License:** Apache 2.0. **Recommendation:** `ship-with-caveats`.

## Problem

Platforms wiring up CSAM detection (PhotoDNA, PDQ, MD5/SHA-1, TMK+PDQF/vPDQ) cannot legally possess real CSAM to test their pipelines, so the matching path is the one critical safety system that ships effectively untested. Teams either skip integration tests, hand-roll brittle one-off fixtures, or only discover plumbing bugs (wrong byte order, truncated hashes, threshold misconfiguration, silently dropped reports) in production where failures mean missed reports or wrongful account bans.

## Gap in ecosystem

facebook/ThreatExchange ships PDQ/TMK/vPDQ algorithms plus a small pdq/data image set, but those samples exist only to verify an implementation matches the C++ reference (distance <=10); there are no engineered collision pairs, no false-positive corpus, and no fixtures spanning every NCMEC fingerprint type. NCMEC Hash Sharing and Project Arachnid Shield are access-gated production services with no public sandbox or synthetic test data. Nobody has packaged a legally-clean, CI-runnable conformance and false-positive harness because the people who feel the pain (trust-and-safety engineers) are exactly the people who cannot share data to build it.

## Architecture

Python 3.10+ monorepo published to PyPI as detectkit-test, with a thin Rust/PyO3 core only if PDQ/TMK generation speed demands it (default: pure-Python via Pillow plus the pdqhash and existing ThreatExchange reference libs). Five modules: (1) fixtures/ ships versioned, content-addressed synthetic media (procedurally generated noise/gradient/shape images and short clips, all provably non-CSAM) with a sidecar manifest of expected fingerprints per algorithm; (2) generators/ recomputes those fingerprints deterministically so fixtures can be regenerated and audited; (3) collide/ engineers near-duplicate pairs at targeted Hamming distances (e.g. PDQ pairs at distance 0, 31, 32, 90) to exercise threshold boundaries; (4) harness/ is a pytest plugin plus CLI (detectkit run) that feeds fixtures through a user-supplied adapter implementing a ~12-line MatcherAdapter protocol and asserts hit/miss/score; (5) report/ emits a JUnit XML plus JSON false-positive/recall characterization table. Distribution is pip plus a prebuilt GitHub Action. No network calls, no real hashes from any sharing program ever stored.

## Existing tooling

facebook/ThreatExchange (BSD-licensed) provides the PDQ, TMK+PDQF, vPDQ reference implementations and the Hasher-Matcher-Actioner platform — DetectKit-Test integrates with these as the canonical hashers rather than reimplementing them, and treats HMA as a primary adapter target. Microsoft PhotoDNA, Thorn Safer, Google CSAI Match/Content Safety API, Hive, and Cloudflare's CSAM Scanning Tool are closed commercial detectors that DetectKit-Test would test against (via adapters) but does not replace. NCMEC Hash Sharing and Project Arachnid Shield are the hash-list sources whose fingerprint formats we mirror. C2PA is adjacent (provenance/soft-binding perceptual hashes) and is a stretch fixture type, not core. Net: we layer a test/conformance harness above an ecosystem that today ships detectors and algorithms but no legal way to test the integration.

## v0.1 scope

- Ship a versioned corpus of ~200 procedurally-generated, provably-non-CSAM synthetic images plus ~10 short video clips, each with a signed manifest of expected fingerprints (MD5, SHA-1, PDQ, TMK+PDQF, vPDQ) and a deterministic regeneration script.
- PDQ collision/near-duplicate generator producing pairs at exact target Hamming distances (0, 10, 31, 32, 90) so teams can assert their configured match threshold (default <=31) behaves at the boundary.
- MatcherAdapter protocol (a ~12-line Python interface) plus reference adapters for ThreatExchange/HMA and a no-op mock, so a platform plugs its own pipeline in once and runs the suite.
- pytest plugin and detectkit run CLI that asserts each fixture produces the expected hit/miss/score and fails CI on plumbing regressions (truncation, endianness, dropped enqueue).
- False-positive characterization harness: run N unrelated synthetic images through an adapter and emit a recall/precision/FP-rate table as JSON plus JUnit XML.
- Prebuilt GitHub Action and a clear SECURITY/SCOPE doc stating the project never ingests real CSAM or real hash lists.
- Exact-match (MD5/SHA-1) and exact-fingerprint conformance fixtures covering every NCMEC-supported exact and perceptual type the corpus can legally represent.

## APIs and specs

- facebook/ThreatExchange (PDQ, TMK+PDQF, vPDQ, HMA): https://github.com/facebook/ThreatExchange
- PDQ algorithm + matching thresholds (distance <=31 match, quality <=49 discard, <=10 impl-correctness): https://raw.githubusercontent.com/facebook/ThreatExchange/main/pdq/README.md
- NCMEC Hash Sharing / CyberTipline (fingerprint types: MD5, SHA-1, PDQ, PhotoDNA): https://report.cybertip.org and https://www.missingkids.org/theissues/csam
- Project Arachnid Shield API (classification service, access-gated): https://projectarachnid.ca/en/ and https://shield.projectarachnid.ca
- C2PA 2.1 spec (provenance manifests, soft-binding perceptual hash assertions): https://spec.c2pa.org/specifications/specifications/2.1/specs/C2PA_Specification.html
- Microsoft PhotoDNA (proprietary; adapter/mock only): https://www.microsoft.com/en-us/photodna
- Thorn Safer (commercial detector, adapter target): https://safer.io

## Funding model

Primarily a foundation/grant-funded public good under digitalharm.org — the natural funders are the Tech Coalition (Lantern program members), the WeProtect Global Alliance, or a Google.org / Patrick J. McGovern Foundation safety-tech grant, since every member platform benefits from cheaper, safer detection testing. Secondary sustaining revenue: paid hosted conformance certification (a platform CTO or a Trust and Safety compliance officer preparing for EU CSA Regulation / UK Online Safety Act audits pays for a signed report attesting their pipeline passed the DetectKit conformance suite against a given hasher version) and enterprise support contracts for teams embedding the harness in regulated CI. The concrete first buyer is a mid-size platform's Head of Trust and Safety who needs audit evidence that detection works but has no compliant way to produce it.

## Risks

The sharpest risk is reverse-engineering: a false-positive/collision harness that lets users probe what perturbation drops a PDQ match below distance 31 is also an evasion-research tool, so collision fixtures must target generic threshold boundaries (synthetic images only) and never approximate real known-CSAM hashes, which we cannot access anyway. Scope creep toward testing against real NCMEC hashes must be hard-refused — the project's entire safety claim is that it never touches real material or real hash lists. Lesser risks: PhotoDNA's algorithm is proprietary and license-restricted, so we can only ship an adapter interface and a mock, not a generator, capping coverage; perceptual-hash thresholds are explicitly non-rigorous and drift across hasher releases, so expected fixtures must be pinned to algorithm versions or the harness produces false failures.

---

See [the full design spec in docs/tools/detectkit-test.md](../../docs/tools/detectkit-test.md) for the
extended workflow-synthesis context. The portfolio overview lives in the
[root README](../../README.md).
