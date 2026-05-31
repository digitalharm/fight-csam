# v2 Execution Plan

Living document. Last refreshed: 2026-05-30. Any agent or human picking
this up: read this top-to-bottom before touching code, and update the
Status table at the bottom when you ship.

## Why this exists

The maintainer goal — *"build out all of the OSS projects necessary for AI
startups, cloud providers, and developers to detect, block, report, and
prevent CSAM"* — cannot be met with scaffold-stage tools. The Stop hook is
correct to push back on scaffolds-with-stubs. This plan operationalizes the
path from In Progress → Alpha → Beta → v1.0 → v2.0 across all eight active
tools, with explicit ownership, dependency ordering, and handoff format so
multiple agents can work in parallel without stepping on each other.

This plan operates on top of three preexisting documents that should not be
duplicated here:

- [`docs/ops/v2-release-program.md`](./v2-release-program.md) — the release
  ladder and per-track v0.1 / v1.0 / v2.0 criteria.
- [`docs/ops/release-council.md`](./release-council.md) — council seats,
  safety contract, release tracks, decision rules.
- [`docs/ops/worktree-map.md`](./worktree-map.md) — canonical worktree
  paths + branch names + creation commands.

If anything below contradicts those documents, those documents win and
this plan is wrong — open an issue.

## Coordination rules (binding for every agent)

1. **Stay in your assigned package/doc boundary.** Edit only files under
   `packages/<your-package>/` for implementation work, or under
   `docs/ops/handoffs/<your-track>.md` for handoffs.
2. **Do not edit another agent's area.** Cross-track dependencies go in
   your handoff doc, not in their files.
3. **Before finalizing, run `git status --short`** and list every file you
   changed in your handoff doc.
4. **Commit to your assigned release-track branch.** Do not commit
   directly to main. The Release Captain (or human maintainer) handles
   integration.
5. **Run the safety guard before pushing**: `bash scripts/safety-check.sh`
   from the worktree root.
6. **No real CSAM hashes, no real credentials, no enterprise-only API
   keys.** Synthetic fixtures only (use detectkit-test).

## Goal mapping: what "built out" means per tool

This is the operational definition the Stop hook can reasonably accept.
Each row is the minimum bar; agents who can ship more should.

