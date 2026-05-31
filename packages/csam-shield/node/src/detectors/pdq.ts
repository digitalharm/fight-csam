import type { DetectorConfig, DetectorResult, Scannable } from "../types.js";

/**
 * Configuration for the local PDQ-list detector.
 *
 * This detector performs Hamming-distance matching of a content hash
 * against an *operator-supplied* list of known-bad PDQ hashes. It needs
 * no external credentials and no network access — the operator brings
 * their own list (e.g. exported from a credentialed service into their
 * own environment) and csam-shield does the matching locally.
 */
export interface PDQConfig {
  /**
   * Source of known-bad hashes — the operator-supplied list. Either an
   * in-memory array (for testing or small deployments) or a function
   * that returns the hashes (for hashstream-backed deployments that load
   * the list lazily).
   *
   * Each entry is a raw PDQ hash as bytes. The canonical PDQ hash is 256
   * bits / 32 bytes, but any fixed width is accepted as long as every
   * entry and the query hash share the same length.
   */
  knownBad: Uint8Array[] | (() => Promise<Uint8Array[]>);
  /**
   * Hamming-distance threshold (inclusive). A query hash matches a list
   * entry when their bitwise Hamming distance is `<= threshold`.
   * Defaults to 31 — the widely used PDQ "near match" radius for 256-bit
   * hashes. Set to 0 for exact-match-only.
   */
  threshold?: number;
  /**
   * Optional pre-computed query hash. When provided, the detector uses
   * this directly instead of deriving a hash from the content bytes.
   *
   * This is the dependency-free path: the caller hashes the image with
   * whatever PDQ implementation it has (e.g. hashkit once it lands) and
   * hands the raw bytes to csam-shield. The detector then only does the
   * matching, so it never needs hashkit to be merged.
   */
  hash?: Uint8Array;
}

/** Hex-encode bytes for synthetic hash evidence / log summaries. */
function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

/**
 * Population count (number of set bits) of a single byte. Ten lines of
 * arithmetic; shipped inline so the detector has no dependency on
 * hashkit-match for what is ultimately a one-liner.
 */
function popcount8(byte: number): number {
  let v = byte & 0xff;
  v = v - ((v >> 1) & 0x55);
  v = (v & 0x33) + ((v >> 2) & 0x33);
  return (v + (v >> 4)) & 0x0f;
}

/**
 * Bitwise Hamming distance between two equal-length byte arrays: the
 * number of bit positions at which they differ. Returns
 * `Number.POSITIVE_INFINITY` for mismatched lengths so callers treat
 * incomparable hashes as "never a match" rather than throwing.
 */
export function hammingDistance(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    distance += popcount8((a[i] as number) ^ (b[i] as number));
  }
  return distance;
}

/**
 * Derive a deterministic, fixed-width synthetic hash from content bytes.
 *
 * This is NOT real PDQ. It is a stand-in so the detector path is
 * exercisable end-to-end (and testable) before hashkit's perceptual PDQ
 * port lands. For real perceptual matching the caller should pre-compute
 * a true PDQ hash and pass it via `config.hash` (or `createPdqListDetector`'s
 * `hash` argument); this fold is only used when no hash is supplied.
 *
 * It folds the input into 32 bytes deterministically, so identical bytes
 * always produce identical hashes — which is exactly what an exact-dedupe
 * list match needs.
 */
function deriveSyntheticHash(data: Uint8Array, width = 32): Uint8Array {
  const out = new Uint8Array(width);
  // Seeded per-lane so all-zero / short inputs still spread across the
  // width instead of collapsing to a constant.
  for (let i = 0; i < width; i++) out[i] = (i * 31 + 7) & 0xff;
  for (let i = 0; i < data.length; i++) {
    const lane = i % width;
    // Mix the byte, its position, and the running lane value.
    out[lane] = ((out[lane] as number) + (data[i] as number) * 131 + i) & 0xff;
  }
  // One diffusion pass so a single changed input byte perturbs more than
  // one output lane.
  let carry = 0;
  for (let i = 0; i < width; i++) {
    const mixed = ((out[i] as number) ^ ((carry << 3) | (carry >> 5))) & 0xff;
    out[i] = mixed;
    carry = mixed;
  }
  return out;
}

/**
 * Resolve the query hash for a piece of content.
 * Preference order: explicit pre-computed hash → synthetic hash derived
 * from raw bytes. URL-only inputs cannot be hashed locally (the bytes
 * aren't present), so they require a pre-computed hash.
 */
