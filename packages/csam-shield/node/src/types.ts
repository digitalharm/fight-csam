/**
 * Public type surface for csam-shield.
 *
 * The unified MatchResponse model — every upstream detector
 * (PhotoDNA, NCMEC API, PDQ via hashkit, Cloudflare CSAM Scanning,
 * Thorn Safer, Hive AI) produces a response that gets normalized
 * into this shape. Adopters program against one model regardless of
 * how many detectors they wire in.
 */

/**
 * The match decision for a single piece of content.
 *
 * - `match`     — at least one upstream detector returned a positive match
 * - `nomatch`   — every upstream detector ran cleanly with no match
 * - `pending`   — at least one upstream is still in flight or in human review;
 *                 the platform should hold or quarantine the content
 * - `error`     — at least one upstream returned an error; the response carries
 *                 the partial results from any detector that succeeded
 */
export type MatchDecision = "match" | "nomatch" | "pending" | "error";

/**
 * The kind of detector that produced a per-detector result.
 *
 * Listed in rough priority order: hash matches are most authoritative,
 * AI classifiers are advisory, and the legal-route ones (cybertip) are
 * the downstream action layer rather than a detector.
 */
export type DetectorKind =
  | "photodna"
  | "ncmec-hash"
  | "iwf-hash"
  | "arachnid-hash"
  | "pdq"
  | "cloudflare-csam-scanning"
  | "thorn-safer"
  | "hive-ai"
  | "custom";

/**
 * Result from a single upstream detector.
 */
export interface DetectorResult {
  detector: DetectorKind;
  /** Was a positive match returned? */
  matched: boolean;
  /** Optional confidence score, 0–1. */
  confidence?: number;
  /** Free-form detector-specific reasoning. */
  reasoning?: string;
  /** Milliseconds the detector took. */
  durationMs: number;
  /** If the detector errored, the error message. */
  error?: string;
}

/**
 * Unified response across every wired detector.
 */
export interface MatchResponse {
  decision: MatchDecision;
  /** Per-detector results in the order detectors were configured. */
  results: DetectorResult[];
  /** Total wall-clock time the shield took, in milliseconds. */
  durationMs: number;
  /** Stable request identifier for audit logging. */
  requestId: string;
  /**
   * A redacted summary safe to include in logs and metrics. Never
   * contains the underlying content; the platform must store the
   * content separately under its own retention policy (see
   * EvidenceVault for the operational scaffolding).
   */
  logSummary: string;
}

/**
 * Configuration for a single upstream detector. Shape varies per detector.
 * Concrete configs live in adapters/.
 */
export interface DetectorConfig {
  detector: DetectorKind;
  /** Detector-specific opaque config; adapters typecheck this. */
  config: Record<string, unknown>;
  /** If true, this detector's failures are non-fatal. Default: true. */
  optional?: boolean;
  /** Timeout in milliseconds. Default: 5000. */
  timeoutMs?: number;
}

/**
 * Shield configuration. The minimum useful config wires at least one
 * detector; production deployments typically wire 2–4.
 */
export interface ShieldConfig {
  /** Detectors in the order they should be invoked. */
  detectors: DetectorConfig[];
  /**
   * Strategy for combining detector results into a unified decision.
   * - `any-match` (default) — one positive match means match
   * - `majority` — more than half of detectors must match
   * - `consensus` — all detectors must match
   */
  strategy?: "any-match" | "majority" | "consensus";
  /**
   * Optional global request-id generator. Defaults to a crypto-random
   * UUID. Override to plumb in your own tracing identifier.
   */
  requestId?: () => string;
  /**
   * Optional structured-event emitter. Called on every match decision
   * for audit logging and metrics. The platform owns the sink.
   */
  onDecision?: (response: MatchResponse) => void | Promise<void>;
}

/**
 * The content to scan. Adopters pass either raw bytes or a stream;
 * the shield never persists the content itself.
 */
export type Scannable =
  | { kind: "image-bytes"; data: Uint8Array; contentType: string }
  | { kind: "image-url"; url: string; contentType?: string }
  | { kind: "video-bytes"; data: Uint8Array; contentType: string }
  | { kind: "video-url"; url: string; contentType?: string };
