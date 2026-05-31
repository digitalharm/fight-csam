# HashKit

> One WebAssembly core for PDQ and TMK+PDQF, with NCMEC-verified test vectors so every language produces the same hash.

**Status:** see [`STATUS`](STATUS) — for the canonical state across all tools, see [`docs/roadmap.md`](../../docs/roadmap.md). **License:** Apache 2.0. **Recommendation:** `ship-with-caveats`.

## Problem

Trust-and-safety teams need to compute Meta's PDQ (image) and TMK+PDQF (video) perceptual hashes to match content against known-CSAM hash lists, but the canonical implementation is C++ and the scattered language ports drift, so a hash computed in a Node uploader does not always match one computed in a Python pipeline or a Go service. Mismatched hashes mean missed matches against NCMEC/IWF lists and silent false negatives in the exact system where a miss means abuse material stays up. HashKit ships one audited algorithm core compiled to WebAssembly plus a frozen, NCMEC-cross-checked conformance test suite so the bits are identical everywhere.

## Gap in ecosystem

As of Nov 2025 facebook/ThreatExchange added an official WASM build, but it is a Selenium-tested demo web app (index.html + server.js), not a packaged library: there is no published npm or PyPI artifact, no Deno/Bun targets, no multi-index-hashing (MIH) matcher, and critically no shared conformance test vectors validated against NCMEC reference hashes. The unowned wedge is the distribution-and-conformance layer: a versioned, signed cross-runtime package plus a frozen vector suite that lets any team prove byte-identical hashes. That has not been built because it is unglamorous plumbing, requires NCMEC/IWF relationships most OSS authors lack, and sits under legal caution that scares off casual contributors.

## Architecture

Single Rust core crate (hashkit-core) implementing PDQ (256-bit hash + 0-100 quality), PDQ-Dihedral, and TMK+PDQF video feature vectors, transpiled from / differentially tested against the BSD C++ reference; image/video decode is injected by the host (the core takes raw RGB/luma planes and frame sequences, never codecs), keeping the WASM module deterministic and small. It compiles to (a) wasm32 with a thin wasm-bindgen/Emscripten ABI exposing hash/compare/quality, packaged as an npm module (browser ESM + WASM, Node, Deno, Bun via WASI) and a Pyodide/maturin wheel, and (b) native cdylib for Go (cgo) and Rust crates.io. A separate hashkit-match module provides a pure-data multi-index Hamming matcher (MIH) over caller-supplied hash sets — it never bundles any CSAM hash list. The keystone deliverable is /vectors: a frozen JSON corpus of (input descriptor -> expected hash) pairs, a subset cross-validated against NCMEC reference outputs, run in CI against every language binding so a release fails if any runtime drifts by one bit.

## Existing tooling

facebook/ThreatExchange (BSD-3) is upstream truth: C++/Python/Java/PHP plus a new WASM demo and python-threatexchange — HashKit integrates with and tracks it rather than forking the algorithm. Microsoft PhotoDNA is the dominant industry hash but is closed, licensed, and export-controlled, so OSS cannot reimplement it; HashKit deliberately targets only the open PDQ/TMK family. Cloudflare's CSAM Scanning Tool, Thorn Safer, and Hive AI are hosted commercial detectors (managed match against gated lists) — HashKit is the open hashing primitive beneath that tier, not a competitor to their list access. NCMEC Hash Sharing, IWF Hash List, and Project Arachnid Shield distribute the known-CSAM hashes themselves to vetted providers; HashKit is explicitly the compute layer that produces hashes to send to those APIs, and ships zero hash lists. Scattered npm/Rust/Go PDQ ports exist but are individually unmaintained and mutually unverified — exactly the drift HashKit's vector suite is designed to kill.

## v0.1 scope

- hashkit-core (Rust): PDQ 256-bit hash + quality score + PDQ-Dihedral, differentially tested bit-for-bit against the facebook/ThreatExchange C++ reference on a shared corpus
- WASM build with published, signed npm package working byte-identically in browser (ESM), Node, Deno, and Bun; plus a PyPI wheel (maturin)
- /vectors: a frozen, versioned JSON conformance suite (benign images -> expected PDQ hashes), with a documented subset cross-validated against NCMEC reference outputs, wired into CI to fail the build on any one-bit drift
- hashkit-match: pure in-memory multi-index Hamming (MIH) matcher over caller-supplied hash sets with a configurable threshold (default 31/256), shipping NO hash lists
- Host-side decode adapters and a 20-line quickstart per runtime showing image-bytes -> RGB -> hash -> compare, with explicit 'detection-assist, not a guarantee; not a CSAM hash source' docs

## APIs and specs

- PDQ & TMK+PDQF reference (BSD-3): https://github.com/facebook/ThreatExchange/tree/main/pdq and /tmk
- PDQ/TMK algorithm paper (hashing.pdf): https://github.com/facebook/ThreatExchange/blob/main/hashing/hashing.pdf
- NCMEC CyberTipline / ESP technical onboarding (gated; espteam@ncmec.org): https://report.cybertip.org and https://www.missingkids.org
- IWF Hash List service: https://www.iwf.org.uk/our-technology/our-services/hash-list/
- Project Arachnid Shield (gated to vetted operators): https://projectarachnid.ca/en/shield/
- C2PA content provenance (complementary, AI-origin labeling): https://c2pa.org/specifications/
- WebAssembly System Interface (WASI) for Node/Deno/Bun parity: https://wasi.dev
- wasm-bindgen ABI reference: https://rustwasm.github.io/wasm-bindgen/

## Funding model

Primary funding is restricted/grant capital, not seats: child-safety foundations and public funders (Tech Coalition Safe Online / Lantern, Patrick J. McGovern Foundation, EU Internet Forum / DSA compliance budgets) fund the maintainer plus the NCMEC vector-validation relationship, because one verified shared primitive is cheaper for the whole ecosystem than each platform re-auditing its own port. The buyer for paid support is a platform Trust-and-Safety or compliance lead at a mid-size UGC company (Discord/Roblox-scale down to a 20-person social app) who must show an auditor that their CSAM hashing matches the reference: HashKit sells a commercial support + conformance-attestation tier (signed 'verified against vector set vX, NCMEC-cross-checked' SBOM/report) and prioritized binding maintenance. Secondary: paid integration support to detection vendors (Cloudflare/Thorn-tier) who want a maintained WASM core they do not staff in-house. Deliberately NOT monetized: any access to actual CSAM hash lists — that stays with NCMEC/IWF.

## Risks

False negatives are the real danger: if a HashKit release silently drifts from the reference, every downstream platform misses real CSAM matches while believing it is covered — which is why the frozen NCMEC-cross-checked vector suite and fail-closed CI are the core product, not a nice-to-have, and why version pinning plus signed attestations matter more than features. Abuse vector: PDQ thresholds are public enough that shipping tooling helps adversaries test evasion (small crops/rotations to dodge a Hamming threshold); mitigation is shipping only the already-published open algorithm, never hash lists, and framing HashKit as detection-assist. Jurisdictional/legal: contributors must never handle CSAM to build test data, so vectors use benign images with opaque expected-hash values supplied through NCMEC channels, and the project needs counsel on EU CSAR/DSA and US reporting duties. Scope creep is the likeliest slow death — resist becoming a hosted scanner, an NSFW ML classifier, or a hash-list distributor; HashKit must stay the boring, verifiable hashing primitive.

---

See [the full design spec in docs/tools/hashkit.md](../../docs/tools/hashkit.md) for the
extended workflow-synthesis context. The portfolio overview lives in the
[root README](../../README.md).
