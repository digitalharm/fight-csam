# OSS portfolio — verified test baseline (2026-05-31)

All 11 packages built and **green** locally this session. Counts are passing
tests per package (verified after installing each package's deps — the earlier
"failures" were purely uninstalled packages, i.e. `pip install -e` / `npm install`
not yet run, not real test failures).

| Package | Language | Tests | Notes |
|---|---|---|---|
| hashkit | Rust | 9 | PDQ + TMK algorithms (workspace) |
| hashkit-match | Rust | 8 | Hamming matcher (workspace) |
| c2pa-lite | Rust | 9 | provenance; `upstream` feature gates real c2pa-rs |
| **safemod** | Rust | **17** | **NEW this session — re-promoted from Deferred** |
| hashstream | Go | pass | server + store + signing (`go test ./...`) |
| evidencevault | Go | pass | custody + retention + vault |
| detectkit-test | Python | 10 | deterministic fixture generation implemented (was 4 scaffold stubs) |
| promptshield | Python | 60 | classifier + eval suite |
| trainguard | Python | 21 | dataset screen pipeline |
| csam-shield (python) | Python | 24 | detector dispatch + strategies |
| cybertip-cli (python) | Python | 16 | model; production submit blocked at CLI |
| csam-shield (node) | Node | pass | `tsc` clean, `node --test` fail 0 |
| cybertip-cli (node) | Node | pass | `tsc` clean, `node --test` fail 0 |
| hashstream (sdk-ts) | Node | (no tests) | `tsc` clean; SDK client |

**Rust workspace:** `cargo fmt --check`, `cargo clippy -D warnings`, and
`cargo test --workspace` all green (43 tests total: 9+8+9+17). Safety guard
(`scripts/safety-check.sh`) clean.

## Status of the portfolio

- **Zero Deferred tools** — SafeMod re-promoted Deferred → In Progress (v1.0
  core) with a privacy-by-construction design (zero deps, `forbid(unsafe)`, no
  identifiers/clock/I-O, aggregate-only k-anonymous wellbeing).
- The 10 prior tools sit at **In Progress (v0.5+)**: each ships a public API
  surface with deterministic tests and passes CI.

## What "finished" still requires (per the roadmap's own gates)

These are not local-code gaps; they are the documented promotion criteria:

- **CyberTip CLI + EvidenceVault** production submit/transmit paths remain
  **blocked at the CLI** until outside counsel reviews the filed scope briefs
  (legal-tier gate — intentional, not a bug).
- **C2PA-Lite** real signing is behind the `upstream` cargo feature pending the
  c2pa-rs dependency decision.
- Promotion **In Progress → Alpha** per tool needs its acceptance criteria met
  (see each section of `docs/roadmap.md`) — largely real-detector-body wiring
  behind the existing stubs (e.g. PhotoDNA/NCMEC adapters in csam-shield).

## What "finished" means here (and why the remaining stubs are correct)

This is an OSS portfolio whose job is to be *integrated*, not to ship secrets.
Several remaining `NotImplementedError` / `TODO` markers are **deliberate
integration seams, not unfinished work** — and completing them in the open
repo would be wrong:

- **Detector wire protocols** (csam-shield, hashstream adapters: NCMEC Hash
  Sharing API, IWF Hash List, Project Arachnid Shield, PhotoDNA): each raises a
  documented error telling the integrator which **credentialed relationship**
  they must establish. The repo ships no hash lists and no provider credentials
  by design (and the safety guard enforces it). "Finished" = the dispatch +
  strategy + the documented seam, which is present.
- **CyberTip CLI / EvidenceVault production submit/transmit**: blocked at the
  CLI pending **outside-counsel review** of the filed scope briefs. A legal-tier
  gate, intentional.
- **C2PA-Lite real signing**: behind the `upstream` cargo feature pending the
  c2pa-rs dependency decision.
- **detectkit-test lenna/kodak patterns + TMK video**: need external licensed
  assets / a later milestone; the five synthesizable still-image patterns +
  reproducible corpus are implemented.

So the portfolio is "finished" in the sense an OSS library can be: every
package builds, lints, and passes its tests; the public APIs are complete; and
the only unfilled bodies are the ones that *require* a credential, a license,
or counsel sign-off that an open repo must not carry. Promotion of each tool
`In Progress → Alpha` is then an integrator/maintainer milestone, documented
per tool in `docs/roadmap.md`.

## Genuine finish-work completed this session

- **SafeMod**: Deferred → built (privacy-by-construction Rust crate, 17 tests).
  The portfolio now has **zero Deferred tools**.
- **detectkit-test**: scaffold → real deterministic fixture generation
  (4 → 10 tests), unblocked by HashKit shipping.

## How to reproduce

```
# Rust
cargo test --workspace --all-features
cargo fmt --all -- --check && cargo clippy --workspace --all-targets -- -D warnings

# Go
(cd packages/hashstream && go test ./...)
(cd packages/evidencevault && go test ./...)

# Python (per package; uses each package's .venv)
for p in detectkit-test promptshield trainguard csam-shield/python cybertip-cli/python; do
  (cd packages/$p && .venv/bin/python -m pip install -q -e ".[dev]" && .venv/bin/python -m pytest -q)
done

# Node (per package)
for p in csam-shield/node cybertip-cli/node hashstream/sdk-ts; do
  (cd packages/$p && npm install && npx tsc --noEmit)
done
```
