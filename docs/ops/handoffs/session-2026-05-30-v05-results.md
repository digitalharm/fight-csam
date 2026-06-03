# Session results: 2026-05-30 — v0.5 implementation wave

Accurate resume point for the next agent/human.

## What landed on main (real implementations, CI-verified green at 94bf951)

| Tool | What shipped |
|---|---|
| **detectkit-test** | Deterministic `generate_image` (3 patterns) via Pillow+numpy + real CLI |
| **hashkit-match** | Naive linear-scan `query`/`query_all`, ground-truth parity test, empty-set reject |
| **evidencevault** | HTTP API (full lifecycle) + disk persistence + KMS interface |
| **trainguard** | LAION reader + file-backed provider + Ed25519-signed ComplianceReport |

CI run 26700925101 (commit 94bf951): completed, success — full matrix
(Rust + Go + Python + Node).

## Not yet on main — needs next session

| Tool | State | Where the work is | Next step |
|---|---|---|---|
| **hashkit** | `todo!()` on main (clean scaffold). Agent blocked by wrong-repo worktree; Release Captain's wiring attempt reverted to avoid breaking main in a degraded env. | Plan only | **Critical path.** Real PDQ via `pdqhash` crate. NOTE no_std complication: crate is `#![cfg_attr(not(feature="std"), no_std)]` with NO `std` feature defined — add a `std` feature, gate pdqhash + impl behind it, keep no_std compiling. Use `pdqhash::image` re-export (NOT a direct `image` dep — avoids the 0.23-vs-0.25 DynamicImage type mismatch). Map quality 0.0–1.0 → 0–100. 8 dihedral variants via imageops. Do it directly on main (most reliable). |
| **hashstream** | Work was uncommitted in worktree `.worktrees/wave-c-hashstream` (Local source + Ed25519 signing). May be lost if worktree was pruned — check `git branch --list 'agent/wave-c-hashstream'` and the worktree. | Worktree (uncommitted) | If recoverable: commit + `go mod tidy` (agent added golang.org/x/crypto, needs go.sum) + merge. Else re-implement per v2-execution-plan Wave C. |
| **csam-shield** | PDQ detector worked (6/6 own tests) but agent's core `DetectorResult` refactor regressed 3 pre-existing Shield tests. Was uncommitted in `.worktrees/agent-wave-b-csam-shield`. | Worktree (uncommitted) | Reconcile the new Verdict type through `index.ts` strategy logic + update `index.test.ts`, OR map the new PDQ detector back to the original `{match:boolean}` shape. |
| **promptshield** | No agent output. | Plan only | Expand Stage 1 dicts to ≥50 patterns/category + FP/TP/borderline suites + Stage 2 baseline scorer. v2-execution-plan Wave B. |
| **c2pa-lite** | No agent output. | Plan only | Wire `upstream` feature → `c2pa = "0.85"` (features=["rust_native_crypto"], avoid OpenSSL). v2-execution-plan Wave B. |
| **cybertip-cli** | No agent output. | Plan only | Sandbox simulation path; production errors "counsel sign-off required". v2-execution-plan Wave C. |

SafeMod remains **Deferred indefinitely** (GDPR special-category data).

## ROOT CAUSE: worktree isolation provisioned the WRONG repo

The Wave A hashkit agent's completion notification confirmed it:
`isolation: 'worktree'` cut each agent's worktree from
**`/Users/colin/Code/addiction`** (the Next.js site — the session's *primary*
cwd) instead of **`/Users/colin/Code/fight-csam`** (the Rust workspace,
only an *additional* working dir via `docs/`). Consequences:

- hashkit agent found a website (no Cargo workspace) and correctly refused to
  write Rust into it.
- Smarter agents (hashkit-match, evidencevault, trainguard) detected the
  wrong repo and created their own worktree under
  `fight-csam/.worktrees/`, committing there — which is why their work
  survived and merged.
- Heavy parallel load (10+ agents) degraded the local shell display
  (output corruption, GNU-flag errors triggering parallel-call cancellation
  cascades) and left ~13–23 lingering processes that concurrently mutated the
  main checkout's git HEAD, forcing a `git reset --hard origin/main` recovery.

### Fix for the next fan-out

1. **Run the session with `fight-csam` as the primary cwd**, OR
2. **Orchestrator implements directly on main** (most reliable — how the 4
   shipped tools landed), OR
3. Pre-create dedicated worktrees IN `fight-csam` and pass each agent its
   EXACT absolute path with a hard "cd there every command; never touch the
   addiction repo" rule.
Run fewer agents (one per track, not per package). Avoid `cat -A`/GNU-only
flags on macOS in batched commands (one failure cancels the whole batch).

## Integration recipe (worked for the 4 that landed)

`git merge --no-ff agent/wave-X-<pkg>`. Code auto-merges (agents stay in their
package dir). Only `docs/ops/handoffs/*.md` conflicts (multiple agents append)
— resolve with `git checkout --ours <handoff>` + `git add` + `git commit
--no-edit`.

## Next-session priority order

1. **hashkit** (critical path — unblocks real PDQ for csam-shield/trainguard
   integration). On main directly; mind the no_std gating.
2. **hashstream** (recover/redo + `go mod tidy` + merge).
3. **csam-shield** (reconcile the Verdict refactor).
4. **c2pa-lite** (upstream crate makes it quick).
5. **promptshield** (Stage 1 dictionary expansion).
6. **cybertip-cli** (sandbox path).
Then v0.5 across all 9 active tools → pursue v1.0 (semver freeze, registry
publish, cross-tool integration).