function resolveQueryHash(config: PDQConfig, content: Scannable): Uint8Array | null {
  if (config.hash instanceof Uint8Array) return config.hash;
  if (content.kind === "image-bytes" || content.kind === "video-bytes") {
    return deriveSyntheticHash(content.data);
  }
  return null;
}

/**
 * Local PDQ-list matching detector.
 *
 * Matches a content hash against an operator-supplied list of known-bad
 * PDQ hashes using bitwise Hamming distance. No credentials, no network.
 *
 * Returns `matched: true` if any list entry is within `threshold` Hamming
 * distance of the query hash, `matched: false` otherwise.
 */
export async function runPDQ(
  config: Record<string, unknown>,
  content: Scannable,
  _requestId: string,
): Promise<Omit<DetectorResult, "detector" | "durationMs">> {
  const typed = validate(config);
  const threshold = typed.threshold ?? 31;

  const queryHash = resolveQueryHash(typed, content);
  if (queryHash === null) {
    return {
      matched: false,
      reasoning:
        "pdq: cannot match URL-only content locally; pass a pre-computed " +
        "hash via config.hash (or createPdqListDetector({ hash })).",
    };
  }

  const list = Array.isArray(typed.knownBad) ? typed.knownBad : await typed.knownBad();

  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of list) {
    const distance = hammingDistance(queryHash, entry);
    if (distance < bestDistance) bestDistance = distance;
    if (bestDistance <= threshold) break; // early-out on first match
  }

  const matched = bestDistance <= threshold;
  const bits = queryHash.length * 8;

  const out: Omit<DetectorResult, "detector" | "durationMs"> = {
    matched,
    reasoning: matched
      ? `pdq: matched operator list (minHamming=${bestDistance} <= threshold=${threshold})`
      : `pdq: no match (minHamming=${
          bestDistance === Number.POSITIVE_INFINITY ? "n/a" : bestDistance
        } > threshold=${threshold}, list=${list.length})`,
  };
  if (matched && Number.isFinite(bestDistance)) {
    // Confidence: 1.0 for an exact hash hit, decaying toward the threshold edge.
    out.confidence = Math.max(0, Math.min(1, 1 - bestDistance / Math.max(1, bits)));
  }
  return out;
}

function validate(config: Record<string, unknown>): PDQConfig {
  if (!Array.isArray(config.knownBad) && typeof config.knownBad !== "function") {
    throw new Error(
      "pdq config: knownBad must be Uint8Array[] or () => Promise<Uint8Array[]>",
    );
  }
  const threshold = config.threshold;
  if (
    threshold !== undefined &&
    (typeof threshold !== "number" || threshold < 0 || threshold > 256)
  ) {
    throw new Error("pdq config: threshold must be between 0 and 256");
  }
  const hash = config.hash;
  if (hash !== undefined && !(hash instanceof Uint8Array)) {
    throw new Error("pdq config: hash must be a Uint8Array if provided");
  }
  return {
    knownBad: config.knownBad as PDQConfig["knownBad"],
    ...(typeof threshold === "number" ? { threshold } : {}),
    ...(hash instanceof Uint8Array ? { hash } : {}),
  };
}

/**
 * Convenience builder for a PDQ-list `DetectorConfig`.
 *
 * Wires an operator-supplied hash list into a ready-to-use detector you
 * can drop straight into `createShield({ detectors: [...] })`.
 *
 * @example
 *   const shield = createShield({
 *     detectors: [createPdqListDetector({ hashList: operatorHashes, threshold: 10 })],
 *     onError: "deny",
 *   });
 */
export function createPdqListDetector(opts: {
  /** The operator-supplied known-bad hash list (alias for PDQConfig.knownBad). */
  hashList: Uint8Array[] | (() => Promise<Uint8Array[]>);
  /** Hamming-distance threshold (inclusive). Defaults to 31. */
  threshold?: number;
  /** Optional pre-computed query hash (otherwise derived from content bytes). */
  hash?: Uint8Array;
  /** Optional per-detector timeout override, in milliseconds. */
  timeoutMs?: number;
}): DetectorConfig {
  const detectorConfig: Record<string, unknown> = { knownBad: opts.hashList };
  if (typeof opts.threshold === "number") detectorConfig.threshold = opts.threshold;
  if (opts.hash instanceof Uint8Array) detectorConfig.hash = opts.hash;
  return {
    detector: "pdq",
    config: detectorConfig,
    ...(typeof opts.timeoutMs === "number" ? { timeoutMs: opts.timeoutMs } : {}),
  };
}

export { toHex as pdqHashToHex };
