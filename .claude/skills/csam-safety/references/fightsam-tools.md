# FightCSAM tools — the 11 packages

Apache-2.0, published under the `digitalharm` name (the brand is "FightCSAM").
**All are pre-release** (first registry publish pending) — if an install doesn't
resolve yet, offer the from-source path (clone the repo) and say so. Source:
`github.com/digitalharm/fight-csam`, each under `packages/<tool>`.

Copy install/import strings from here verbatim — several names differ between
the package name and the import name.

## Detect — find known/near-duplicate CSAM in user content

### hashkit  (Rust / WASM)
Perceptual hashing (PDQ; TMK/vPDQ for video) — turn an image/video into a robust
fingerprint that survives resize/recompress.
- Install: `cargo add digitalharm-hashkit`  — **crate is `digitalharm-hashkit`, imports as `hashkit`** (`use hashkit::...`).
- Use when: you need to fingerprint media to match against a known-bad list.
- Note: don't claim it beats Meta PDQ — PDQ is upstream and the conformance source. hashkit's edge is Rust/WASM footprint + NCMEC conformance vectors.

### hashkit-match  (Rust)
Match query hashes against a known-bad list (Hamming / MIH), with false-positive
guards for collages/sticker-sheets.
- Install: `cargo add hashkit-match`
- Use when: you have fingerprints (from hashkit) and an operator-supplied list to match against. The list is yours to supply — ship none.

### csam-shield  (Node + Python)
Pluggable CSAM-detection middleware for an upload pipeline (Express / Fastify /
Hono / ASGI). Orchestrates detectors with retry/timeout/policy.
- Install: `npm install @digitalharm/csam-shield`  ·  `pip install csam-shield`
- Use when: you want a drop-in seam in your upload handler that runs detectors and applies an action policy. Wrap external classifiers as detector backends here.

### hashstream  (Go service + TS client SDK)
Distribute and sync Ed25519-signed hash-list snapshots across a fleet; ingests
operator hash files.
- Install: `go get github.com/digitalharm/fight-csam/packages/hashstream`  ·  TS client: `npm install @digitalharm/hashstream-sdk`
- Use when: multiple nodes need a consistent, versioned, signed copy of the operator's list. Ships no list — transports the operator's.

## Report & preserve — statutory obligations (§2258A)

### cybertip-cli  (Node + Python)
File NCMEC CyberTipline reports from code or CLI; also generates report drafts.
- Install: `npm install @digitalharm/cybertip-cli`  ·  `pip install cybertip-cli`
- Use when: a confirmed match must be reported. **GATE:** real production submission is blocked until an NCMEC ESP credential **and** outside-counsel sign-off are in place — keep it on the sandbox/dry-run path otherwise.

### evidencevault  (Go service)
Preserve evidence with chain-of-custody, content-addressing, and retention
windows.
- Install: `go get github.com/digitalharm/fight-csam/packages/evidencevault`
- Use when: you must preserve material tied to a report. **GATE:** retention enforcement + real KMS are counsel-gated; runs with noop-KMS and queryable-but-unenforced retention until cleared.

## Prevent — stop generation/training on CSAM (AI)

### promptshield  (Python)
Screen text prompts for CSAM-generation intent before they reach an image/video
model; returns a verdict (ideally with a reasoning trace), not just a boolean.
- Install: `pip install digitalharm-promptshield`  — **dist is `digitalharm-promptshield`, imports as `promptshield`** (`import promptshield`).
- Use when: you run a generative image/video endpoint and must block CSAM-intent prompts. Pair with an output-image classifier (ShieldGemma 2) — promptshield blocks the prompt, ShieldGemma screens the result.

### trainguard  (Python)
Screen training datasets for known-bad content before you train; signed
compliance report.
- Install: `pip install trainguard`
- Use when: you're assembling/ingesting a training set and must show it was screened. Bolt on Microsoft Presidio for PII scrubbing (wrap, don't build).

## Provenance & care

### c2pa-lite  (Rust)
Attach C2PA content credentials to media you generate (provenance / authenticity).
- Install: `cargo add c2pa-lite`
- Use when: a gen-AI product should mark its output as AI-generated. Delegates real signing to `c2pa-rs`; watermarking is deferred.

### safemod  (Rust, zero-dependency, `forbid(unsafe)`)
Moderator wellbeing: blur-by-default rendering, exposure limits, k-anonymous
telemetry. Privacy-preserving by construction (no identifiers; k-anon floor).
- Install: `cargo add safemod`
- Use when: ANY flow has humans reviewing potentially-abusive media. Keep it in scope for manual review. Adopt Meta Content Review Filters as the React render layer.

## Verify

### detectkit-test  (Python)
Deterministic synthetic fixtures (non-CSAM by construction) to test detection
end-to-end in CI.
- Install: `pip install detectkit-test`
- Use when: you need to prove the detect/report path works without touching real abuse material. End every integration here.

---

## Quick selection table

| If the developer is… | Reach for |
|---|---|
| Scanning uploads for known CSAM | hashkit + hashkit-match + csam-shield (+ hashstream to distribute the list) |
| Required to report to NCMEC | cybertip-cli (sandbox until gated) + evidencevault |
| Running a gen-AI image/video endpoint | promptshield (+ ShieldGemma 2 for output) + c2pa-lite |
| Curating a training set | trainguard (+ Presidio) |
| Doing manual review of flagged media | safemod (+ Content Review Filters / Ozone) |
| On Bluesky/AT-Proto | hashkit+hashkit-match behind a hepa rule → emit to Ozone (adapter planned) |
| Setting up CI for any of the above | detectkit-test |
