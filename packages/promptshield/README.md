# PromptShield

> A drop-in CSAM-intent prompt classifier that blocks abusive text-to-image and text-to-video requests before a single GPU cycle is spent.

**Status:** see [`STATUS`](STATUS) — for the canonical state across all tools, see [`docs/roadmap.md`](../../docs/roadmap.md). **License:** Apache 2.0. **Recommendation:** `ship-with-caveats`.

## Problem

Self-hosted image/video generation stacks (ComfyUI, Automatic1111/Forge, diffusers, FLUX, vLLM multimodal) ship with no input-side defense against prompts whose intent is to generate AI child sexual abuse material (AIG-CSAM). Operators who want to do the right thing must either pay for a closed hosted moderation API or write brittle regex blocklists by hand, while output-only classifiers waste compute generating the very content they are meant to suppress and create a legal-custody problem (the abusive image briefly exists on disk/VRAM). The field needs a cheap, embeddable, pre-generation gate.

## Gap in ecosystem

Every mature open tool in this space — Meta ThreatExchange (PDQ/TMK/vPDQ), Project Arachnid Shield, PhotoDNA, Cloudflare's CSAM Scanning Tool — does perceptual hashing of images/video to match KNOWN material, running on outputs or uploads, not on text prompts expressing novel intent. The only real input-stage prompt classifiers are proprietary (CivitAI blocked 252k+ violative prompts in 2024 but its system "lacks portability" and does not generalize to FLUX/AuraFlow — they issued a public call for help in Jan 2025), or research code (PromptGuard, NSFW-classifier-guided sanitization) that is not packaged as deployable middleware. The closest OSS prior art, AI Horde's anti-CSAM filter, is primarily a POST-generation CLIP image scanner bolted to one worker, with acknowledged anime false positives. No Apache-licensed, framework-agnostic, drop-in prompt classifier exists.

## Architecture

Python library + sidecar HTTP service. Core is a two-stage cascade: (1) a fast deterministic layer — Unicode/leetspeak/homoglyph normalization, token de-obfuscation, and a curated lexicon of age-indicator and combinatorial age×sexual patterns compiled to Aho-Corasick/RE2 (sub-millisecond, CPU-only); (2) a small fine-tuned transformer encoder (DeBERTa-v3-small or a distilled ~100M-param classifier, ONNX/quantized, ~5-15ms on CPU, faster on GPU) that scores CSAM-intent with calibrated probabilities. The key signal, learned from AI Horde's design, is the CONJUNCTION of a minor-indicator concept and a sexual concept — neither alone trips the gate. Output is a structured verdict {allow|block|review, score, matched_signals, policy_version}. Ships as: a `promptshield` pip package with a one-line `guard(prompt) -> Verdict`; native adapters/custom nodes for ComfyUI and Automatic1111/Forge; an OpenAI-compatible proxy shim for vLLM/diffusers servers; and a stateless FastAPI sidecar (Docker) for non-Python stacks. Models and lexicon are versioned artifacts pulled from Hugging Face Hub so policy can update without code changes. No prompt content is logged by default; optional hash-only audit trail for NCMEC-reporting integrations.

## Existing tooling

We integrate with, rather than replace, the hashing ecosystem: PromptShield is the input-side complement to output-side PhotoDNA/Project Arachnid Shield/ThreatExchange PDQ, and docs position it as one layer of a defense-in-depth stack alongside an output image classifier. Closest functional overlap is CivitAI's proprietary internal classifier (not redistributable) and AI Horde's filter (post-generation, worker-coupled, not a library) — PromptShield is the portable, pre-generation, framework-agnostic version of what they prove works. We reuse open components where possible: a DeBERTa/distilled encoder backbone, optionally CLIP text-embedding features, and the conjunction-detection heuristic pioneered by AI Horde. Thorn's Safety by Design principles define the obligation ("filter inputs"); PromptShield is a concrete open implementation of that principle for the prompt layer that no one currently ships.

## v0.1 scope