| Tool | "Built out" means | Acceptance test (developer's POV) |
|---|---|---|
| HashKit | `hash_from_luma` returns a real PDQ hash byte-identical to the upstream pdqhash crate on identical input | `cargo test --workspace --all-features` passes; a tiny demo script hashes a 256×256 luma buffer and prints the 64-hex hash |
| hashkit-match | `PdqMatcher::query` returns the closest within-threshold match on a 1,000-hash set, matching naive linear-scan ground truth | demo: build matcher over 1,000 synthetic hashes; query for a known-near hash; get the expected result |
| DetectKit-Test | `generate_image(identifier, seed, pattern)` produces deterministic PNG bytes for ≥3 patterns | demo: same inputs → identical SHA-256 outputs; produces a small corpus + manifest |
| CSAM-Shield | Default detector wires hashkit's PDQ end-to-end against an operator-supplied hash list (no credential needed) | demo: middleware blocks a synthetic image matching a hash in the list, allows one that doesn't |
| PromptShield | Stage 1 pattern matcher ships ≥50 minor-indicator + ≥50 sexual-context patterns with documented FP/FN behaviour; Stage 2 has a small ONNX-or-equivalent baseline | demo: classify 20 known CSAM-intent prompts (block), 20 benign (allow), 20 borderline (review) — log scores |
| HashStream | Operator-supplied hash file ingestion via POST works end-to-end; existing endpoints serve real data | demo: POST a hash file; GET /snapshots/local; diff two snapshots |
| TrainGuard | `scan_dataset` works against an operator-supplied hash file and produces a real ComplianceReport with signed metadata | demo: scan a 100-image LAION-format manifest against a hash list; produce a report |
| CyberTip CLI | Documented NCMEC sandbox submission path works in dry-run; production path stays blocked at the CLI with a clear error | demo: `cybertip submit --sandbox dry-run report.json` produces the wire payload and prints submission result |
| EvidenceVault | HTTP API surfaces vault operations; disk persistence backend works alongside in-memory | demo: `evidencevaultd serve` + curl through Store / Get / PlaceHold / Delete |
| C2PA-Lite | `upstream` feature wires `sign_image` to c2pa-rs; produces a real C2PA manifest on a test PNG | demo: sign a PNG; verify with the official c2patool |

Wave-5 SafeMod stays **Deferred indefinitely** unless a co-maintainer with
HIPAA/GDPR-special-category experience joins. Not in scope for this plan.

## Dependency order

```
hashkit  ─────────────┐
                      │
hashkit-match  ───────┤
                      ├──> csam-shield (PDQ path)
detectkit-test ───────┤
                      ├──> trainguard (real screening)
                      │
                      └──> hashstream (real hash diffs)

independent satellites (can ship in parallel):
- promptshield
- c2pa-lite
- cybertip-cli (counsel-blocked at CLI)
- evidencevault (counsel-blocked at retention enforcement)
```

## Wave plan

### Wave A — Foundation (blocks all PDQ-dependent work)

Track: `codex/release-v0.1-foundation` · Worktree:
`.worktrees/v0.1-foundation`. Owner: Foundation PM.

| Task | Acceptance | Handoff slot |
|---|---|---|
| Wire `hashkit::hash_from_luma` via the `pdqhash` Apache-2.0 crate | Returns a `PdqResult` with byte-identical hash to upstream `generate_pdq` on the same luma | `docs/ops/handoffs/v0.1-foundation.md` § hashkit |
| Implement `hashkit::hash_dihedral_from_luma` (wrap luma in image, rotate/flip 8 ways, hash each) | Returns 8 `PdqResult`s; tests show distinct hashes per dihedral | same § |
| Implement `hashkit_match::PdqMatcher::query` and `query_all` (naive linear scan is acceptable for v1.0; MIH is v2.0 hardening) | Matches ground-truth on 1,000-hash corpus over 100 random queries | same § hashkit-match |
| Implement `detectkit_test.fixtures.generate_image` for ≥3 patterns | Same `(id,seed,pattern)` → byte-identical PNG output | same § detectkit-test |

### Wave B — Adoption (run after Wave A or in parallel for non-PDQ work)

Track: `codex/release-v1-adoption` · Worktree: `.worktrees/v1-adoption`.
Owner: Adoption PM.

| Task | Acceptance | Handoff slot |
|---|---|---|
| CSAM-Shield: PDQ detector wired to hashkit + hashkit-match | Middleware blocks an image whose hash is in the operator-supplied list | `docs/ops/handoffs/v1-adoption.md` § csam-shield |
| CSAM-Shield: retry/timeout/policy in middleware adapters | Express, Fastify, Hono adapter tests | same § |
| PromptShield: expand Stage 1 dictionaries to ≥50 patterns per category, with FP test suite | Test suite passes; documented per-pattern reasoning | same § promptshield |
| PromptShield: Stage 2 baseline (ONNX runtime + small fine-tuned model) | Smoke test that loads the model and scores 5 prompts | same § |

### Wave C — Credentialed Infrastructure + Legal/Ops (parallel with B)

Track: `codex/release-v1-legal-infra` · Worktree:
`.worktrees/v1-legal-infra`. Owners: Credentialed Infra PM + Legal/Ops PM.

| Task | Acceptance | Handoff slot |
|---|---|---|
| HashStream: operator-supplied hash file ingestion via POST endpoint | POST → store → GET serves correct snapshot | `docs/ops/handoffs/v1-legal-infra.md` § hashstream |
| HashStream: signed snapshot manifests (Ed25519, operator-supplied key) | Snapshot has signature; verify endpoint returns true/false | same § |
| TrainGuard: real LAION-format JSON manifest reader | Reads a small synthetic LAION JSON and yields image refs | same § trainguard |
| TrainGuard: end-to-end scan against a hash list, produces compliance report with custody | Report has all chain-of-custody fields signed | same § |
| CyberTip CLI: documented NCMEC sandbox endpoint submission path | `cybertip submit --sandbox` validates + submits to sandbox; production path errors with "counsel sign-off required" | same § cybertip-cli |
| EvidenceVault: wire HTTP API to vault operations | `evidencevaultd serve` accepts curl through full lifecycle | same § evidencevault |
| EvidenceVault: disk persistence backend | `--store=disk:/tmp/x` persists across restart | same § |

### Wave D — Satellites (parallel with B and C, no blocking deps)

Same `v1-adoption` worktree (no separate track; commits to the adoption
branch as a satellite). Owner: Adoption PM.

| Task | Acceptance | Handoff slot |
|---|---|---|
| C2PA-Lite: `upstream` feature wires `sign_image` to `c2pa` crate | Under `--features upstream`, signing produces a valid C2PA manifest verifiable by `c2patool` | `docs/ops/handoffs/v1-adoption.md` § c2pa-lite |

### Wave E — v2 Hardening (run after waves A–D land on main)

Track: `codex/release-v2-hardening` · Worktree:
`.worktrees/v2-hardening`. Owner: Release Captain.

| Task | Acceptance | Handoff slot |
|---|---|---|
| Signed release artifacts (Sigstore / cosign) | CI pipeline signs published artifacts | `docs/ops/handoffs/v2-hardening.md` § signing |
| Audit log standardization across all tools | Common audit-log shape; one writer impl | same § |
| Deployment guides per tool | `docs/deploy/<tool>.md` for each shipped tool | same § |
| Corpus drift checks mandatory in CI | CI fails on any corpus mismatch | same § |
| Cross-platform conformance (macOS, Linux, Windows) | CI runs on all three for the Rust core | same § |

## Cadence (per release-council.md)

- **30-second tick during active work**: refresh the handoff doc's
  "current state" line. Costs nothing; keeps the next picker-upper from
  guessing.
- **End of each package milestone**: update STATUS, package README,
  `docs/roadmap.md`. (`docs/roadmap.md` is the integration-time
  responsibility of the Release Captain; do not edit it inside your
  worktree — note your status changes in the handoff instead.)
- **End of each release track**: run `bash scripts/safety-check.sh` and
  the per-package tests listed in `docs/ops/worktree-map.md`.

## Status table

Update this every time you ship something. New rows go at the bottom.

| Date | Track | Package | Change | Pushed | Notes |
|---|---|---|---|---|---|
| 2026-05-30 | — | (portfolio) | Scaffold landings + roadmap sync + /tools page derived callout | yes (main `f5c2f49`) | See changelog in `docs/roadmap.md`. |
| 2026-05-30 | v2-hardening | (track baseline) | Pre-merge baseline commit `e529e26` carrying prior orchestration work (expanded ci.yml, safety-check.sh, README/safety-policy improvements) | no (branch only) | Branch needs merge with current main; ci.yml will conflict — Release Captain to integrate. |
