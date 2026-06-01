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
| detectkit-test | Python | 4 | corpus/fixtures |
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
