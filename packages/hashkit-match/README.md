# hashkit-match

> In-memory multi-index Hamming matcher for PDQ hashes. Pairs with [hashkit](../hashkit).

**Status:** see [`STATUS`](STATUS) — canonical state across the portfolio at [`docs/roadmap.md`](../../docs/roadmap.md). **License:** Apache 2.0.

## Problem

Once you can compute PDQ hashes ([hashkit](../hashkit)), the next layer is matching
incoming hashes against a known-bad hash set you've received from NCMEC / IWF /
Project Arachnid. Naive linear comparison at scale is slow; the standard solution is
multi-index hashing (MIH) over the 256-bit space, which is fiddly to implement
correctly.

## Scope

- Multi-index Hamming matcher over caller-supplied hash sets
- Configurable threshold (default 31/256, the PhotoDNA-equivalent threshold)
- Pure data structure — **ships no hash lists**
- Bindings parallel to hashkit (Rust, WASM, Node, Deno, Bun, Python)

## Non-goals

- No hash-list distribution (that's [hashstream](../hashstream))
- No hashing (that's [hashkit](../hashkit))
- No detection vendor wrapping (that's [csam-shield](../csam-shield))

## Status

Planned. Ships alongside hashkit. See the [hashkit design](../hashkit/README.md) for
shared architectural context.
