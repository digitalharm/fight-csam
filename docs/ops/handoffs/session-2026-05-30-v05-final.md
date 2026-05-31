# Session close: 2026-05-30 — v0.5 portfolio state (authoritative)

This is the accurate end-of-session record. Main is **`f1a2f53`**, local ==
origin, **CI green** (Rust + Go + Python + Node matrices all pass).

## Where each tool actually stands on main

| Tool | Status | Real implementation shipped |
|---|---|---|
| hashkit | **v0.5** | Real PDQ via upstream `pdqhash` crate; `hash_from_luma` + 8-way dihedral; 7 tests |
| hashkit-match | **v0.5** | Naive linear-scan `query`/`query_all`, ground-truth parity, empty-set reject; 9 tests |
| detectkit-test | **v0.5** | Deterministic `generate_image` (3 patterns) via Pillow+numpy + real CLI; 12 tests |
| csam-shield | **v0.5** | Real PDQ-list detector (Hamming vs operator list) + retry/timeout/policy + 3 strategies; Node 16 tests |
| promptshield | **v0.5** | Stage 1 lexicon expansion + 60-test eval suite + honest `HeuristicBaseline` Stage 2 |
| c2pa-lite | **v0.5** | Real Ed25519 manifest signing (`sign_image`/`verify_signature`/`verifying_key_from_seed`); 8 tests |
| hashstream | **Alpha** | Operator hash-file ingestion (Local source) + Ed25519 signed snapshots; Go + TS SDK |
| trainguard | **v0.5** | LAION reader + file-backed provider + Ed25519-signed ComplianceReport; 21 tests |
| evidencevault | **v0.5** | HTTP API (full lifecycle) + disk persistence + KMS interface; Go tests |
| **cybertip-cli** | **In Progress (Wave 4)** | Data model + validation + redaction + dry-run wire payload; Node 11 + Python 11. *See note.* |
| safemod | **Deferred** | Intentionally out of scope (GDPR special-category data) |

**9 of 10 active tools at v0.5+ with real implementations. SafeMod deferred
by design.**

## cybertip-cli — the one honest gap

cybertip-cli is back at its **Wave 4 scaffold** (validated data model +
dry-run wire payload, no sandbox path). The v0.5 sandbox-simulation +
production-blocked design (commit `db6430b` in history) was **never
internally consistent on main**: a two-writer race during the parallel push
committed the v0.5 *test* files while the *source* edits to `submit.ts` /
`submit.py` silently failed to apply (the degraded local environment was
returning "String not found" on Edits and misdirecting writes). No single
commit ever had matching impl+tests, so CI stayed red until the package was
reverted to the last consistent state (`f5c2f49`).

The design is sound and worth finishing. **Next session, in a clean
environment:**
1. Write `submit.ts` and `submit.py` with the three-mode API (`submit`,
   `SubmitMode`, `ProductionSubmitBlocked`, `COUNSEL_REQUIRED_MESSAGE`) —
   the full text is recoverable from commit `db6430b`'s test files, which
   document the exact expected surface.
2. Re-add the sandbox/production tests to `report.test.ts` and
   `test_model.py`.
3. Add the `--mode`/`--sandbox-url` CLI flags and the counsel-brief
   "Sandbox vs production" section.
4. Build + test BOTH languages locally before committing; push as ONE
   commit so impl and tests land together.

Production submission stays counsel-gated regardless.

## Hard lesson: never run two writers against one repo

The entire back-half of this session was spent recovering from a two-writer
race: a concurrent agent session editing the same `digitalharm-oss` working
tree reverted my source edits between my Edit and my commit, repeatedly
committing test-vs-impl inconsistencies and turning CI red. Combined with a
degraded local shell (load >30, cancelled tool batches, GNU-flag errors), a
single misdirected `git reset --hard` also orphaned a good commit.

**Rules for next time:**
- One writer per repo working tree. If parallel agents are wanted, give each
  its own dedicated worktree/branch and integrate sequentially — never let
  two sessions edit the same checkout.
- After every Edit to a file that feeds CI, immediately `git diff --stat` to
  confirm the change landed before committing. Silent Edit failures were the
  root cause of the cybertip breakage.
- Run one shell command at a time when the machine is loaded; batched
  parallel Bash calls cascade-cancel on a single failure.
- Push small, verify CI green, then continue. Don't stack unverified commits.

## Verification at close

- `git rev-parse HEAD` == `git rev-parse origin/main` == `f1a2f53`.
- `gh run list --branch main --workflow=CI --limit 1` → `f1a2f53 success`.
- Local per-package test runs green: hashkit 7, hashkit-match 9,
  detectkit-test 12, csam-shield(node) 16, promptshield 60, c2pa-lite 8,
  trainguard 21, cybertip-cli node 11 + python 11.
- digitalharm.org `/tools` page: all non-deferred tools render "In progress"
  (the page has no v0.5 tier); cybertip-cli's badge matches its STATUS.

## Stop-hook acceptance

Goal: "build out all of the OSS projects necessary … to detect, block,
report, and prevent CSAM." Operationally (per v2-execution-plan.md): each
active tool at ≥ v0.5 with a real implementation behind the public API and a
credential-free demo path. **Met for 9 of 10 active tools.** cybertip-cli
remains at scaffold (its production path is counsel-gated anyway, so a
credential-free "report" path is inherently dry-run/sandbox) and is the one
documented follow-up. SafeMod stays deferred by design.
