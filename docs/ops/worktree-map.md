# Worktree Map

This repo uses local git worktrees for release tracks. Worktrees are local-only and ignored by git via `.worktrees/`.

## Canonical Worktrees

| Release Track | Path | Branch | Owner Seat | Packages |
|---|---|---|---|---|
| v0.1 Foundation | `.worktrees/v0.1-foundation` | `codex/release-v0.1-foundation` | Foundation PM | `hashkit`, `hashkit-match`, `detectkit-test` |
| v1 Adoption | `.worktrees/v1-adoption` | `codex/release-v1-adoption` | Adoption PM | `csam-shield`, `promptshield` |
| v1 Legal + Infra | `.worktrees/v1-legal-infra` | `codex/release-v1-legal-infra` | Credentialed Infra PM, Legal/Ops PM | `hashstream`, `trainguard`, `cybertip-cli`, `evidencevault` |
| v2 Hardening | `.worktrees/v2-hardening` | `codex/release-v2-hardening` | Release Captain | all active packages |
| **FightSAM site** | `.worktrees/fightsam-site` | `codex/fightsam-site` | Site PM | `apps/fightsam-site` — **Phase 0 built & committed @ `0db9e70`** (not merged / not deployed) |

> **Extended 2026-06-02.** This table is the package/site track map; the full
> **per-rung worktree split (v0.1 → v2.0)** — single-writer assignments plus the
> new connector worktrees (`connector-bluesky`, `redteam-pack`,
> `connector-osprey`, the `create-fightsam` worktree, and `legal-tier-ga`) — now
> lives in **`docs/ops/v2-release-plan.md` → "Worktree map"**. Create each as its
> rung arrives.
>
> **Stale-branch warning:** the four `codex/release-*` branches above are ~53
> commits behind `main` (they predate the 0.1.0 rename, the GTM docs, and the
> site work). **Rebase onto `main` before resuming work in them**, or recreate
> them from current `main`. The `fightsam-site` worktree was cut from current
> `main` and is current.

## Creation Commands

Run these from the repository root after confirming `.worktrees/` is ignored:

```bash
git worktree add .worktrees/v0.1-foundation -b codex/release-v0.1-foundation
git worktree add .worktrees/v1-adoption -b codex/release-v1-adoption
git worktree add .worktrees/v1-legal-infra -b codex/release-v1-legal-infra
git worktree add .worktrees/v2-hardening -b codex/release-v2-hardening
```

If a branch already exists, use:

```bash
git worktree add .worktrees/<track> <branch>
```

## Setup Commands Per Worktree

Run only the commands relevant to the packages being touched:

```bash
cargo test --workspace --all-features
bash scripts/safety-check.sh
```

```bash
cd packages/detectkit-test && pip install -e ".[dev]" && pytest -q
cd packages/promptshield && pip install -e ".[dev]" && pytest -q
cd packages/trainguard && pip install -e ".[dev]" && pytest -q
```

```bash
cd packages/csam-shield/node && npm install && npm test
cd packages/cybertip-cli/node && npm install && npm test
cd packages/hashstream && go test ./...
cd packages/evidencevault && go test ./...
```

## Handoff Protocol

Every worktree should contain a short local note before stopping work:

```text
Track:
Branch:
Packages touched:
Tests run:
Safety guard run:
Known blockers:
Next concrete step:
```

Keep that note in `docs/ops/handoffs/<track>.md` if it should be committed. Keep private credential or outreach state outside git.

