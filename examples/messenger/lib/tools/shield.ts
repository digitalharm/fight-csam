/**
 * Tool integration: CSAM-Shield (one-call upload middleware).
 *
 * Real package: `packages/csam-shield` (TS + Python) — `createShield(config)`
 * dispatches an upload across N detectors (PhotoDNA, NCMEC API, PDQ via
 * HashKit, Cloudflare CSAM Scanning, …) and combines verdicts with a strategy
 * (any-match / majority / consensus), with per-detector timeout and a
 * fail-open / fail-closed policy. This mirrors that contract and wires the one
 * credential-free detector available in the demo: the PDQ-list detector
 * (HashKit + hashkit-match against the HashStream snapshot).
 *
 * In production you add more detectors to the array; the dispatch, strategy,
 * and fail-closed policy are exactly csam-shield's.
 */

import { pdqHashFromBytes, PdqMatcher, type PdqHex } from "./hashkit";
import { referenceHashes, latestSnapshot } from "./hashstream";

export type Verdict = "match" | "no-match" | "error";

export interface DetectorResult {
  detector: string;
  verdict: Verdict;
  reason?: string;
  matchedSource?: string;
  matchedDistance?: number;
}

export interface ShieldResult {
  blocked: boolean;
  pdqHex: PdqHex;
  results: DetectorResult[];
  strategy: "any-match";
}

/**
 * Scan an uploaded image. Computes its PDQ hash and runs the PDQ-list detector;
 * `any-match` + fail-closed means a single positive match blocks. Returns the
 * hash so callers can persist it (we never persist the bytes).
 */
export function scanImage(bytes: Uint8Array): ShieldResult {
  const pdqHex = pdqHashFromBytes(bytes);
  const results: DetectorResult[] = [];

  try {
    const snapshot = latestSnapshot();
    const matcher = new PdqMatcher(referenceHashes(), 31);
    const match = matcher.query(pdqHex);
    if (match) {
      results.push({
        detector: "pdq-list",
        verdict: "match",
        reason: `PDQ hash within Hamming ${match.distance} of a ${snapshot.source} list entry`,
        matchedSource: snapshot.source,
        matchedDistance: match.distance,
      });
    } else {
      results.push({ detector: "pdq-list", verdict: "no-match" });
    }
  } catch (err) {
    // Fail-closed: a detector error is treated as a block, not a pass.
    results.push({
      detector: "pdq-list",
      verdict: "error",
      reason: err instanceof Error ? err.message : "detector error",
    });
  }

  const blocked = results.some((r) => r.verdict === "match" || r.verdict === "error");
  return { blocked, pdqHex, results, strategy: "any-match" };
}
