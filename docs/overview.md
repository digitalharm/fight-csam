# Overview

## What this is

The pattern is a layered defense-in-depth stack expressed as buildable software: a hashing primitive (HashKit) feeds matchers and screeners (HashStream, TrainGuard, CSAM-Shield), which feed the legal machinery (CyberTip CLI, EvidenceVault), with three satellites (PromptShield, C2PA-Lite, SafeMod) addressing the prevention and human-cost edges. Every spec correctly refuses to ship a hash list or handle real CSAM, and all ten landed on ship-with-caveats — the discipline is consistent and credible. The single most compelling reason to ship the portfolio is that it is the missing buildable counterpart to the landscape your Chapter 06 already maps: the site documents PhotoDNA/PDQ/NCMEC/Arachnid as the working defense, and these tools let a 20-person platform actually wire that defense up under §2258A without a multi-week per-provider integration. The riskiest assumption — shared by six of the ten — is that a solo maintainer can obtain and sustain the gated NCMEC/IWF/Arachnid credentialing relationships that supply each tool's load-bearing differentiator (NCMEC-cross-checked vectors, list mirroring, the ESP reporting endpoint); without those, HashKit, HashStream, CyberTip CLI, EvidenceVault, and TrainGuard degrade from "verified" to "yet another unverified port," which is the exact drift they exist to kill.

## The ten tools

See per-package READMEs in [`packages/`](../packages) and the per-tool design docs in [`docs/tools/`](tools).

Status reflects current readiness:

- **Wave 1** (credential-free foundation): `hashkit`, `detectkit-test`, `hashkit-match`
- **Wave 2** (drop-in adoption): `csam-shield`, `promptshield`
- **Wave 3** (credentialed infrastructure): `hashstream`, `trainguard`
- **Wave 4** (legal endgame): `cybertip-cli`, `evidencevault`
- **Wave 5** (deferred): `c2pa-lite`, `safemod`

See [sequencing.md](sequencing.md) for the rationale.

## What this is not

- Not a CSAM hash list. National hash data lives at NCMEC, IWF, and Project Arachnid and stays there.
- Not a replacement for PhotoDNA or Thorn Safer or Cloudflare's CSAM Scanning Tool. These tools sit one layer below — making the existing detection ecosystem easier to consume.
- Not a guarantee of compliance with 18 U.S.C. § 2258A or DSA Article 16 or any other legal regime. They are detection-assist primitives. Legal compliance still requires counsel.
- Not a moderation queue. SafeMod (deferred) addresses moderator wellbeing operationally, but the queue itself remains the platform's responsibility.
