# Conformance vectors

Frozen, versioned conformance corpus that every `hashkit` release must reproduce
byte-for-byte. **This directory is the gating artifact for every release.** CI
fails closed if any binding (Rust, WASM, Node, Deno, Bun, Python) produces a
different hash than the recorded value.

## What's here

```
vectors/
  v0/
    corpus.json     — manifest of (input descriptor, expected hash, expected quality)
    sources/        — generation scripts that produce each input deterministically
    LICENSE.md      — provenance and licensing for each source
  v1/               — added when reference behavior is unambiguously fixed
  ...
```

## What's not here

- **No CSAM imagery.** Sources are synthetic non-CSAM images with engineered
  hash properties, or licensed benign reference images (Lenna replacements,
  the Kodak test set, etc.) with documented provenance.
- **No raw NCMEC reference hashes for CSAM.** A subset of the corpus is
  cross-validated against NCMEC reference outputs via the credentialed ESP
  relationship; the *inputs* are benign, the *expected hashes* are recorded
  numerically. This means an adversary studying the corpus learns nothing
  about real CSAM material.

## Adding a vector

1. Generate the input deterministically (script in `sources/`).
2. Compute the expected hash using the upstream
   [facebook/ThreatExchange C++ reference](https://github.com/facebook/ThreatExchange/tree/main/pdq).
3. Record both in `corpus.json` with a stable identifier.
4. Verify against any existing implementation; resolve drift before commit.
5. Document the source in `LICENSE.md`.

## NCMEC cross-validation

A subset of vectors is cross-validated against NCMEC reference outputs. The
relationship work to obtain those reference hashes is separate from the code
work; track its status in the project's sponsorship docket. **Vectors marked
`ncmec_verified: true` in `corpus.json` are the load-bearing subset that
gives `hashkit` its trust posture.**

## Reading order

- [docs/safety-policy.md](../../../docs/safety-policy.md) — the threat model
  this corpus defends against
- [README.md](../README.md) — porting strategy
- [Cargo.toml](../Cargo.toml) — crate metadata
