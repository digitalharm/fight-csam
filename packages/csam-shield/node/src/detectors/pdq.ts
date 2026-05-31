import type { DetectorResult, Scannable } from "../types.js";

export interface PDQConfig {
  /**
   * Source of known-bad hashes. Either an in-memory array (for testing
   * or small deployments) or a function that returns hashes given a
   * key (for hashstream-backed deployments).
   */
  knownBad: Uint8Array[] | (() => Promise<Uint8Array[]>);
  /** Hamming-distance threshold. Defaults to 31 (PhotoDNA-equivalent). */
  threshold?: number;
}

/**
 * Local PDQ matching detector.
 *
 * Hashes content via hashkit (when the WASM build is ready) and
 * compares against a caller-supplied known-bad set. Useful for
 * fully-local deployments and for cross-checking against other
 * detectors.
 *
 * Scaffold stage. Depends on hashkit's PDQ port reaching Alpha; the
 * matching logic itself is documented in hashkit-match.
 */
export async function runPDQ(
  config: Record<string, unknown>,
  _content: Scannable,
  _requestId: string,
): Promise<Omit<DetectorResult, "detector" | "durationMs">> {
  const typed = validate(config);
  void typed;
  throw new Error(
    "csam-shield: PDQ adapter is a scaffold stub. Depends on hashkit " +
      "reaching Alpha. See " +
      "https://github.com/digitalharm/digitalharm-oss/blob/main/docs/roadmap.md.",
  );
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
  return {
    knownBad: config.knownBad as PDQConfig["knownBad"],
    ...(typeof threshold === "number" ? { threshold } : {}),
  };
}
