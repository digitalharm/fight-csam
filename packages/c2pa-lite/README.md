# C2PA-Lite

> Turnkey Apache-licensed content provenance for the long tail of image/video generators that ship nothing today — watermark, sign, recover, verify, in one library.

**Status:** see [`STATUS`](STATUS) — for the canonical state across all tools, see [`docs/roadmap.md`](../../docs/roadmap.md). **License:** Apache 2.0. **Recommendation:** `ship-with-caveats`.

## Problem

AI-generated CSAM exploded from ~4,700 NCMEC reports in 2023 to ~67,000 in 2024 (a 1,325% jump) and to 440,419 reports in the first half of 2025 alone, overwhelmingly produced with self-hostable open-source diffusion models that emit no provenance signal whatsoever. Platforms and NCMEC cannot reliably distinguish synthetic from real abuse imagery — ESPs annotated only ~11,000 of ~158,000 NCMEC-categorized AI items as AI-generated — which inflates triage load, delays victim identification of real children, and weakens prosecutions. C2PA-Lite gives small, open, and self-hosted generators a drop-in way to stamp every output with a recoverable, cryptographically signed "this is synthetic, from this model, at this time" credential.

## Gap in ecosystem

The pieces exist but nobody ships the glue: c2pa-rs (Apache/MIT) signs and embeds C2PA manifests but leaves the soft-binding/watermark slot empty, while robust watermarkers (Meta Seal, TrustMark, Stable Signature) are research-grade, often model-coupled, and not wired to C2PA at all. The entire deployed CSAM stack (ThreatExchange PDQ/vPDQ, Project Arachnid Shield, NCMEC/IWF hash lists) is reactive matching against known-bad banks, not preventive provenance on freshly generated content. No Apache-licensed package wires watermark-as-soft-binding plus signed-manifest-as-hard-binding plus a cloud manifest store for post-strip recovery into a single library aimed at the generator operator who has zero provenance today and cannot afford Digimarc/Steg.AI licensing.

## Architecture

Rust core crate (c2pa-lite) wrapping contentauth/c2pa-rs for manifest build/sign/embed/verify, with a pluggable SoftBinder trait that adapts an OSS watermarker (default: TrustMark ONNX via ort/onnxruntime; optional Meta Seal) into the C2PA c2pa.soft-binding assertion (alg_soft field), so watermark choice is swappable without touching the signing path. Thin Python and Node bindings (PyO3 / napi-rs) expose a 3-call surface — credential(image_or_video, model_id, key) → mark+sign+embed, verify(asset) → manifest+validation+watermark-decode, recover(asset) → fetch stripped manifest from the manifest store via decoded watermark payload. A small stateless HTTP "manifest store + recovery" service (Rust/axum, S3/Postgres backend) stores detached manifests keyed by the watermark's short ID, implementing C2PA durable content credentials so credentials survive screenshotting and re-encoding. Signing supports local PKCS#8 keys for dev and KMS/PKCS#11 + a documented test-anchor trust list for prod; video is handled via per-segment soft binding plus BMFF/fragmented-MP4 hard binding. Ships as a CLI, a library, a reference Docker image, and a ComfyUI/diffusers post-processing node so a self-hoster wires it in with one block.

## Existing tooling

Integrate-and-extend, not replace. We sit ON TOP of c2pa-rs (Apache/MIT) for all manifest/signing/embedding and validation — we do not reimplement C2PA. We wrap an existing OSS watermarker (TrustMark, Apache-2.0, or Meta Seal) rather than inventing one, exposing it through C2PA's standard soft-binding extension point. We are COMPLEMENTARY to the detection stack: C2PA-Lite marks new synthetic content at creation, then platforms still run ThreatExchange PDQ/vPDQ (BSD) and submit to Project Arachnid Shield (free, PhotoDNA + perceptual hash) or NCMEC/IWF hash matching for known-bad detection — provenance reduces the false-positive AI flood feeding those systems. Commercial provenance/watermark vendors (Digimarc, Steg.AI, Truepic, Hive AI synthetic-content detection) exist but are closed and priced for large platforms; C2PA-Lite targets the operators they ignore. Adobe/CAI's own SDKs and the Verify tool are the upstream we stay wire-compatible with.

## v0.1 scope