- `pip install promptshield` exposing `guard(prompt, negative_prompt=None) -> Verdict` with allow/block/review, calibrated score, and matched-signal list — CPU-only, no GPU required
- Stage-1 deterministic engine: homoglyph/leetspeak/whitespace normalization + curated conjunction lexicon (minor-indicator × sexual-context), plus negative-prompt evasion handling (e.g. 'adult','mature' stuffed in negatives)
- Stage-2 fine-tuned ONNX classifier trained on a synthetic/red-team prompt corpus (no real CSAM ever in training data — labels derived from public model-platform moderation logs and adversarial paraphrases), shipped as a versioned Hugging Face artifact
- ComfyUI custom node + Automatic1111/Forge extension that block on verdict and surface a non-graphic refusal, plus a FastAPI sidecar Docker image for everything else
- An adversarial jailbreak test suite (homoglyphs, token-splitting, euphemism rotation, multilingual, prompt-injection) run in CI, with a published precision/recall + false-positive-rate report on a benign-prompt holdout
- Operator config for threshold tuning, allow/block/review routing, and an optional hash-only (SHA-256 of normalized prompt) audit log — content-free by default for legal safety

## APIs and specs

- NCMEC CyberTipline / reporting context (18 U.S.C. § 2258A): https://report.cybertip.org/ and https://www.missingkids.org/theissues/csam
- Meta ThreatExchange PDQ/TMK/vPDQ (image/video hashing, BSD) — input-side complement, not overlap: https://github.com/facebook/ThreatExchange
- Project Arachnid Shield API (known-CSAM image/video hash matching, free to ESPs): https://projectarachnid.ca/en/
- Microsoft PhotoDNA (output-side perceptual hash): https://www.microsoft.com/en-us/photodna
- Thorn Safety by Design for Generative AI (the principle PromptShield implements): https://www.thorn.org/blog/generative-ai-principles/
- CivitAI public call to build portable prompt moderation (validates the gap): https://civitai.com/articles/11072
- AI Horde anti-CSAM filter (closest OSS prior art, post-generation): https://dbzer0.com/blog/ai-powered-anti-csam-filter-for-stable-diffusion/
- C2PA content provenance spec (complementary, for labeling allowed outputs): https://c2pa.org/specifications/
- Hugging Face Hub (model + lexicon artifact distribution): https://huggingface.co/docs/hub

## Funding model

Core library and models stay free and Apache-2.0 to maximize adoption and because charging to block CSAM is reputationally untenable. Funding paths, by named buyer: (1) Child-safety foundation and government grants — Thorn, Tech Coalition's Lantern program, IWF, and the EU/UK online-safety regulators fund open trust-and-safety infrastructure; this is the primary intended funder. (2) Managed-policy subscription sold to the Trust & Safety / compliance officer at GenAI platforms (the CivitAI/Leonardo/Tensor.art tier and mid-size SaaS image tools): curated lexicon + model updates, tuned thresholds, multilingual packs, and an SLA on new-jailbreak turnaround — the buyer is someone with NCMEC-reporting and EU AI Act exposure who cannot maintain a red-team in-house. (3) Enterprise support + indemnity-adjacent integration contracts for cloud GPU providers (RunPod, Replicate, Modal) who want to offer 'safe-by-default' inference to their customers and will pay for deployment help and a private audit-log connector that wires verdicts into a CyberTipline reporting workflow.

## Risks

False positives are the dominant risk: legitimate prompts (pediatric medical imagery, family/parenting art, anime styles that read young, the words 'small/petite/youthful' in adult contexts) can trip the gate, and an over-blocking tool gets ripped out — hence calibrated thresholds, a 'review' tier, and a published FPR are MVP requirements, not extras. Abuse vectors: the classifier and its evasion test suite are a roadmap for attackers, and an over-confident 'PromptShield-certified' badge could give operators false assurance and erode the defense-in-depth message; we must state plainly that this is one layer and never a substitute for an output classifier plus hash matching. Jurisdictional and definitional drift (what counts as a minor-indicator varies by country and by art convention) means the lexicon needs governed, auditable updates and cannot be a single global default. Scope creep toward general NSFW moderation, age-verification, or output scanning would dilute the tool and pull it into adult-content policing that is out of mission; v0.1 must stay narrowly the CSAM-intent prompt gate. Finally, training-data handling is a hard constraint: the model must be trainable with zero real CSAM, relying on synthetic adversarial text and platform moderation labels, or the project itself becomes a liability.

---

See [the full design spec in docs/tools/promptshield.md](../../docs/tools/promptshield.md) for the
extended workflow-synthesis context. The portfolio overview lives in the
[root README](../../README.md).
