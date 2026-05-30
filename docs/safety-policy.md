# Safety policy

The portfolio's primary safety promise is what we will **not** do. The whole project depends on it.

## What we do not do

1. **We do not ship a CSAM hash list.** Real NCMEC, IWF, and Project Arachnid hash data is gated to credentialed providers under specific legal frameworks. It stays with them. None of our packages contain it; none of our packages distribute it. Tools that match against hash lists (`csam-shield`, `hashstream`, `trainguard`) consume lists from those providers' APIs at runtime in the user's deployment, not via this repo.

2. **We do not handle real CSAM imagery.** Ever. Tests in CI never include CSAM. Synthetic test fixtures live in [`packages/detectkit-test`](../packages/detectkit-test) and `fixtures/synthetic/`, are documented as non-harmful, and have engineered hash properties so they verify pipelines without resembling real abuse material.

3. **We do not ship classifier weights trained on CSAM.** `promptshield`'s classifier is trained on prompt text, not imagery. Any output-side classifier (Hive AI, Safer, etc.) is integrated via API; we do not embed models trained on illegal content.

4. **We do not provide compliance attestation by default.** Adopting our libraries does not by itself satisfy 18 U.S.C. § 2258A, DSA Article 16, the UK Online Safety Act, or any other regulatory regime. Counsel remains required. We document this in every README to prevent the false-confidence failure mode.

## What we do

- Implement the **algorithms** (PDQ, TMK+PDQF) that match against gated hash lists
- Provide **clients** for the public APIs (NCMEC Hash Sharing, CyberTipline, Cloudflare CSAM Scanning, Project Arachnid Shield) so adopters don't rebuild the integration ten times
- Provide **operational scaffolding** (evidence retention, moderator wellbeing) that the existing infrastructure leaves for each platform to figure out
- Verify **conformance** of our hashing implementations against the canonical reference outputs

## How we enforce these rules

### The CI safety guard

[`scripts/safety-check.sh`](../scripts/safety-check.sh) runs on every PR and push to main. It blocks:

- Filenames that look like CSAM hash list distributions (e.g., anything matching `ncmec_hash_*`, `iwf_list_*`, `arachnid_hashes_*`)
- Image and video binary files in non-allowlisted directories (allowlist: `docs/images/`, `packages/detectkit-test/fixtures/`, `fixtures/synthetic/`)
- Strings that look like NCMEC ESP tokens, IWF API keys, PhotoDNA keys, Project Arachnid Shield keys, or AWS secrets
- Large binary files outside the lockfile / docs allowlist (warning, not block)

The guard is best-effort. The real protection is people not committing this material in the first place. The guard catches accidents.

### Threat model

The most plausible failure modes, in rough order of severity:

| Risk | Mitigation |
|---|---|
| Hash drift between language bindings produces silent false negatives | Frozen, NCMEC-cross-checked vector suite gating every `hashkit` release |
| List-source spoofing in `hashstream` returns adversary-controlled "matches" | Signed upstream snapshots, pinned certificates, audit log of every list version served |
| `csam-shield` integration is incomplete (e.g., misses the video pipeline) and adopters believe they're covered | Coverage matrix in the package README; the guard cannot enforce this — documentation is the mitigation |
| A contributor accidentally commits real CSAM or a real hash list | The CI safety guard. Recovery: immediate `git filter-repo` purge, force-push, GitHub repo deletion if needed, notification to NCMEC if the leak was a list |
| Adversaries use our open PDQ implementation to test evasion | Inevitable. We deliberately implement only the already-published open algorithm and never the proprietary PhotoDNA. The threshold and algorithm are public; the hash list is the secret |

### What we do not undertake

- We do not claim to detect **all** CSAM. Hash-matching catches known material; AI classification catches novel material but with false positives.
- We do not undertake to be the moderation system. Platforms still need queues, human review, and appeals processes.
- We do not undertake legal compliance certification. Adopters must work with counsel.

## Reporting concerns

- **Security issues:** `security@digitalharm.org` — see [SECURITY.md](../.github/SECURITY.md)
- **Policy concerns:** `policy@digitalharm.org`
- **CSAM you've encountered (not in this repo):** [NCMEC CyberTipline](https://report.cybertip.org). Do not file in this repo's issue tracker.

## Revisions

This policy is versioned with the repository. Material changes are announced in release notes and require a maintainer-team review.
