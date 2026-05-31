# Roadmap

The canonical status document for the 10-tool portfolio. Distinct from
[`sequencing.md`](sequencing.md) (which explains *why* the waves are ordered the
way they are) and from each package's `README.md` (which holds the design
spec). This document answers a single question: **where is each tool right
now, and what does it take to advance it?**

Last reviewed: 2026-05-30. The [changelog](#changelog) at the bottom records
every status change so a returning reader can see the trajectory.

---

## Status taxonomy

Six statuses, ordered by maturity. Each has explicit promotion criteria.

| Status | Meaning | Promotion to next status requires |
|---|---|---|
| **Planned** | Designed but no code beyond `STATUS` + `README`. Everything is intent. | Public API surface sketched in code; package config (`Cargo.toml` / `pyproject.toml` / `package.json`) exists; CI compiles the scaffold. |
| **In Progress** | Scaffolded and compiling, but core functionality not implemented. Tests cover only the shape of the API. | Core functionality implemented; happy-path tests pass; API documented; published to a registry at `0.x.y`. |
| **Alpha** | Usable for early adopters who accept breaking changes. The "real" code exists but the API is still moving. | API stabilized (semver promises begin); edge cases covered; at least one production deployment with consent; security review for tools with sensitive surfaces. |
| **Beta** | API stable, hardening for production. Most users should be here. | 90+ days at Beta without breaking changes; multiple production deployments; all P0/P1 issues resolved; for credentialed tools: NCMEC/IWF/Arachnid validation complete; for legal-tier tools: outside counsel sign-off. |
| **Stable** | Production-ready. Semver applies. The expected destination. | (terminal — no further status promotion) |
| **Deferred** | Intentionally postponed or spun out. Not on the active roadmap. | Re-promoted to Planned via explicit issue + maintainer decision. |

Three things this taxonomy is *not*:

- Not a release-version schema. A tool can be at Alpha and on its 17th
  release; status describes maturity expectations, not version numbers.
- Not a substitute for changelogs. Each package has its own `CHANGELOG.md`
  once it ships; the roadmap tracks coarse-grained transitions.
- Not negotiable for legal-tier tools. CyberTip CLI and EvidenceVault
  cannot promote past Alpha without outside counsel review of the
  reporting/retention paths. This is documented at each tool's section.

---

## Status at a glance

| Tool | Wave | Status | Current state | Next milestone |
|---|---|---|---|---|
| [HashKit](#hashkit) | 1 | In Progress | Scaffold compiles; PDQ port `todo!()` | PDQ port verified against C++ reference |
| [hashkit-match](#hashkit-match) | 1 | In Progress | Scaffold compiles; MIH lookup `todo!()` | MIH implementation matching naive linear |
| [DetectKit-Test](#detectkit-test) | 1 | In Progress | Python scaffold compiles; generators `NotImplementedError` | Deterministic image fixture generator |
| [CSAM-Shield](#csam-shield) | 2 | Planned | README only | Cargo.toml / package.json scaffold + API sketch |
| [PromptShield](#promptshield) | 2 | Planned | README only | pyproject.toml scaffold + API sketch |
| [HashStream](#hashstream) | 3 | Planned | README only | Service skeleton + first NCMEC API integration |
| [TrainGuard](#trainguard) | 3 | Planned | README only | pyproject.toml scaffold + first hash-list adapter |
| [CyberTip CLI](#cybertip-cli) | 4 | Planned | README only | Counsel-reviewed scope brief |
| [EvidenceVault](#evidencevault) | 4 | Planned | README only | Counsel-reviewed scope brief |
| [C2PA-Lite](#c2pa-lite) | 5 | Deferred | README only | Wait for upstream `c2pa-rs` to stabilize |
| [SafeMod](#safemod) | 5 | Deferred | README only | Spin out — GDPR special-category data load |

Three In Progress, six Planned, two Deferred. (Eleven rows because
`hashkit-match` is its own crate but ships alongside `hashkit`; both count
as a single tool deliverable in the at-glance "10 tools" framing.)

---

## Per-tool detail

### HashKit

**Wave:** 1 (Foundation). **Status:** In Progress. **Package:** [`packages/hashkit`](../packages/hashkit).

**Current state.** Rust crate scaffold landed: `Cargo.toml` declares the crate
with `crate-type = ["cdylib", "rlib"]` and a `wasm` feature flag. `src/lib.rs`
sketches the full public API surface for PDQ (`PdqHash`, `PdqQuality`,
`PdqResult`, `PdqError`, `hash_from_luma`, `hash_dihedral_from_luma`) and TMK
(`TmkFeatures`, `features_from_frames`). Algorithm bodies are `todo!()`.
`thiserror` is in deps; two unit tests pass (hex-shape, Hamming distance). CI
green.

**Next milestone:** PDQ port verified against the
[facebook/ThreatExchange C++ reference](https://github.com/facebook/ThreatExchange/tree/main/pdq).

**Acceptance criteria for Alpha:**

- `hash_from_luma` produces byte-identical hashes to the C++ reference on at
  least 20 synthetic inputs in `vectors/v0/corpus.json`
- `hash_dihedral_from_luma` matches the reference for all 8 dihedral outputs
- WASM build via `wasm-pack` produces byte-identical hashes to the native
  Rust build on the same corpus
- Published to crates.io and npm at `0.1.0`
- CI fails closed on any corpus drift

**Blockers:**

- None for the Rust port itself. The credentialed NCMEC-cross-checked subset
  of the corpus depends on the ESP relationship (see
  [docs/sponsorship.md](sponsorship.md)), but that's a Beta-promotion
  blocker, not an Alpha-promotion blocker.

**Beta blockers (documented now for honesty):**

- ≥50 vectors in the corpus carrying `ncmec_verified: true`
- Independent reproduction of the WASM build by at least one external
  contributor on a different OS

---

### hashkit-match

**Wave:** 1 (ships alongside HashKit). **Status:** In Progress. **Package:** [`packages/hashkit-match`](../packages/hashkit-match).

**Current state.** Rust crate scaffold landed: `PdqMatcher` with
`new()`, `with_default_threshold()`, `query()`, `query_all()`. Constants
include `DEFAULT_HAMMING_THRESHOLD = 31` (PhotoDNA-equivalent). MIH lookup is
`todo!()`. Two unit tests pass (threshold validation). Depends on `hashkit`
via workspace path.

**Next milestone:** Multi-index Hamming (MIH) implementation that matches a
naive linear scan on small sets.

**Acceptance criteria for Alpha:**

- `query` returns the closest match within threshold, matching naive
  linear-scan ground truth on at least 100 randomized queries against
  10,000-hash reference sets
- `query_all` returns all matches in order, matching naive ground truth
- Bench shows MIH outperforming naive at ≥10,000-hash sets (the whole point
  of the algorithm)
- Published to crates.io at `0.1.0`

**Blockers:** none beyond `hashkit` shipping a working `PdqHash`.

---

### DetectKit-Test

**Wave:** 1 (Foundation). **Status:** In Progress. **Package:** [`packages/detectkit-test`](../packages/detectkit-test).

**Current state.** Python package scaffold landed: `pyproject.toml` with
hatchling, Apache 2.0, Python 3.10+, scripts entry for the CLI. Public API
sketched in `fixtures.py` (`SyntheticImage`, `SyntheticVideo`,
`generate_image`, `generate_video`, `generate_corpus`) and `hashing.py`
(`ExpectedHash`, `HashKind`). CLI has `generate` / `verify` subcommands as
stubs. All generators raise `NotImplementedError`.

**Next milestone:** Deterministic image fixture generator producing
synthetic non-CSAM images with engineered hash properties.

**Acceptance criteria for Alpha:**

- `generate_image` produces deterministic PNG bytes from `(identifier, seed,
  pattern, width, height)` — same inputs always produce same bytes
- At least 5 patterns implemented: `gradient-horizontal`,
  `gradient-vertical`, `gradient-radial`, `checkerboard`, `structured-noise`
- Generated images are run through `hashkit` to record expected hashes in
  `packages/hashkit/vectors/v0/corpus.json`
- `verify` subcommand re-runs the corpus and confirms zero drift
- Published to PyPI at `0.1.0`

**Blockers:**

- `hashkit` must produce working PDQ hashes before the corpus can be
  populated. Until then, DetectKit-Test can scaffold image generation but
  not hash-record the outputs. This is the same gating constraint as
  HashKit's own Alpha promotion — they advance together.

---

### CSAM-Shield

**Wave:** 2 (Drop-in adoption). **Status:** Planned. **Package:** [`packages/csam-shield`](../packages/csam-shield).

**Current state.** README + STATUS file only.

**Next milestone:** Scaffold the dual-language package surface — TypeScript
(Express/Fastify/Hono middleware) and Python (FastAPI middleware) — with
public API and stub config for each upstream detector (PhotoDNA, NCMEC, PDQ
via hashkit, Cloudflare CSAM Scanning).

**Acceptance criteria for In Progress:**

- `packages/csam-shield/package.json` (npm) and
  `packages/csam-shield/pyproject.toml` (PyPI) exist
- Public API sketched with `todo!()` / `NotImplementedError` bodies and
  documented `MatchResponse` shape
- CI runs both language toolchains

**Acceptance criteria for Alpha (the bar that actually matters):**

- One-line setup that wires the four upstream detectors behind the unified
  interface
- Works in at least one published example: Express + PhotoDNA, FastAPI +
  Cloudflare
- Reasonable retry / circuit-breaker / fallback behavior when an upstream
  is down (this is the value-add over rolling your own integration)
- Published at `0.1.0`

**Blockers:** none for In Progress. For Alpha, depends on having access to
at least one upstream's testing tier (PhotoDNA sandbox or Cloudflare's free
scanner — both are obtainable without enterprise contracts).

---

### PromptShield

**Wave:** 2 (Drop-in adoption). **Status:** Planned. **Package:** [`packages/promptshield`](../packages/promptshield).

**Current state.** README + STATUS file only.

**Next milestone:** Scaffold the Python package as middleware for
Stable Diffusion / FLUX / ComfyUI / vLLM, with the classifier interface
defined and a model loader stub.

**Acceptance criteria for In Progress:**

- `pyproject.toml` exists with the relevant ML deps planned (likely
  `transformers`, `torch` or `onnxruntime`)
- `PromptClassifier` interface defined: takes a prompt string, returns
  a score + reasoning
- Middleware adapter stubs for at least Stable Diffusion (`diffusers`
  pipeline hook) and vLLM (generation-time hook)

**Acceptance criteria for Alpha:**

- A working classifier (could be a small fine-tuned model or a
  curated-prompt-pattern matcher to start) that blocks obvious CSAM-intent
  prompts with at least 90% recall on a public adversarial test set
- Documented prompt-variant resistance (the jailbreak adversary is real)
- Published at `0.1.0`

**Blockers:** training/evaluation data for the classifier. The synthesis
note warned about this — building a classifier without a proper eval set is
"a model" not "a defense." Best path is to start with a pattern-matching
classifier that has clear rules and graduate to a neural classifier once a
real eval set exists.

---

### HashStream

**Wave:** 3 (Credentialed infrastructure). **Status:** Planned. **Package:** [`packages/hashstream`](../packages/hashstream).

**Current state.** README + STATUS file only.

**Next milestone:** Service skeleton in Go with the NCMEC Hash Sharing API
integration sketched.

**Acceptance criteria for In Progress:**

- `go.mod` exists at `packages/hashstream`
- HTTP server skeleton with `/sync`, `/snapshot/:version`, `/diff` endpoints
- NCMEC client interface defined (with the polling/diffing/snapshotting
  logic noted as TODO)
- TypeScript client SDK skeleton

**Acceptance criteria for Alpha:**

- Working NCMEC Hash Sharing integration in dev/test mode
- Versioned snapshots with audit log
- At least one IWF or Arachnid integration alongside NCMEC
- Self-hostable via Docker image
- Signed snapshots (mitigating the list-source-spoofing threat from
  [docs/safety-policy.md](safety-policy.md))

**Blockers (significant):**

- NCMEC ESP credentialing relationship. This is the gating dependency for
  the entire Wave 3 line of work and the single most important non-code
  blocker on the roadmap. See [docs/sponsorship.md](sponsorship.md) for the
  Lantern outreach that funds the credential-brokering work.

---

### TrainGuard

**Wave:** 3 (Credentialed infrastructure). **Status:** Planned. **Package:** [`packages/trainguard`](../packages/trainguard).

**Current state.** README + STATUS file only.

**Next milestone:** Python package scaffold with the dataset-screening
pipeline interface defined.

**Acceptance criteria for In Progress:**

- `pyproject.toml` exists
- Pipeline interface: `scan_dataset(path, hash_lists) -> ComplianceReport`
- Hash-list adapter interface that consumes from `hashstream` (when ready)
  or a local hash file
- LAION-format reader stub (the documented motivating use case)

**Acceptance criteria for Alpha:**

- Working screening of LAION-format datasets against at least one hash list
- Compliance report with chain-of-custody (input path, hash list version,
  matches, timestamp, signing key)
- Published at `0.1.0`

**Blockers:** depends on HashStream Alpha or direct NCMEC/IWF access for
the hash lists themselves. The pipeline can be developed independently and
demonstrated against synthetic hash lists; production use waits on the
credential chain.

---

### CyberTip CLI

**Wave:** 4 (Legal endgame). **Status:** Planned. **Package:** [`packages/cybertip-cli`](../packages/cybertip-cli).

**Current state.** README + STATUS file only.

**Next milestone:** Counsel-reviewed scope brief documenting what the CLI
will and will not do regarding statutory reporting under 18 U.S.C. § 2258A.

**Acceptance criteria for In Progress:**

- Counsel scope brief on file
- TypeScript / Python package scaffolds with the report-shape data model
  (drawn from the NCMEC CyberTipline API PDF spec)
- `cybertip` CLI command with `submit`, `validate`, `audit` subcommands
  as stubs

**Acceptance criteria for Alpha (note: harder than other tools):**

- Working submission to NCMEC CyberTipline sandbox / test endpoint
- Audit log of every submission with chain-of-custody metadata
- Outside counsel sign-off on the redaction and validation paths
- Documented retry / idempotency behavior so a failed submission is
  recoverable

**Acceptance criteria for Beta (legal-tier specific):**

- Outside counsel sign-off on the production submission path
- At least one production deployment with consent (a platform that has
  filed a real CyberTipline report using the tool)

**Blockers:** outside counsel retainer (line item in
[docs/outreach/lantern.md](outreach/lantern.md) — $25K of the $250K ask is
this single line). The legal-tier tools cannot be "shipped" by a solo
maintainer without counsel review.

---

### EvidenceVault

**Wave:** 4 (Legal endgame). **Status:** Planned. **Package:** [`packages/evidencevault`](../packages/evidencevault).

**Current state.** README + STATUS file only.

**Next milestone:** Counsel-reviewed scope brief documenting jurisdictional
retention requirements (US 18 U.S.C. § 2258A retention windows, EU DSA
Article 24 preservation, UK Online Safety Act retention, AU eSafety).

**Acceptance criteria for In Progress:**

- Counsel scope brief on file (covering at least the US baseline)
- Go service skeleton with the chain-of-custody data model
- Encryption layer interface (KMS-backed, no novel crypto)
- Preservation-timer interface that handles common law-enforcement
  preservation request durations

**Acceptance criteria for Alpha:**

- Working encryption + chain-of-custody + retention enforcement in dev/test
- Docker image self-hostable
- At least one jurisdiction's retention rules fully encoded and tested

**Acceptance criteria for Beta:** as with CyberTip CLI — outside counsel
sign-off and at least one production deployment.

**Blockers:** same as CyberTip CLI — counsel retainer.

---

### C2PA-Lite

**Wave:** 5 (Deferred). **Status:** Deferred. **Package:** [`packages/c2pa-lite`](../packages/c2pa-lite).

**Current state.** README + STATUS file only.

**Why deferred.** The synthesis note flagged two real concerns: (1) the
watermark-removal adversary is a moving research target, and (2) shipping
this tool means committing to a hosted manifest-store service whose
operational burden is open-ended. Upstream
[c2pa-rs](https://github.com/contentauth/c2pa-rs) already implements the
signing primitives well; the C2PA-Lite value-add (the watermark-as-soft-
binding glue) is best built once c2pa-rs's API stabilizes and once the
maintenance footprint is shared with a co-maintainer or sponsor.

**Re-promotion criteria:**

- `c2pa-rs` reaches `1.0.0` or otherwise commits to API stability
- A co-maintainer joins the project, or a sponsor explicitly funds this
  tool

**Tracking:** monitor c2pa-rs releases and the C2PA spec at
[c2pa.org/specifications](https://c2pa.org/specifications/).

---

### SafeMod

**Wave:** 5 (Deferred indefinitely). **Status:** Deferred. **Package:** [`packages/safemod`](../packages/safemod).

**Why deferred.** The synthesis was direct: SafeMod's primary load is GDPR
special-category mental-health data, which is a liability mismatch for a
solo maintainer's threat model. It is also the only tool in the portfolio
with no dependency on the hashing spine, meaning it doesn't reinforce the
rest of the work. Most valuable home is a dedicated moderator-wellbeing
organization, not this portfolio.

**Re-promotion criteria:**

- A dedicated maintainer with HIPAA / GDPR-special-category data experience
  joins
- A health-tech organization adopts SafeMod as their primary maintenance
  responsibility

**Best alternative path:** open an issue with the moderator-wellbeing
community (e.g., the All Tech Is Human Trust & Safety community, the Tech
Coalition's wellbeing working group) to find a more appropriate home for
this work.

---

## Cross-tool dependency map

Reading top-to-bottom, each tool depends on the ones above it:

```
HashKit (PDQ + TMK algorithms)
├─ hashkit-match (uses PdqHash)
├─ DetectKit-Test (records expected PDQ hashes in corpus)
├─ HashStream (consumes PdqHash to compare against lists)
└─ TrainGuard (uses hashkit-match for dataset screening)

CSAM-Shield (wires upstream detectors)
└─ depends on HashKit + hashkit-match for the PDQ path

PromptShield (independent — operates on prompt text, not images)

CyberTip CLI (independent code; depends on counsel review)
EvidenceVault (independent code; depends on counsel review)

C2PA-Lite (independent; deferred)
SafeMod (independent; deferred)
```

The graph is a tree rooted at HashKit, with three independent satellites
(PromptShield, CyberTip CLI, EvidenceVault) and two deferred satellites.
This is the structural reason Wave 1 ships first — every Wave 1 tool
unblocks something in Waves 2–3.

---

## How to suggest a status change

- **Promotion** (e.g., In Progress → Alpha): open a PR that updates this
  document and the per-package `STATUS` file in the same commit. Include
  evidence that the acceptance criteria are met (test output, deployed
  example link, counsel sign-off attachment for legal-tier tools).
- **Deferral** (Planned → Deferred): open an issue first. The roadmap is
  intentional; deprioritizing a tool needs explicit reasoning.
- **Re-prioritization** (e.g., bumping a Wave 3 tool to Wave 2): open an
  issue. This is a sequencing-doc change, not a roadmap change — see
  [sequencing.md](sequencing.md) for the rationale to argue against.

---

## Changelog

The roadmap evolves over time. Each material status change goes here.

| Date | Change | Note |
|---|---|---|
| 2026-05-30 | Initial roadmap published | All 10 tools documented. HashKit, hashkit-match, DetectKit-Test promoted from Planned → In Progress (scaffold complete with passing CI). |
| 2026-05-30 | Wave 5 tools formally deferred | C2PA-Lite and SafeMod marked Deferred with re-promotion criteria, per the synthesis. |
