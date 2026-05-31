# PM Council Notes

These notes summarize the read-only PM council pass from 2026-05-30. Treat package-local `STATUS` files and actual package trees as the current implementation truth; `docs/roadmap.md` currently lags several packages.

## Shared Findings

- Safety guard passed in at least one read-only PM pass.
- Several package scaffolds are ahead of `docs/roadmap.md`.
- Python test execution may need environment setup because the system Python may lack `pytest`.
- `cargo` may not be on every agent PATH; use the workspace/bundled toolchain if needed.
- Main checkout contains untracked package work that is not present in release worktrees created from committed `HEAD`.
- TrainGuard has a release-blocking license mismatch to resolve: README says AGPL-3.0 while `pyproject.toml` says Apache-2.0.

## Foundation PM

Scope: `hashkit`, `hashkit-match`, `detectkit-test`.

Recommended branch fan-out:

- `codex/foundation-v0.1-hashkit-pdq`
- `codex/foundation-v0.1-hashkit-match`
- `codex/foundation-v0.1-detectkit-fixtures`
- `codex/foundation-v0.1-release`
- `codex/foundation-v1-wasm-bindings`
- `codex/foundation-v1-conformance-suite`
- `codex/foundation-v1-release-hardening`
- `codex/foundation-v2-tmk-video`
- `codex/foundation-v2-downstream-contracts`
- `codex/foundation-v2-release-governance`

v0.1 gates:

- Implement `hashkit` PDQ hashing and dihedral output against benign synthetic vectors.
- Populate `packages/hashkit/vectors/v0/corpus.json`.
- Implement `hashkit-match` query behavior with naive-scan parity tests.
- Implement `detectkit-test` deterministic synthetic image generation and corpus verification.

v1/v2 gates:

- Native/WASM parity, reproducible corpus drift checks, MIH performance at 10k+ hashes.
- TMK+PDQF and synthetic video fixture path for v2.

## Adoption PM

Scope: `csam-shield`, `promptshield`.

Recommended branch fan-out:

- `codex/wave2-v0.1-preview`
- `codex/wave2-v1-alpha-adoption`
- `codex/wave2-v2-runtime-hardening`

v0.1 gates:

- CSAM-Shield Node and Python packages install and test with mocks only.
- Express/Fastify/Hono adapters and Python core share a unified `MatchResponse`.
- PromptShield exposes deterministic `guard()` and CLI behavior with safe, content-free tests.

v1/v2 gates:

- One real low-friction provider path or sandbox-backed adapter behind environment-only config.
- PromptShield eval suite and published precision/recall/FPR report.
- Runtime hardening: retry/circuit breaker behavior, queue-backed pending flow, signed audit event schema, pilot deployment evidence.

## Credentialed Infrastructure PM

Scope: `hashstream`, `trainguard`.

Recommended branch fan-out:

- `codex/hashstream-v0.1-alpha`
- `codex/trainguard-v0.1-alpha`
- `codex/wave3-v0.1-docs-alignment`
- `codex/hashstream-v1-stable`
- `codex/trainguard-v1-stable`
- `codex/wave3-v1-release-readiness`
- `codex/hashstream-v2-hosted-plane`
- `codex/trainguard-v2-enterprise-gate`
- `codex/wave3-v2-credentialed-program`

v0.1 gates:

- HashStream persistent snapshot model, deterministic diffing, signed snapshot metadata, Docker Compose dev stack, SDK parity.
- TrainGuard production-shaped CLI over JSONL plus metadata readers, HashStream provider client, deterministic JSON report, CI wrapper.
- Resolve TrainGuard license mismatch before release.

v1/v2 gates:

- Credentialed adapters validated only in approved partner/sandbox environments.
- Hash-chained audit log, authn/authz, webhook signatures, signed compliance artifacts, scalable matching.
- Tenant isolation, key rotation, freshness SLAs, and VPC-friendly training gate for v2.

## Legal/Ops PM

Scope: `cybertip-cli`, `evidencevault`.

Recommended branch fan-out:

- `codex/v0.1-legal-ops-alpha`
- `codex/v0.1-cybertip-dry-run`
- `codex/v0.1-evidencevault-custody`
- `codex/v0.1-roadmap-sync`
- `codex/v1-counsel-signoff`
- `codex/v1-cybertip-production-path`
- `codex/v1-evidencevault-kms-objectlock`
- `codex/v1-pilot-hardening`
- `codex/v2-jurisdiction-policy-packs`
- `codex/v2-cybertip-conformance`
- `codex/v2-evidencevault-audit-reports`
- `codex/v2-stable-release`

v0.1 gates:

- CyberTip CLI validates report shape and generates dry-run payloads only.
- EvidenceVault provides custody log, retention state, in-memory vault, hold/delete flows.
- Docs clearly state no legal advice and no production submission/retention claim.

v1/v2 gates:

- Counsel-approved production path, explicit `--production`, operator affirmation, secret-only credentials, idempotent retry/WAL, append-only audit log.
- KMS/Object Lock backend, access-purpose attestations, dual-control deletion, exportable custody bundle.
- Jurisdiction policy packs require counsel review per release.

## Immediate Council Decision

Do not start package feature work inside release worktrees until one of these happens:

1. The current untracked main-checkout package implementations are reviewed and committed as a baseline.
2. The current untracked implementations are intentionally split into release worktrees by package ownership.
3. The council decides to discard the untracked implementations and rebuild from committed `HEAD`.

Option 1 is the default recommendation because it preserves the most work and gives all worktrees the same starting point.

