# Release Council

This document is the standing program board for building the fight-csam portfolio through v2. It lets future agents resume without rediscovering scope, sequencing, safety constraints, or branch layout.

Last updated: 2026-05-30.

## Safety Contract

Every release track must preserve these invariants:

- Do not commit real CSAM imagery, real CSAM hash lists, credentialed upstream lists, or live API credentials.
- Use synthetic, non-CSAM fixtures only. Prefer `packages/detectkit-test` as the shared fixture source.
- Networked or credentialed integrations must default to dry-run, fake, or explicitly skipped test modes.
- Legal/reporting flows must remain blocked from production submission until counsel review and credential approval are complete.
- Logs and evidence packages must avoid raw user content by default; store metadata, hashes, custody events, and operator-supplied references.

## Council Seats

| Seat | Scope | Packages | Primary Gate |
|---|---|---|---|
| Foundation PM | Hashing, matching, synthetic conformance | `hashkit`, `hashkit-match`, `detectkit-test` | Deterministic synthetic corpus and cross-language hash conformance |
| Adoption PM | Drop-in developer adoption | `csam-shield`, `promptshield` | One-command local demos with safe stub detectors/classifiers |
| Credentialed Infra PM | List sync, audit, dataset screening | `hashstream`, `trainguard` | Signed/snapshotted fake-provider flows before real credentials |
| Legal/Ops PM | Reporting, custody, preservation | `cybertip-cli`, `evidencevault` | Counsel-scoped dry run and retention/custody tests |
| Release Captain | Cross-package CI, docs, tags, release notes | all active packages | Green safety guard plus per-package tests |

## Decision Rules

1. Foundation work blocks all downstream v1 claims. If `hashkit`, `hashkit-match`, or `detectkit-test` drift, downstream releases can only be pre-release.
2. v1 means safe local adoption: documented install, dry-run examples, no production credential dependency for tests.
3. v2 means operator hardening: signed artifacts, audit logs, credentialed integration seams, deployment docs, security review checklist.
4. Wave 5 packages remain deferred unless a dedicated owner and funding source are assigned.
5. Status files are the single-line package truth; `docs/roadmap.md` is the portfolio truth and must be refreshed when statuses change.

## Release Tracks

| Track | Worktree | Branch | Goal |
|---|---|---|---|
| v0.1-foundation | `.worktrees/v0.1-foundation` | `codex/release-v0.1-foundation` | Make Wave 1 usable enough for all other CI and fixtures |
| v1-adoption | `.worktrees/v1-adoption` | `codex/release-v1-adoption` | Ship safe developer-facing middleware, classifiers, SDKs, CLIs |
| v1-legal-infra | `.worktrees/v1-legal-infra` | `codex/release-v1-legal-infra` | Ship dry-run legal/ops and fake-provider credentialed infra |
| v2-hardening | `.worktrees/v2-hardening` | `codex/release-v2-hardening` | Security, audit, signed artifacts, deployment, promotion gates |

## Current Repo Reality

The main checkout currently contains significant untracked implementation work in multiple packages. Future workers should not assume the release worktrees contain that code unless it has been committed, cherry-picked, or copied intentionally.

Recommended next move:

1. Run `git status --short` in the main checkout.
2. Review untracked package implementations for safety and ownership.
3. Stage and commit a coherent baseline, or intentionally split it into the release worktrees.
4. Only then start feature implementation inside the release worktrees.

## Council Cadence

- 30-second tick while an agent is actively working: update the current checklist or working notes.
- End of each package milestone: update the package `STATUS`, package README, and `docs/roadmap.md`.
- End of each release track: run the safety guard and all package tests that exist for that track.

