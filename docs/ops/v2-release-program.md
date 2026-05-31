# v2 Release Program

The portfolio goal is to give AI startups, cloud providers, and developers a safe open-source path to detect, block, report, and prevent CSAM without shipping illegal material, private hash lists, or credentials in the repo.

## Release Ladder

| Version | Promise | Required Before Tagging |
|---|---|---|
| v0.1 | Developer-preview package surfaces exist and local tests pass | Safe scaffolds, synthetic fixtures, no production credential dependency |
| v0.5 | Alpha workflows are usable in dry-run mode | Package docs, examples, fake providers, failure-mode tests |
| v1.0 | Safe production integration surface | Stable APIs, semver, CI coverage, security checklist, documented operator responsibilities |
| v2.0 | Hardened operator platform | Signed snapshots/artifacts, audit logs, deployment guides, credentialed integration validation where legally possible |

## Track A: Foundation

Packages: `hashkit`, `hashkit-match`, `detectkit-test`.

v0.1:

- `hashkit` exposes stable Rust types for PDQ-like hashes and quality metadata.
- `hashkit-match` includes a naive matcher and a tested threshold contract.
- `detectkit-test` generates deterministic synthetic non-CSAM images and fixture manifests.

v1.0:

- Hash outputs are reproducible across native and WASM builds.
- Synthetic corpus is versioned and used by downstream package tests.
- Match behavior is validated against linear-scan ground truth.

v2.0:

- Release artifacts are signed.
- Corpus drift checks are mandatory in CI.
- External contributors can reproduce conformance on macOS, Linux, and Windows.

## Track B: Adoption

Packages: `csam-shield`, `promptshield`.

v0.1:

- Node and Python middleware shapes compile and test with safe fake detectors.
- Prompt classifier returns deterministic allow/block/review decisions using explicit rules.

v1.0:

- Express, Fastify, Hono, and Python examples are documented.
- PromptShield has adapter tests for supported runtimes without requiring model downloads by default.
- CSAM-Shield has retry, timeout, and fail-closed/fail-open policy controls.

v2.0:

- Operator playbooks describe latency budgets, review queues, audit logs, and incident handling.
- Compatibility matrix covers supported Node/Python versions and major framework versions.

## Track C: Credentialed Infrastructure

Packages: `hashstream`, `trainguard`.

v0.1:

- HashStream exposes fake-provider sync, snapshots, diffs, and a TypeScript SDK.
- TrainGuard scans JSONL/local manifests against in-memory providers.

v1.0:

- Signed local snapshots exist even for fake providers.
- TrainGuard can consume HashStream snapshots and produce compliance reports.
- All credentialed providers are interface-gated and skipped in default CI.

v2.0:

- Deployment guide covers storage, key management, auth, and audit retention.
- Credentialed validation results are documented without publishing restricted material.

## Track D: Legal/Ops

Packages: `cybertip-cli`, `evidencevault`.

v0.1:

- CyberTip CLI validates report models and emits dry-run payloads only.
- EvidenceVault records custody events and retention timers with local tests.

v1.0:

- Counsel-reviewed scope brief is incorporated into docs.
- Evidence packages are content-addressed and redact raw content by default.
- Production submission remains explicit, credential-gated, and disabled in tests.

v2.0:

- Outside counsel sign-off is recorded as a release gate.
- Preservation workflows include jurisdiction-aware retention policy tests.
- Operator docs explain escalation, revocation, audit export, and incident response.

## Cross-Track Release Gates

Before any release:

```bash
bash scripts/safety-check.sh
cargo test --workspace --all-features
```

Then run package-specific tests for packages touched by that track.

Before v1.0:

- Every active package has README examples, changelog, license metadata, and a status line.
- CI covers Rust, Python, Go, and Node packages that are active.
- `docs/roadmap.md` matches package `STATUS` files.

Before v2.0:

- Threat model and security policy are reviewed against implemented surfaces.
- Signing, audit, and retention behavior has tests.
- Credentialed flows have fake-provider tests and documented real-provider validation process.

