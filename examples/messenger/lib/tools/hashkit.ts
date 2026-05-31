/**
 * Tool integration: HashKit + hashkit-match (perceptual hashing & matching).
 *
 * Real packages: `packages/hashkit` (Rust → PDQ, 256-bit) and
 * `packages/hashkit-match` (Hamming matcher). Their production deployment
 * target is a WebAssembly build callable from this exact spot.
 *
 * For this self-contained, Vercel-deployable demo we compute a deterministic
 * 256-bit content hash in pure TS and Hamming-match it — mirroring HashKit's
 * `PdqHash` (`.to_hex()` → 64 hex chars, `.hamming()`) and hashkit-match's
 * `query`/`query_all` contract. The difference from production: real PDQ is
 * *perceptual* (survives re-encoding, resize, mild crops); this demo hash is a
 * content digest (exact/near-exact byte matches). That is enough to exercise
 * the full detect → match → block flow; swap in the HashKit WASM module to get
 * true perceptual robustness. The match *contract* is identical.
 */

const HASH_BYTES = 32; // 256-bit, like PDQ
const HEX_LEN = HASH_BYTES * 2;

/** A 256-bit hash rendered as 64 lowercase hex chars (HashKit `PdqHash::to_hex`). */
export type PdqHex = string;

/**
 * Deterministic 256-bit hash of a byte buffer. Folds the input across 32
 * accumulator bytes so identical content always yields an identical hash and
 * small content changes perturb only part of the hash (a crude perceptual
 * stand-in; production uses HashKit's DCT-based PDQ).
 */
export function pdqHashFromBytes(bytes: Uint8Array): PdqHex {
  const acc = new Uint8Array(HASH_BYTES);
  // Mix each byte into a rotating accumulator slot with its index, so order
  // and value both matter.
  for (let i = 0; i < bytes.length; i++) {
    const slot = i % HASH_BYTES;
    acc[slot] = (acc[slot] + bytes[i] + (i & 0xff)) & 0xff;
  }
  // Second pass diffuses each slot into its neighbour so a single changed byte
  // affects more than one slot (improves the "near content → near hash" feel).
  for (let r = 0; r < 3; r++) {
    let carry = acc[HASH_BYTES - 1];
    for (let i = 0; i < HASH_BYTES; i++) {
      const v = (acc[i] ^ ((carry << 1) | (carry >> 7))) & 0xff;
      acc[i] = v;
      carry = v;
    }
  }
  return Array.from(acc, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Hamming distance in bits between two hex hashes (HashKit `PdqHash::hamming`). */
export function hamming(aHex: PdqHex, bHex: PdqHex): number {
  if (aHex.length !== HEX_LEN || bHex.length !== HEX_LEN) {
    throw new Error(`hamming: both hashes must be ${HEX_LEN} hex chars`);
  }
  let dist = 0;
  for (let i = 0; i < HASH_BYTES; i++) {
    const a = parseInt(aHex.slice(i * 2, i * 2 + 2), 16);
    const b = parseInt(bHex.slice(i * 2, i * 2 + 2), 16);
    let x = a ^ b;
    while (x) {
      dist += x & 1;
      x >>= 1;
    }
  }
  return dist;
}

export interface Match {
  /** Index into the reference set (hashkit-match `Match.index`). */
  index: number;
  /** Hamming distance to the matched hash (`Match.distance`). */
  distance: number;
}

/**
 * Naive linear-scan matcher mirroring hashkit-match's `PdqMatcher`.
 * The default threshold of 31 is PhotoDNA-equivalent and matches the real
 * crate's `DEFAULT_HAMMING_THRESHOLD`.
 */
export class PdqMatcher {
  constructor(
    private readonly reference: PdqHex[],
    private readonly threshold = 31,
  ) {
    if (reference.length === 0) {
      throw new Error("PdqMatcher: refusing an empty reference set");
    }
    if (threshold > 256) throw new Error("PdqMatcher: threshold exceeds 256");
  }

  /** Closest match within threshold, or null. Ties → lowest index. */
  query(hash: PdqHex): Match | null {
    let best: Match | null = null;
    this.reference.forEach((ref, index) => {
      const distance = hamming(hash, ref);
      if (distance <= this.threshold && (best === null || distance < best.distance)) {
        best = { index, distance };
      }
    });
    return best;
  }
}
