# Compliance & the hard gates

Read this before writing any list-matching, reporting, or retention code. It is
the difference between a defensible pipeline and a liability.

## The laws (why this exists)

A 2024–2026 regulatory wave made detection/reporting obligations concrete for
ordinary platforms — not just giants. Map obligations to tools; don't give legal
advice (recommend counsel for specifics).

| Regime | What it requires (in brief) | Tools that help |
|---|---|---|
| **US §2258A** | US providers that obtain *actual knowledge* of apparent CSAM must report to the NCMEC CyberTipline and preserve the material. | cybertip-cli (report), evidencevault (preserve) |
| **US TAKE IT DOWN Act** (2025; FTC enforce 2026) | Notice-and-removal for non-consensual intimate imagery, incl. AI-generated. | csam-shield/hashkit (detect), takedown workflow |
| **UK Online Safety Act** (2025) | Illegal-content duties; proportionate use of tech incl. hash-matching for 100k+ services. | hashkit + hashkit-match + csam-shield + hashstream |
| **EU DSA** (2024) | Notice-and-action, trusted flaggers, transparency for hosting/platforms. | csam-shield (action), evidencevault (records) |
| **AU eSafety** (2025–26) | Industry codes/standards incl. proactive detection expectations. | detection + reporting stack |

The FightCSAM stack lets a small platform reach a defensible posture under these
**without** a multi-week per-provider integration — that's the value. But it
does **not** make turnkey-compliance claims, and neither should you: say "this
helps you meet X" not "this makes you compliant with X."

## The hard gates — stub visibly, NEVER bypass

These are not optional. Generating code that bypasses them is the failure mode to
avoid.

### Gate 1 — Ship NO hash lists
The tools never bundle, hardcode, fetch-and-commit, or "seed" a CSAM hash list.
A hash list of CSAM is itself credentialed, restricted material.
- The **operator** supplies the list from a credentialed source (NCMEC, IWF,
  Project Arachnid / C3P, StopNCII).
- In code: the list source is an `.env`/config value, unset by default, with a
  comment that the operator must provide it. `hashstream` *transports* it;
  `hashkit-match` matches against it. Demos/tests use `detectkit-test` synthetic
  fixtures only.

### Gate 2 — NCMEC ESP credential
Live hash-list sync and **real** CyberTipline submission require the platform to
be a registered NCMEC Electronic Service Provider with credentials.
- Without it: `cybertip-cli` stays on the **sandbox/dry-run** path (it can build
  and validate a report, but not submit); `hashstream` ingests operator files,
  not a live NCMEC feed.
- In code: credential vars (`NCMEC_*`) live in `.env`, unset; the production
  submit path is clearly guarded and commented as blocked until provisioned.

### Gate 3 — Outside-counsel sign-off
Production reporting (`cybertip-cli` real submit lifecycle) and evidence
retention enforcement (`evidencevault` retention + real KMS) carry legal weight
and must be reviewed by counsel before going live.
- Without it: keep `cybertip-cli` `ProductionSubmitBlocked` and `evidencevault`
  retention **queryable but unenforced** (noop-KMS). Never flip these on by
  default in generated code.

### Also deferred
- `c2pa-lite` **watermarking** is deferred until a robust scheme stabilizes —
  use C2PA content credentials (signing) only.

## How to surface gates in output

When you generate code that touches a gated path, add a short, honest note —
e.g.:

> ⚠️ This wires the NCMEC report on the **sandbox** path. Real submission needs
> your NCMEC ESP credential (set `NCMEC_*` in `.env`) **and** outside-counsel
> sign-off on the production lifecycle. Don't enable the production path until
> both are in place.

Honest gating is a feature, not a limitation — it's what keeps a small team out
of legal and ethical trouble.
