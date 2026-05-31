# v2 Council Decision

Output of the PM Council convened 2026-05-30. Four PM seats (Foundation,
Adoption, Credentialed Infra, Legal/Ops) each proposed a v0.5/v1.0/v2.0
plan; this document is the synthesized master sequence.

Source proposals are archived in the workflow transcript
(`wf_513eff87-5db`). The synthesizer agent's structured output failed
schema validation on return, so the Release Captain (orchestrator)
synthesized directly from the four complete proposals — which were all
intact and mutually consistent.

## Executive summary

The four PM proposals converge on one structural fact: **Foundation owns
the contracts the rest of the portfolio consumes** — the PDQ hash byte
encoding, the `PdqHash`/`PdqResult` API, and the matcher result schema
(`MatchResponse`). Every downstream tool that touches hashes (CSAM-Shield,
HashStream, TrainGuard, and even EvidenceVault's content-addressing and
CyberTip's hash references) needs those contracts stable. So the single
highest-leverage move is to land Foundation's real implementation and
freeze its public surface under semver before downstream tools harden to
v1.0.

The second convergent fact: **nothing required for v0.5 or v1.0 depends
on external credentials or counsel.** Every tool has a credential-free
path to v0.5 — operator-supplied hash lists instead of NCMEC feeds,
sandbox/dry-run instead of production submission, noop-KMS instead of real
envelope encryption. NCMEC ESP credentials and outside counsel are
**Beta/v2 hardening blockers only**, gated behind the Lantern outreach.
This means the entire portfolio can reach v0.5 this session.

## Critical path

```
hashkit (real PDQ via pdqhash crate)
   │  freezes: PdqHash byte encoding, PdqResult API
   ▼
hashkit-match (naive linear scan; freezes MatchResponse schema)
   │
   ▼
csam-shield PDQ detector ─┐
trainguard real screening ─┤  all consume the frozen hash + match contracts
hashstream hash diffs ─────┘
```

The longest chain to v2.0 runs: hashkit real PDQ → hashkit-match MIH
(v2 perf) → cross-platform conformance matrix (macOS/Linux/Windows + WASM
byte-identical) → signed release artifacts. That chain determines
minimum wall-clock to a hardened v2.0 and is almost entirely Foundation
work, which is why Foundation gets depth-first priority.

## Wave order

| Wave | Name | Packages | Parallelism | Rationale |
|---|---|---|---|---|
| A | Foundation | hashkit, hashkit-match, detectkit-test | **Blocks downstream v1.0** (but v0.5 of downstream can proceed against operator-supplied inputs) | Owns the hash + match contracts everything consumes |
| B | Adoption + satellites | csam-shield, promptshield, c2pa-lite | Parallel with A and C | PromptShield + C2PA-Lite have zero Foundation dep; CSAM-Shield ships v0.5 against operator-supplied hash lists, swaps to hashkit wrapper post-merge |
| C | Credentialed + Legal | hashstream, trainguard, cybertip-cli, evidencevault | Parallel with A and B | All have credential-free v0.5 paths (operator lists, sandbox, noop-KMS) |
| E | v2 Hardening | all active | After A–C land on main | Signing, audit standardization, cross-platform conformance, deployment guides |

(There is no separate Wave D — C2PA-Lite, the lone satellite, folded into
Wave B since the c2pa upstream crate makes it credential-free.)

## Parallelizable track sets

- **{Foundation, Adoption-satellites (PromptShield, C2PA-Lite), Legal/Ops}**
  can all run simultaneously — no shared files, no blocking deps.
- **CSAM-Shield, HashStream, TrainGuard** can start in parallel too,
  building against operator-supplied inputs; they gain a thin hashkit
  convenience wrapper after Foundation merges.

## Consolidated v0.5 targets (the "built out" bar for this session)

| Tool | v0.5 deliverable | Credential-free? |
|---|---|---|
| hashkit | Real PDQ via pdqhash crate; hash_from_luma + 8-way dihedral; demo prints 64-hex hash | ✓ |
| hashkit-match | Naive query/query_all matching ground truth on 1,000-hash corpus | ✓ |
| detectkit-test | Deterministic generate_image for ≥3 patterns; byte-identical output | ✓ |
| csam-shield | PDQ-list detector + retry/timeout/policy across Express/Fastify/Hono | ✓ (operator-supplied list) |
| promptshield | Stage 1 ≥50 patterns/category + FP suite + Stage 2 baseline scorer | ✓ |
| c2pa-lite | `upstream` feature signs via c2pa-rs; real manifest | ✓ |
| hashstream | Operator hash-file ingestion + Ed25519 signed snapshots | ✓ (operator-supplied list) |
| trainguard | LAION reader + file-backed provider + signed compliance report | ✓ (operator-supplied list) |
| cybertip-cli | Sandbox simulation path; production blocked at CLI | ✓ (dry-run/sandbox) |
| evidencevault | HTTP API + disk persistence; retention queryable not enforced | ✓ (noop-KMS) |

## Consolidated v1.0 targets (next session)

- Foundation: native↔WASM byte-identical reproducibility in CI; freeze
  PDQ + matcher APIs under semver; publish 0.1.0 to crates.io/npm/PyPI;
  versioned corpus consumed by downstream tests.
- Adoption: documented adapter examples; CSAM-Shield consumes HashStream
  snapshots; PromptShield adapter tests without model downloads.
- Credentialed: signed snapshots for fake providers; TrainGuard consumes
  HashStream snapshots; all credentialed providers interface-gated +
  skipped in default CI.
- Legal/Ops: counsel-reviewed scope brief incorporated; evidence packages
  content-addressed + redacted by default; production paths
  credential-gated + disabled in tests.

## Consolidated v2.0 targets (later sessions)

- Signed release artifacts (Sigstore/cosign) across all tools.
- hashkit-match real MIH outperforming linear scan at ≥10,000-hash sets.
- Cross-platform conformance matrix (macOS/Linux/Windows + WASM) with
  mandatory corpus-drift gates.
- Operator deployment guides + audit-log standardization per tool.
- Outside counsel sign-off recorded as a release gate for legal-tier tools.

## Unresolved decisions for the human maintainer

1. **MatchResponse schema ownership.** Foundation, Adoption, and
   Credentialed Infra all want a shared match-result vocabulary, but no
   single PM owns it. *Council recommendation:* Foundation defines
   `MatchResponse` in hashkit-match as the canonical schema; downstream
   tools import/mirror it. Confirm before v1.0 API freeze.

2. **Public distribution of the synthetic corpus.** Foundation PM flagged
   that detectkit-test's synthetic corpus + derived PDQ vectors are the
   public conformance artifact, and wants counsel/captain sign-off that
   publishing synthetic-only fixtures raises no concern. *Council
   recommendation:* low risk (synthetic non-CSAM by construction +
   safety-guard enforced), but get explicit sign-off before tagging
   releases.

3. **Registry naming.** Adoption PM needs confirmation the install
   commands on the /tools page match published names (`@digitalharm/
   csam-shield`, `promptshield`, `c2pa-lite`). *Council recommendation:*
   ratify the names already on the /tools page; they're consistent.

## Recommendation for implementation agents

The fan-out agents (Wave A/B/C) should:

1. **Ship the credential-free v0.5 path first.** Do not block on NCMEC,
   counsel, or enterprise APIs — those are explicitly out of scope this
   session.
2. **Consume Foundation's contracts as interfaces, not implementations.**
   If Foundation hasn't merged yet, build against the documented
   `PdqHash`/`MatchResponse` shape and accept a pre-computed hash as
   input; document the swap in your handoff.
3. **Treat cross-track needs as handoff items, never as cross-boundary
   edits.** If you need something from another package, write it in your
   handoff doc — do not edit their files.
4. **Freeze nothing downstream until Foundation freezes upstream.** v0.5
   APIs can move; the v1.0 semver freeze waits on Foundation's contract
   freeze.
