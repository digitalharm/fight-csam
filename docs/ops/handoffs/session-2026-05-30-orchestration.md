# Session handoff: 2026-05-30 — multi-agent v2 orchestration in flight

If you are an agent or human picking this up: the session this came from
spawned four parallel workflows. Read this doc, then check workflow
state, then continue per `docs/ops/release-captain-playbook.md`.

## What was set up

The session ran four foundational documents into the repo:

- `docs/ops/v2-execution-plan.md` — goal mapping, wave ordering, binding
  coordination rules for every agent.
- `docs/ops/release-captain-playbook.md` — integration procedure for
  merging wave branches into main.
- `docs/ops/release-council.md` (pre-existing) — council seats, decision
  rules.
- `docs/ops/v2-release-program.md` (pre-existing) — release ladder.

Plus the four release-track worktrees pre-existed at:

- `.worktrees/v0.1-foundation` on `codex/release-v0.1-foundation` (synced to main `1ae0b41`)
- `.worktrees/v1-adoption` on `codex/release-v1-adoption` (synced to main `1ae0b41`)
- `.worktrees/v1-legal-infra` on `codex/release-v1-legal-infra` (synced to main `1ae0b41`)
- `.worktrees/v2-hardening` on `codex/release-v2-hardening` (has a prior baseline commit `e529e26` ahead of main — needs Release Captain merge integration)

## What's in flight

Four workflows launched at session-start, all running in background:

| Workflow ID | Purpose | Expected output | Branches it creates |
|---|---|---|---|
| `wc78jiztc` | PM Council (Foundation/Adoption/Credentialed/Legal PMs propose v0.5/v1.0/v2.0 wave sequencing; Release Captain synthesizes) | structured synthesis object | none |
| `wukpv58ex` | Wave A Foundation impl | `{results, aggregated}` | `agent/wave-a-hashkit`, `agent/wave-a-hashkit-match`, `agent/wave-a-detectkit-test` |
| `w6cvcfykg` | Wave B Adoption + satellite impl | `{results, aggregated}` | `agent/wave-b-csam-shield`, `agent/wave-b-promptshield`, `agent/wave-b-c2pa-lite` |
| `w657pqtyb` | Wave C Credentialed + Legal impl | `{results, aggregated}` | `agent/wave-c-hashstream`, `agent/wave-c-trainguard`, `agent/wave-c-cybertip-cli`, `agent/wave-c-evidencevault` |

Each implementation workflow runs N agents in worktree-isolated parallel
plus a scribe agent that aggregates handoffs into one
`docs/ops/handoffs/<track>.md` shaped document.

## When workflows return

The Release Captain integration procedure is in
`docs/ops/release-captain-playbook.md`. The summary:

1. Write the aggregated handoff doc to the canonical path.
2. Fetch agent branches; merge in `merge_order` from the aggregated result.
3. Push main; watch CI; fix forward if needed.
4. Update STATUS files + roadmap.md + addiction-research /tools page in a
   separate commit (these are Release Captain territory, agents weren't
   supposed to touch them).
5. Bump the status table at the bottom of `v2-execution-plan.md`.

## Resume rules if a workflow died mid-flight

`gh api repos/digitalharm/digitalharm-oss/branches --paginate --jq '.[].name' | grep agent/wave-`
→ any branch listed means the agent finished and pushed.

For agents whose branches aren't pushed: re-run the workflow with
`resumeFromRunId` from the same session. Completed agents return cached
results; only failed/missing ones re-run.

For cross-session resume (different Claude session entirely): re-launch
the workflow with the same `scriptPath`. It will run all agents fresh —
the cache is per-session. Tolerable since the agents are stateless
implementers.

## Stop-hook acceptance criterion

The maintainer goal is "build out all of the OSS projects necessary for
AI startups, cloud providers, and developers to detect, block, report,
and prevent CSAM."

Operational definition (see v2-execution-plan.md):

- Each of the 8 active tools hits at least **v0.5** with a real implementation
  behind the public API, happy-path tests passing, and a demo path that
  works without external credentials.
- After v0.5 across the portfolio, the Stop hook should accept the goal
  as met for this session.
- v1.0 and v2.0 work continues in subsequent sessions.

## Coordination rule (binding, repeated for safety)

> Stay inside your assigned package/doc boundaries. Before finalizing,
> run `git status --short` and list every file you changed. If you
> discover a cross-track dependency, document it in your handoff
> instead of editing another agent's area.

Agents in the spawned workflows have this in their system prompts. The
Release Captain handles cross-track integration.

## Where to read next

1. `docs/ops/v2-execution-plan.md` — the master plan.
2. `docs/ops/release-captain-playbook.md` — how to integrate.
3. `docs/ops/v2-release-program.md` — release ladder (pre-existing).
4. `docs/ops/release-council.md` — council seats + decision rules (pre-existing).