- Rust core + CLI: credential / verify on JPEG and PNG — TrustMark ONNX soft binding embedded as c2pa.soft-binding, c2pa-rs hard binding + signed embedded manifest, local PKCS#8 signing.
- Python (PyO3) and Node (napi-rs) bindings exposing the same 3-call API, plus a ComfyUI/diffusers post-process node so a self-hosted generator wires it in with one block.
- Durable recovery: detached-manifest store service (axum + S3/Postgres) keyed by watermark ID, so a stripped/re-encoded image still resolves its credential via recover().
- MP4/H.264 video support via per-segment soft binding + fragmented-MP4 hard binding (behind a v0.1 'experimental' flag).
- Verification output that is wire-compatible with Adobe/CAI Verify, emitting a normalized JSON verdict (signed? trusted issuer? watermark decoded? recovered-from-store?).
- Standard credential profile + assertion vocabulary for synthetic media (model id, generator name, generation timestamp, 'AI-generated' label) with a documented dev test-anchor trust list and KMS/PKCS#11 signing path for prod.
- Robustness + threat-model test harness: JPEG recompression, resize, crop, screenshot, and a documented watermark-removal adversarial suite with published decode-survival rates — honesty about limits is a shipped artifact.

## APIs and specs

- C2PA Technical Specification v2.1, soft-binding (c2pa.soft-binding, alg_soft) and durable content credentials: https://spec.c2pa.org/specifications/specifications/2.1/specs/C2PA_Specification.html
- contentauth/c2pa-rs (Apache-2.0/MIT, manifest build/sign/embed/verify; the soft-binding slot we fill): https://github.com/contentauth/c2pa-rs
- Content Authenticity Initiative OSS docs + Verify tool for wire-compatibility: https://opensource.contentauthenticity.org/docs/introduction/
- Adobe TrustMark robust watermarking (default soft-binding backend, Apache-2.0): https://github.com/adobe/trustmark
- Meta Seal / Stable Signature open-source watermarking (optional backend): https://github.com/facebookresearch/meta-seal
- Meta ThreatExchange PDQ / vPDQ perceptual hashing + Hasher-Matcher-Actioner (BSD), complementary known-bad matching: https://github.com/facebook/ThreatExchange
- Project Arachnid Shield API (free CSAM hash matching, downstream consumer of marked content): https://projectarachnid.ca
- NCMEC CyberTipline / Hash-Sharing for ESP reporting context: https://report.cybertip.org and https://www.missingkids.org/gethelpnow/cybertipline
- EU AI Act Art. 50 transparency / machine-readable AI-content marking obligation (regulatory tailwind): https://artificialintelligenceact.eu/article/50/

## Funding model

Grant-funded core plus optional hosted recovery service. Buyer 1 (grants): child-safety and trust-and-safety funders — Tech Coalition / Lantern members, Avia/Safe Online (formerly the Global Fund to End Violence Against Children), Patrick J. McGovern Foundation, Omidyar — fund a 2-year maintainer + adversarial-robustness retainer; the pitch is 'preventive provenance that shrinks the AI-CSAM false-positive flood NCMEC and ESPs are drowning in.' Buyer 2 (hosted SaaS): the operator/CTO of a mid-size or open generative platform (Stable Diffusion forks, indie image/video apps, regional providers) who must satisfy EU AI Act Art. 50 machine-readable AI-marking and US ENFORCE-Act-era expectations but cannot license Digimarc/Steg.AI — they self-host the Apache library free and pay for the managed durable-recovery manifest store (uptime, retention, KMS key custody) at a per-asset/seat tier. Buyer 3 (enterprise support): a platform compliance/legal officer buys a support + indemnification-shaped SLA and a signed integration audit. The library is and stays free; revenue is hosting + support, never the marking itself.

## Risks

False sense of security is the headline risk: invisible watermarks are removable — Stable Signature has published removal attacks and any soft binding can be cropped, heavily re-encoded, or model-stripped, so we must ship the adversarial decode-survival numbers up front and never claim tamper-proof; the credential proves presence, not absence (no mark ≠ 'real'). Abuse vectors: a signed 'AI-generated' label could be misread as 'safe', and a bad actor could forge benign provenance onto harmful content or strip ours — mitigated by trust-list anchoring and by positioning this as a triage signal feeding hash-matching, not a verdict. Scope creep into building a CSAM classifier is the trap to refuse: C2PA-Lite marks provenance and explicitly does NOT detect or hash CSAM (that stays with Arachnid/NCMEC/PDQ), avoiding both the legal exposure of handling known-bad material and the false-positive blast radius of content classification. Jurisdictional: signing-key trust, manifest-store data residency, and EU AI Act vs. US divergence mean we ship config not opinions. Net: genuinely useful as one preventive layer, dangerous if oversold as a solution.

---

See [the full design spec in docs/tools/c2pa-lite.md](../../docs/tools/c2pa-lite.md) for the
extended workflow-synthesis context. The portfolio overview lives in the
[root README](../../README.md).
