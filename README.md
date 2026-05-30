# digitalharm-oss

Open-source building blocks for CSAM detection, blocking, and prevention.

This repository hosts the buildable layer beneath the detection landscape described in
[The Digital Harm Report, Chapter 06](https://digitalharm.org/report/technology). It
exists so that a 20-person platform can wire up the same protective infrastructure as
a Discord or Roblox, without weeks of per-provider integration and without rebuilding
the same plumbing every team rebuilds from scratch.

> **None of these tools ship a CSAM hash list or handle real CSAM. They are
> detection-assist primitives, not a guarantee.** See [SAFETY](docs/safety-policy.md).

## The portfolio

Ten tools, designed to compose. Status reflects current readiness.

### Hashing & conformance

| Tool | Status | Description |
|---|---|---|
| [`hashkit`](packages/hashkit) | Planned | Meta PDQ + TMK+PDQF as a single WebAssembly core, with NCMEC-verified test vectors so every language produces the same hash. |
| [`hashkit-match`](packages/hashkit-match) | Planned | In-memory multi-index Hamming matcher over caller-supplied hash sets. Ships no hash lists. |
| [`detectkit-test`](packages/detectkit-test) | Planned | Synthetic non-CSAM test fixtures with engineered hash properties — verify your detection pipeline in CI without touching real CSAM. |

### Integration & prevention

| Tool | Status | Description |
|---|---|---|
| [`csam-shield`](packages/csam-shield) | Planned | One-line middleware for Express/Fastify/FastAPI/Hono that wires PhotoDNA, PDQ, NCMEC API, and Cloudflare CSAM Scanning behind a unified interface. |
| [`promptshield`](packages/promptshield) | Planned | Lightweight classifier middleware for Stable Diffusion / FLUX / ComfyUI / vLLM that detects CSAM intent at the prompt, before compute is spent. |
| [`c2pa-lite`](packages/c2pa-lite) | Deferred | Pragmatic C2PA content credentials for generators that don't yet have provenance signaling. Deferred until upstream c2pa-rs stabilizes. |

### List infrastructure

| Tool | Status | Description |
|---|---|---|
| [`hashstream`](packages/hashstream) | Planned | Version control and audit trail for NCMEC / IWF / Project Arachnid hash lists. Versioned snapshots, diffs, webhooks. |
| [`trainguard`](packages/trainguard) | Planned | Pre-flight screen for AI image/video training datasets against national hash lists. Generates compliance reports with chain-of-custody. |

### Legal & operations

| Tool | Status | Description |
|---|---|---|
| [`cybertip-cli`](packages/cybertip-cli) | Planned | NCMEC CyberTipline report submission with proper formatting, retry logic, evidence packaging, audit logging. |
| [`evidencevault`](packages/evidencevault) | Planned | Defensible records-retention with chain-of-custody metadata, preservation timers matching LE requests, jurisdiction-aware schedules. |
| [`safemod`](packages/safemod) | Deferred | Moderator wellness toolkit. Deferred indefinitely / spin out — GDPR special-category data load is a liability mismatch for solo maintenance. |

## Sequencing

The build order matters. See [docs/sequencing.md](docs/sequencing.md) for the five-wave plan.

1. **Wave 1: Foundation (credential-free)** — `hashkit` + `detectkit-test`
2. **Wave 2: Drop-in adoption** — `csam-shield` + `promptshield`
3. **Wave 3: Credentialed infrastructure** — `hashstream` + `trainguard`
4. **Wave 4: Legal endgame** — `cybertip-cli` + `evidencevault`
5. **Wave 5: Deferred satellites** — `c2pa-lite`, `safemod`

## Safety

Every package and the root CI enforce a small set of non-negotiable rules:

- **No CSAM hash lists in this repo.** Real NCMEC / IWF / Project Arachnid hash data
  is gated to credentialed providers and stays there.
- **No CSAM imagery, ever.** Tests use synthetic non-CSAM fixtures from `detectkit-test`
  with engineered hash properties.
- **No credentials in commits.** The safety guard CI catches accidental NCMEC ESP
  tokens, IWF API keys, PhotoDNA keys, and Project Arachnid Shield keys.
- **Detection-assist, not a guarantee.** These tools lower the floor of access to
  proven CSAM-defense infrastructure. They do not replace human review or the
  reporting obligations under 18 U.S.C. § 2258A.

The CI guard (`scripts/safety-check.sh`) is the mechanism. The policy
(`docs/safety-policy.md`) is the contract.

## License

Apache 2.0 across the portfolio. See per-package `LICENSE` files.

## Funding and sponsorship

See [docs/sponsorship.md](docs/sponsorship.md). The primary funding model is
restricted/grant capital from child-safety foundations (Tech Coalition's Lantern,
Patrick J. McGovern Foundation, EU Internet Forum / DSA compliance budgets) rather
than per-seat licensing. Commercial support and prioritized maintenance tiers are
the secondary funding line.

## Contributing

See [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md). Short version:

- Read [SAFETY](docs/safety-policy.md) first.
- Never commit real CSAM imagery, real CSAM hash lists, or live credentials.
- The safety guard will fail your PR if you do anyway.

## Related

- [The Digital Harm Report](https://digitalharm.org) — the editorial publication this
  portfolio operationalizes.
- [Chapter 06: Technology Solutions](https://digitalharm.org/report/technology) — the
  landscape these tools fit into.
- [For Tech CEOs](https://digitalharm.org/for-tech-ceos) and [For Compliance Teams](https://digitalharm.org/for-compliance-teams) —
  the audience guides that recommend the underlying defense pattern.
# extra
