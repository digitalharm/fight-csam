# Sequencing

The portfolio ships in five waves. Earlier waves unblock later ones.

## Wave 1: Foundation (the credential-free primitive)

**Tools:** HashKit, DetectKit-Test

HashKit is the keystone every other matching tool reuses, and crucially its in-box PDQ path needs zero gated credentials, so a solo maintainer can ship something real and verifiable on day one. DetectKit-Test ships alongside because its synthetic fixtures are the legally-clean test corpus HashKit's own CI and every downstream tool need — building them together means the conformance suite and the fixtures co-evolve instead of being retrofitted.

## Wave 2: Drop-in adoption (lowest-friction consumers)

**Tools:** CSAM-Shield, PromptShield

Both deliver a working result with the easiest-to-get access (Arachnid Shield's free self-serve key for CSAM-Shield; zero list access for PromptShield's prompt gate), giving small platforms a one-line install that drives early adoption and stars before the heavy credentialed infrastructure exists. They sit directly on Wave 1 (CSAM-Shield wraps HashKit's matcher; both reuse DetectKit fixtures).

## Wave 3: Credentialed infrastructure (gated, heavier)

**Tools:** HashStream, TrainGuard

These need the NCMEC/IWF relationships and are the natural home for the grant-funded credential-brokering work, so they follow only once the foundation proves the maintainer is a serious, list-handling-disciplined steward worth credentialing. TrainGuard reuses HashKit's PDQ core and TrainGuard/HashStream share the operator-credentialed-adapter pattern.

## Wave 4: Legal endgame (highest-stakes downstream)

**Tools:** CyberTip CLI, EvidenceVault

Filing statutory reports and holding sealed evidence carry the most federal blast radius and depend on NCMEC ESP credentials plus counsel review, so they ship last when the upstream detection/audit layers are stable and the project has the standing and legal backing to be trusted with the report-and-preserve duty.

## Wave 5: Deferred satellites

**Tools:** C2PA-Lite, SafeMod

Both are genuinely valuable but orthogonal to the hash-to-report spine and carry disproportionate solo cost (C2PA-Lite chains a moving watermark-research target to a manifest store; SafeMod owns GDPR special-category health data). Defer until the core portfolio has co-maintainers or dedicated grant funding rather than diluting Waves 1-4.

## Why this order matters

Wave 1 has no gated dependencies. A solo maintainer can ship something real on day one with no NCMEC, IWF, or Project Arachnid credentialing required.

Waves 2–4 progressively raise the stakes: Wave 2 has low-friction free APIs (Project Arachnid Shield's self-serve key), Wave 3 requires gated list access, and Wave 4 carries direct legal blast radius (statutory CyberTipline filing and evidence custody).

Wave 5 is deferred for honest reasons. C2PA-Lite chains a moving research target (watermark removal attacks) to a hosted manifest store; SafeMod's mental-health records are GDPR special-category data and the wrong load for a solo maintainer. Both are valuable and both belong elsewhere.
