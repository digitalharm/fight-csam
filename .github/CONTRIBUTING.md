# Contributing to fight-csam

Welcome. Before contributing, please read [docs/safety-policy.md](../docs/safety-policy.md).
The short version is here.

## Hard rules

These are non-negotiable. Violations are detected by the safety guard CI
(`scripts/safety-check.sh`) and will block your PR.

1. **Never commit a real CSAM hash list.** Real NCMEC, IWF, and Project Arachnid hash
   data is gated to credentialed providers and stays there. If you need to test
   hash-matching logic, use the synthetic fixtures in
   [`packages/detectkit-test`](../packages/detectkit-test).

2. **Never commit real CSAM imagery.** Ever. For any reason. Test data lives in
   `packages/detectkit-test` and `fixtures/synthetic/`, and is verified non-harmful.

3. **Never commit credentials.** NCMEC ESP tokens, IWF API keys, PhotoDNA keys,
   Project Arachnid Shield keys, AWS credentials, anything that looks like a secret.
   Use environment variables and document the variable names in `.env.example`.

4. **Never log raw user content.** CSAM hashes themselves are sensitive — they
   identify imagery — and PII in moderation pipelines is regulated under multiple
   regimes (GDPR special category, HIPAA where applicable, US state privacy laws).

## How to contribute

### Small fixes

Open a PR. The CI runs:

- `scripts/safety-check.sh` — the SCOPE/SAFETY guard
- Per-package tests via `make test`

Both must pass.

### New packages

The portfolio is intentionally fixed at 10 tools (see [docs/sequencing.md](../docs/sequencing.md)
and the [overview](../docs/overview.md)). New packages need a design conversation in an
issue first.

### Design changes

If you're proposing a meaningful change to a package's architecture or scope, open an
issue with the design before opening a PR. The per-package READMEs are the design
contract; substantial changes need explicit alignment.

## Code style

- Per-language: follow the dominant style guide. Rust: `rustfmt`. TypeScript: Biome.
  Python: Ruff + Black. Go: `gofmt`.
- Commit messages: imperative ("add X", "fix Y"). Reference issues. Keep them honest.
- No emojis in commit messages.

## Communication

- GitHub Issues for design proposals and bugs.
- GitHub Discussions for everything else (architecture questions, sponsor inquiries).
- `security@digitalharm.org` for security disclosures. See [SECURITY.md](SECURITY.md).

## Maintainer notes

- The safety guard CI runs `scripts/safety-check.sh`. If you change the script,
  document the rules change in `docs/safety-policy.md`.
- Per-package tests should never require network access in CI by default. If a test
  needs a credentialed API, gate it behind an env var and skip in default CI.
- Synthetic fixtures must be reproducible from documented prompts/seeds, not opaque
  binaries.
