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
| [CSAM-Shield](#csam-shield) | 2 | In Progress | Node + Python scaffolds compile; 6 + 7 tests pass; detector dispatch + 3 strategies | Wire real PhotoDNA + PDQ + NCMEC + Cloudflare detector bodies |
| [PromptShield](#promptshield) | 2 | In Progress | Python scaffold compiles; 12 Stage 1 pattern-matcher tests pass (conjunction principle enforced) | Build Stage 2 neural classifier against a curated eval set |
| [HashStream](#hashstream) | 3 | In Progress | Go service compiles (in-memory store + 6 HTTP endpoints); TS SDK 5 tests pass | Land NCMEC Hash Sharing API integration once ESP credentials issued |
| [TrainGuard](#trainguard) | 3 | In Progress | Python scaffold compiles; pure-function `scan_dataset()` returns `ComplianceReport`; 10 tests pass | Wire production hash-list provider against HashStream once it reaches Alpha |
| [CyberTip CLI](#cybertip-cli) | 4 | In Progress | Node + Python scaffolds compile; data model + validation + dry-run wire payload (11 + 11 tests); counsel scope brief filed | Outside counsel review; then land sandbox-then-production submission path |
| [EvidenceVault](#evidencevault) | 4 | In Progress | Go scaffold compiles; tamper-evident custody log + four jurisdiction retention schedules + in-memory vault; counsel scope brief filed | Outside counsel review; then wire HTTP API + KMS encryption layer |
| [C2PA-Lite](#c2pa-lite) | 5 | In Progress | Rust scaffold compiles; `ManifestClaim` with deterministic canonical form + placeholder signing; 6 tests pass. Re-promoted from Deferred per goal naming prevention | Land `upstream` feature path delegating to c2pa-rs for production signing |
| [SafeMod](#safemod) | 5 | Deferred | README only | Spin out — GDPR special-category data load |

Nine In Progress, zero Planned, one Deferred. (Eleven rows because
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

**Wave:** 2 (Drop-in adoption). **Status:** In Progress. **Package:** [`packages/csam-shield`](../packages/csam-shield).

**Current state.** Node + Python scaffolds compile and run. The Node package
lands `createShield(config)` with detector dispatch and three strategies
(`any-match`, `majority`, `consensus`); Express / Fastify / Hono adapters
sketch the middleware shape; 6 tests pass (empty-detector-list rejection,
custom detector, consensus strategy, any-match, timeout containment, audit-
log failure isolation). The Python package mirrors the same model with 7
passing tests. Detector bodies (PhotoDNA, NCMEC, PDQ via hashkit, Cloudflare
CSAM Scanning) are stubs awaiting real wire-up.

**Next milestone:** Wire the four upstream detectors (PhotoDNA, PDQ via
hashkit, NCMEC API, Cloudflare CSAM Scanning) behind the existing stubs.

**Acceptance criteria for In Progress (met in commit `55f6d3d`):**

- ✓ `packages/csam-shield/node/package.json` and
  `packages/csam-shield/python/pyproject.toml` exist
- ✓ Public API sketched with stub detector bodies and a documented
  `MatchResponse` shape
- ✓ CI runs both language toolchains

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

**Wave:** 2 (Drop-in adoption). **Status:** In Progress. **Package:** [`packages/promptshield`](../packages/promptshield).

**Current state.** Python scaffold compiles. The two-stage cascade is
wired: Stage 1 is a pattern matcher enforcing the **conjunction principle**
— a prompt is flagged only when both a `minor-indicator` signal AND a
`sexual-context` signal are present; either alone is benign. Pattern matching
applies Unicode NFKC normalization plus a leetspeak deobfuscation pass before
testing. 12 tests pass. Stage 2 is a neural classifier stub; thresholds
default to `block_at=0.75, review_at=0.5`. Adapters for `diffusers` and
`vllm` are sketched; CLI lands `score` / `screen` subcommands.

**Next milestone:** Build the Stage 2 neural classifier against a curated
eval set with documented prompt-variant resistance.

**Acceptance criteria for In Progress (met in commit `55f6d3d`):**

- ✓ `pyproject.toml` exists; ML deps deferred until Stage 2 begins
- ✓ `PromptClassifier` interface defined: takes a prompt string, returns
  a score + reasoning
- ✓ Middleware adapter stubs for Stable Diffusion (`diffusers`
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

**Wave:** 3 (Credentialed infrastructure). **Status:** In Progress. **Package:** [`packages/hashstream`](../packages/hashstream).

**Current state.** Go service compiles. Pure `net/http` server exposes
`/health`, `/sources`, `/snapshots/{source}`, `/snapshots/{source}/latest`,
`/snapshot/{id}`, `/diff/{from}/{to}`. The in-memory store models `Source`
(NCMEC, IWF, ProjectArachnid), `Snapshot`, and `Diff` types with newest-
first snapshot ordering; server + store tests written. The TypeScript SDK
lands `HashStreamClient` + `HashStreamError` (5 tests pass). Adapter
scaffolds for NCMEC / IWF / Project Arachnid exist; production sync paths
are stubs awaiting credentialed list access.

**Next milestone:** Land the NCMEC Hash Sharing API integration in dev/test
mode once ESP credentials are issued. (Lantern outreach in flight; see
[docs/sponsorship.md](sponsorship.md).)

**Acceptance criteria for In Progress (met in commit `55f6d3d`):**

- ✓ `go.mod` exists at `packages/hashstream`
- ✓ HTTP server skeleton with snapshot + diff endpoints
- ✓ NCMEC client interface defined (polling/diffing/snapshotting
  logic remains TODO until credentials)
- ✓ TypeScript client SDK skeleton

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

**Wave:** 3 (Credentialed infrastructure). **Status:** In Progress. **Package:** [`packages/trainguard`](../packages/trainguard).

**Current state.** Python scaffold compiles. Pure-function `scan_dataset()`
returns a `ComplianceReport` carrying input path, hash list versions,
matches, and timestamp — the chain-of-custody fields that the compliance
case turns on. 10 tests pass; the pipeline refuses zero providers (a class
of silent-pass bug). `InMemoryHashListProvider` works against synthetic
hash lists; LAION-format and WebDataset readers are scaffold stubs. CLI
lands `scan` / `report` subcommands.

**Next milestone:** Wire the production hash-list provider against
HashStream once HashStream reaches Alpha — or against direct NCMEC/IWF
feeds for early adopters with their own credentials.

**Acceptance criteria for In Progress (met in commit `55f6d3d`):**

- ✓ `pyproject.toml` exists
- ✓ Pipeline interface: `scan_dataset(path, hash_lists) -> ComplianceReport`
- ✓ Hash-list adapter interface (in-memory provider working; HashStream-
  backed provider waits on HashStream Alpha)
- ✓ LAION-format reader stub

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

**Wave:** 4 (Legal endgame). **Status:** In Progress. **Package:** [`packages/cybertip-cli`](../packages/cybertip-cli).

**Current state.** Node + Python scaffolds compile. The `CyberTipReport`
data model (drawn from the NCMEC CyberTipline API PDF spec) plus
`validateReport()` + `generateClientReference()` + `redactForLog()` are
implemented and tested (11 Node tests + 11 Python tests). `submit_dry_run`
produces the SHOUTY_CASE wire payload without any network I/O so callers
can integration-test their integration in CI. The production submission
path is **explicitly not wired** — `docs/counsel-scope-brief.md` lists 6
open questions for outside counsel before that path lands.

**Next milestone:** Outside counsel review of `docs/counsel-scope-brief.md`;
once the brief is signed off, land the sandbox-then-production submission
path with audit-log chain-of-custody.

**Acceptance criteria for In Progress (met in commit `55f6d3d`):**

- ✓ Counsel scope brief on file (6 open questions documented)
- ✓ TypeScript + Python package scaffolds with the report-shape data model
  (drawn from the NCMEC CyberTipline API PDF spec)
- ✓ `cybertip` CLI command with `submit`, `validate`, `audit` subcommands
  as stubs (`submit` runs the dry-run path; production submit blocked at
  CLI until counsel signs off)

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

**Wave:** 4 (Legal endgame). **Status:** In Progress. **Package:** [`packages/evidencevault`](../packages/evidencevault).

**Current state.** Go service compiles. `internal/custody` lands an append-
only chain-of-custody log with a tamper-evident hash chain whose `Verify()`
detects modifications. `internal/retention` encodes jurisdiction schedules
(`USFederal2258A` 90d, `EuDSA`, `UKOSA`, `AustraliaESafety` — every schedule
flagged "counsel review pending" so no caller mistakes scaffold defaults for
legal advice). `internal/vault` lands an `InMemoryVault` with `Store` /
`Get` / `PlaceHold` / `ReleaseHold` / `Delete` / `ListExpired`. The
`evidencevaultd` daemon boots with a startup banner that points at the
counsel scope brief; the HTTP API surface is intentionally not wired until
counsel review of `docs/counsel-scope-brief.md` completes.

**Next milestone:** Outside counsel review of `docs/counsel-scope-brief.md`;
once signed off, wire the HTTP API + KMS-backed encryption layer and
graduate the retention schedules from "pending" to "reviewed."

**Acceptance criteria for In Progress (met in commit `55f6d3d`):**

- ✓ Counsel scope brief on file (covers US 2258A baseline plus EU/UK/AU
  drafts marked pending review)
- ✓ Go service skeleton with the chain-of-custody data model
- ✓ Encryption layer interface (KMS-backed, no novel crypto — interface
  defined; wiring waits on counsel review)
- ✓ Preservation-timer interface (`PlaceHold` / `ReleaseHold`) handling
  common law-enforcement preservation request durations

**Acceptance criteria for Alpha:**

- Working encryption + chain-of-custody + retention enforcement in dev/test
- Docker image self-hostable
- At least one jurisdiction's retention rules fully encoded and tested

**Acceptance criteria for Beta:** as with CyberTip CLI — outside counsel
sign-off and at least one production deployment.

**Blockers:** same as CyberTip CLI — counsel retainer.

---

### C2PA-Lite

**Wave:** 5 (re-promoted from Deferred). **Status:** In Progress. **Package:** [`packages/c2pa-lite`](../packages/c2pa-lite).

**Current state.** Rust crate compiles. `ManifestClaim` carries the
structured fields (claim_id, producer, ai_generated, generator, metadata
pairs) with a deterministic `to_canonical()` that alphabetizes metadata
for stable signing. `sign_image()` returns a `SignedAsset` with a
length-32 placeholder signature so the API round-trips in tests; the real
signing path is gated behind an `upstream` feature flag that delegates to
[c2pa-rs](https://github.com/contentauth/c2pa-rs) — the value-add isn't
reimplementing C2PA primitives, it's the soft-binding-watermark glue.
`verify()` and `watermark::embed` / `watermark::extract` are scaffolded as
`NotImplemented`. 6 tests pass.

**Why re-promoted.** The active maintainer goal explicitly names *prevent*
as a portfolio responsibility. C2PA provenance signaling is the cheapest
prevention primitive available to AI generators today, and the manifest
layer is tractable now that upstream c2pa-rs handles the heavy lifting.
The original deferral reasoning (watermark-removal adversary is moving
research, hosted manifest-store burden is open-ended) still holds for the
**watermark layer** — that's why watermark embed/extract remain
`NotImplemented` and only land once a robust scheme stabilizes in the
literature. The manifest layer itself is buildable now.

**Next milestone:** Land the `upstream` feature path that delegates to
c2pa-rs for production-grade signing of `ManifestClaim` values.

**Acceptance criteria for In Progress (met in commit `55f6d3d`):**

- ✓ `Cargo.toml` exists and the crate is a workspace member
- ✓ `ManifestClaim` + `sign_image()` + `watermark::{embed,extract}` API
  surface defined
- ✓ CI runs the Rust workspace clippy + tests

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
| 2026-05-30 | Wave 2–5 scaffold landings | Six tools moved Planned → In Progress and C2PA-Lite was re-promoted Deferred → In Progress (commit [`55f6d3d`](https://github.com/digitalharm/digitalharm-oss/commit/55f6d3d)) under the maintainer goal *"build out all of the OSS projects necessary for AI startups, cloud providers, and developers to detect, block, report, and prevent CSAM."* Each tool now ships a public API surface with deterministic tests: CSAM-Shield (6 Node + 7 Python tests), PromptShield (12 tests, conjunction principle enforced), HashStream (Go server + store + TS SDK 5 tests), TrainGuard (10 tests; pure-function `scan_dataset()`), CyberTip CLI (11 + 11 tests; counsel scope brief filed), EvidenceVault (custody / retention / vault Go tests; counsel scope brief filed), C2PA-Lite (6 tests; `upstream` feature gates real c2pa-rs signing). CI extended to four matrices: Rust workspace, Go ×2, Python ×5, Node ×3. Production paths for CyberTip CLI + EvidenceVault remain **blocked at the CLI** until outside counsel reviews the scope briefs. SafeMod remains Deferred. |
