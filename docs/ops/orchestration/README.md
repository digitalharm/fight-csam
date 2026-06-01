# Orchestration runbook — wave-impl workflows

This directory holds the **corrected** multi-agent orchestration for the v0.5+
release waves — the runnable fix for the worktree mis-dispatch bug. The full
root-cause writeup lives in
[`../handoffs/session-2026-05-30-v05-results.md`](../handoffs/session-2026-05-30-v05-results.md).

- [`tracks.config.json`](tracks.config.json) — the track → repo-root map (source of truth).
- [`scripts/wave-a-foundation-impl.js`](scripts/wave-a-foundation-impl.js) — corrected Wave A workflow.
- [`scripts/wave-b-adoption-impl.js`](scripts/wave-b-adoption-impl.js) — corrected Wave B workflow (reference implementation of the pattern).
- [`scripts/wave-c-legal-infra-impl.js`](scripts/wave-c-legal-infra-impl.js) — corrected Wave C workflow (safe to re-run after the killed original).

## The bug (summary)

`isolation: 'worktree'` cuts each agent's worktree from the **session's launch CWD**,
and there is **no per-call repo override** in `agent()` (options are `label / phase /
schema / model / isolation / agentType`). The orchestration session ran from
`/Users/colin/Code/addiction`, so all 10 Wave A/B/C impl agents got a worktree of the
wrong repo (`addiction-research` — no Rust workspace, no `packages/`). Shipped work is
preserved on `digitalharm-oss` origin.

Full root-cause writeup (consequences, per-agent outcomes, recovery) —
[`../handoffs/session-2026-05-30-v05-results.md`](../handoffs/session-2026-05-30-v05-results.md)
→ "ROOT CAUSE: worktree isolation provisioned the WRONG repo".

## The fix

### Layer 1 — binding launch rule (root cause)

> **Wave-impl workflows MUST be launched from a Claude session whose CWD is
> `/Users/colin/Code/digitalharm-oss`.**

`isolation:'worktree'` follows the session's repo, so this rule alone fixes the bug.
Verify before launching:

```bash
git -C "$PWD" rev-parse --show-toplevel        # => /Users/colin/Code/digitalharm-oss
git -C "$PWD" remote get-url origin            # => …digitalharm/digitalharm-oss…
```

### Layers 2–4 — make it correct regardless of session CWD (defense in depth)

The corrected scripts do **not** rely on the launch CWD or on `isolation:'worktree'`:

2. **Explicit config** — repo root, remote slug, base branch, worktree dir, and
   marker files come from [`tracks.config.json`](tracks.config.json), copied into
   each script as constants (workflow scripts can't read files at runtime).
3. **Preflight abort gate** — a phase-0 agent asserts `git remote get-url origin`
   contains `digitalharm/digitalharm-oss` **and** that `Cargo.toml` + `packages/`
   exist under the discovered repo root. If not, it returns `ok:false` and the
   script **returns early — zero impl agents are spawned.** (This single gate would
   have caught the addiction mis-target at second 0.) Identity is checked by
   **remote slug + marker files**, not by hardcoded-path equality, so a checkout at
   a different absolute path still works (it fails *closed* if the repo is wrong).
4. **Explicit, idempotent provisioning** — the same preflight agent creates one
   worktree per package via `git -C <root> worktree add` and returns each absolute
   path. The impl agents run **without** `isolation:'worktree'`; each is handed its
   path and told to `cd` there. Provisioning detects a branch already attached to
   *any* worktree (via `git worktree list --porcelain`) and **reuses** it — so
   re-runs and the older `.worktrees/<pkg>` naming don't collide.

## How to run

From a `digitalharm-oss` session (Layer 1):

```
Workflow({ scriptPath: "docs/ops/orchestration/scripts/wave-b-adoption-impl.js" })
```

If preflight aborts, the result is `{ aborted: true, reason }` and nothing is
dispatched — fix the launch context (or the repo) and re-run. Re-runs are safe:
existing branches/worktrees are reused, not recreated.

## Waves A, B, C

All three waves now have corrected scripts in `scripts/` — same pattern, only the
track constants differ (mirrored from [`tracks.config.json`](tracks.config.json)):

| script | branch prefix | packages |
|---|---|---|
| `scripts/wave-a-foundation-impl.js` | `agent/wave-a-` | hashkit, hashkit-match, detectkit-test |
| `scripts/wave-b-adoption-impl.js` | `agent/wave-b-` | csam-shield, promptshield, c2pa-lite |
| `scripts/wave-c-legal-infra-impl.js` | `agent/wave-c-` | hashstream, trainguard, cybertip-cli, evidencevault |

**Status (2026-05-30):** the v0.5 wave program has **shipped** — `main` is at the
session-close handoff with 9/10 tools at v0.5+ (see
[`../handoffs/session-2026-05-30-v05-final.md`](../handoffs/session-2026-05-30-v05-final.md)),
and all `agent/wave-*` branches/worktrees have been merged and cleaned up. So these
scripts are now the **repo-safe pattern** for the next fan-out (v1.0+), not a pending
re-run: with no leftover branches, the preflight creates each worktree fresh from
`origin/main` (which already contains the shipped v0.5 work). The idempotent reuse
path only kicks in for an interrupted re-run. **The one honest v0.5 gap is
`cybertip-cli`** (reverted to its scaffold after a concurrent-push race); the Wave C
script covers it, though a single-package dispatch is lighter. Adapt the `PKG_TASKS`
prompts to the next milestone before re-running an already-shipped wave.

## Deprecated scripts (do not run)

The original session-artifact scripts still on disk under
`~/.claude/projects/-Users-colin-Code-addiction/35598985-…/workflows/scripts/`
(`wave-{a,b,c}-*-impl-*.js`) still carry `isolation:'worktree'` and **no** preflight.
They have been given a fail-closed deprecation guard, but treat them as removed —
always launch from the corrected scripts here.
