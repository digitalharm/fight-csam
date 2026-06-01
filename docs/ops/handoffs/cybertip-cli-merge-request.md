# Merge request: cybertip-cli v0.5 — for the Release Captain (2026-05-31)

A single branch is ready to integrate into `main`. It closes the last v0.5 gap
(`cybertip-cli`), which `docs/ops/handoffs/session-2026-05-30-v05-final.md` lists as
"In Progress (Wave 4) — the one honest gap." Paste the section below to the Release
Captain, or follow it directly.

---

You are the Release Captain for digitalharm-oss
(`/Users/colin/Code/digitalharm-oss`, origin `github.com/digitalharm/digitalharm-oss`).
Please integrate one branch into `main`.

## The branch

- **Name:** `feat/cybertip-cli-v05-sandbox`  (commit `8297705`)
- **On `origin` and local.** It is **not** an `agent/wave-*` branch, so the usual
  `gh api repos/digitalharm/digitalharm-oss/branches | grep agent/wave-` discovery
  will not list it. Fetch it explicitly:
  `git fetch origin feat/cybertip-cli-v05-sandbox`.
  (PR, if you prefer that flow: https://github.com/digitalharm/digitalharm-oss/pull/new/feat/cybertip-cli-v05-sandbox)
- Exactly one commit ahead of `main` (merge-base == `main` at the time of writing,
  `fb5ec4e`).

## What it is

`cybertip-cli` v0.5: the sandbox-simulation + production-blocked submit path, in both
the Node and Python packages. It re-applies the design reverted in `f1a2f53` — that
revert happened because a two-writer race during a parallel push committed the v0.5
*tests* without the matching *source*. This branch lands source + tests together, in
isolation. Background: commit `db6430b` (original attempt) and the "cybertip-cli — the
one honest gap" note in `docs/ops/handoffs/session-2026-05-30-v05-final.md`.

## Already verified on the branch (re-run if you like)

- Node:   `npm test` → **15/15 pass**; `tsc --noEmit` clean
- Python: `ruff check src` clean; `pytest -q` → **16/16 pass**
- `bash scripts/safety-check.sh --staged` → clean
- Clean merge: `main` has not touched `packages/cybertip-cli` since the branch point;
  `merge-tree` shows **0 conflicts**.

## Merge procedure (per `docs/ops/release-captain-playbook.md`)

1. **Single-writer check (this is exactly what corrupted the last attempt):** make
   sure no other agent or worktree is writing to `main` right now. Record
   `git rev-parse main` before you start and confirm it is unchanged immediately
   before you push.
2. From the repo root, on `main`:
   ```bash
   git fetch origin
   git merge --no-ff origin/feat/cybertip-cli-v05-sandbox
   ```
   (No conflicts expected; `cybertip-cli` is package-scoped.)
3. Re-run the package checks before pushing:
   ```bash
   (cd packages/cybertip-cli/node && npm test)
   (cd packages/cybertip-cli/python && pip install -e ".[dev]" && ruff check src && pytest -q)
   bash scripts/safety-check.sh
   ```
4. Push and watch CI (Node + Python matrices). Fix forward if red:
   ```bash
   git push origin main
   ```

## Post-merge bookkeeping

- `packages/cybertip-cli/STATUS` is already updated to v0.5 in the branch.
- Update `docs/ops/handoffs/session-2026-05-30-v05-final.md`: flip the `cybertip-cli`
  row from "In Progress (Wave 4)" to "v0.5", and revise the "one honest gap" note and
  the "9/10" headline — with this merge, all active tools are at v0.5+ (SafeMod stays
  deferred by design).
- Delete the branch after merge:
  `git branch -d feat/cybertip-cli-v05-sandbox && git push origin --delete feat/cybertip-cli-v05-sandbox`.

## Acceptance

`main` carries commit `8297705`'s changes, CI is green on both Node and Python
matrices, and `v05-final.md` reflects `cybertip-cli` at v0.5.
