# Handoff — FightCSAM marketing & customer-acquisition program

**Status:** plan of record landed; **zero outbound sent**. Everything here is documentation + ready-to-use drafts. Execution is deliberately gated (see Guardrails).
**Source:** PM-council workflow `gtm-acquisition-council`, run `wf_dbedf3eb-af1` — 6 PM personas → 3 judges → synthesis → 5 artifact lanes (15 agents). Audit trail in `docs/ops/gtm-council-decision.md`.
**Date:** 2026-06-05.

A new agent can pick up cold by reading, in order: this file → `docs/gtm/marketing-acquisition-plan.md` → the pillar artifact you're executing.

---

## What this program is

Make FightCSAM the answer a developer — or their AI coding agent — reaches for when told *"add CSAM safety to my app,"* and earn that position through conformance, restraint, and generosity (credit/contribute first), never reach-at-any-cost. Four pillars: **Users** (DevRel funnel + agent-native wedge), **Contributors**, **Meta-team outreach**, **awesome-safety-tools ecosystem outreach**.

## Deliverables map

| File | Purpose |
|---|---|
| `docs/gtm/marketing-acquisition-plan.md` | **Master plan** — positioning, segments, the 4 pillars, release×workstream matrix, metrics, guardrails, 90-day calendar. Start here. |
| `docs/gtm/ecosystem-outreach-tracker.md` | The 113 profiled projects tiered by verdict for **tasteful, batched** outreach + the anti-spam protocol + do-not-contact list. The actionable core of "use GitHub to reach the projects." |
| `docs/gtm/outreach-templates.md` | Ready-to-send copy: profiled-maintainer notice, the **awesome-safety-tools PR**, partner intros (ROOST/NCMEC/IWF/Tech Coalition), Show HN, dev post, contributor blurb, first-reply. |
| `docs/gtm/meta-outreach.md` | How to get Meta's open-source safety team to look — channel priority (via ROOST first), the conformance-vector credibility hook, message drafts. |
| `docs/gtm/contributor-funnel.md` | Label taxonomy, 12–15 concrete good-first-issues, recognition model, funnel metrics. |
| `docs/gtm/contributor-kit/` | **Staged (inert)** CONTRIBUTING + `.github/` templates — promote per its `README.md` after reconciling with the existing root files. |
| `docs/gtm/launch-sequence.md` | Release-tied marketing calendar v0.1→v2 with per-release "do NOT do yet" lists. |
| `docs/ops/gtm-council-decision.md` | Judge scores, anchor lenses, and the red-flags adopted as guardrails (audit). |

## Guardrails — non-negotiable (all 3 judges, unanimous)

1. **No outbound before `v0.1` publish is verified install-and-run from a clean machine.** A broken `cargo add`/`pip install` on a CSAM tool is worse than silence and burns the one clean shot with ROOST/HN/each ally.
2. **No mass/automated GitHub issue or PR spam.** Human-written only, **≤5/week**, capped to the **24 "use"-verdict allies** + a curated "learn-from" subset, opt-out-respecting, via email/existing threads/Discussions (never cold issues). Lead with a credit or a merged PR, never an ask. Keep a **gitignored** outreach ledger. Do-not-contact: all 13 out-of-scope + the 41 reference-only (many anonymous dataset dumps) + Big-Tech in-house T&S.
3. **Never the word "compliant."** Always *"helps you take defensible, documented steps toward X — consult counsel."* Pair every obligation claim with the counsel disclaimer (safety-policy invariant #4).
4. **Never "beats Meta / beats PDQ" or implied endorsement.** Meta is upstream + our conformance source and co-founded ROOST. hashkit's edge = Rust/WASM portability + NCMEC conformance vectors only. A merged interop PR is the realistic "Meta win"; accept silence gracefully.
5. **No live legal-tier before credentials.** Keep `cybertip-cli` `ProductionSubmitBlocked` and `evidencevault` retention unenforced (stubs VISIBLE, never bypassed) until **both** NCMEC-ESP credentials **and** outside-counsel sign-off land (target v2.0). Highest blast-radius code in the repo.

## Critical path (in order)

1. **[OWNER] Publish all 11 packages at `0.1.0`** in dep order (Rust chain → 5 PyPI → 3 npm `@digitalharm/*` → both Go module tags); enable CI-on-tag. *Gates everything below.*
2. Verify every `install → quickstart` from a clean machine; fix the 3 wrong install strings on the site `/tools` page.
3. Ship the **agent-native baseline** (`/llms.txt`, manifest, `/agents`) + rewrite 11 READMEs (lead with verified install) + register the `csam-safety` skill + set GitHub topics.
4. Open the **awesome-safety-tools PR** (highest-leverage, lowest-risk growth lever — `outreach-templates.md` has the draft).
5. Publish **CONFORMANCE.md** (reproducible PDQ parity) → then begin **gated** ally outreach (tracker tiers) + the Meta conversation.
6. Land the **hepa→Ozone adapter** (Tier-1 Fediverse beachhead — the first reference adopter).

## Owner-gated / to confirm

- NCMEC-ESP credentials + outside-counsel sign-off (legal tier).
- Package-registry publish credentials (npm/PyPI/crates/Go).
- `security@digitalharm.org` / `conduct@digitalharm.org` routing — confirm monitored, or enable GitHub Private Vulnerability Reporting (see `contributor-kit/README.md`) before activating the contributor templates.
- Decide whether to commit/reconcile the **untracked** root `CONTRIBUTING.md` + `.github/` (prior-session WIP) vs. the council's `contributor-kit/` version.

## Corrections to stale assumptions in source docs

- The FightCSAM site is **already merged and live at https://fightcsam.org** (canonical; old `fightsam.com`/`.org` 308-redirect). Source planning docs that say "owner-gated on fightsam.org" or "unmerged `codex/fightsam-site` branch" are out of date.
- The repo `digitalharm/fight-csam` is **public**. Brand is **FightCSAM**; packages keep the **digitalharm** name.
