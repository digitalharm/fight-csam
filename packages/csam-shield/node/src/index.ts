/**
 * csam-shield — one-line CSAM detection middleware.
 *
 * Scaffold stage. Public API surface is defined; detector dispatch
 * is implemented; per-adapter wiring (PhotoDNA, NCMEC, PDQ,
 * Cloudflare CSAM Scanning) lives in detectors/ as todo stubs.
 *
 * Status: see https://github.com/digitalharm/digitalharm-oss/blob/main/docs/roadmap.md
 * Safety: https://github.com/digitalharm/digitalharm-oss/blob/main/docs/safety-policy.md
 */

import type {
  DetectorConfig,
  DetectorResult,
  MatchDecision,
  MatchResponse,
  Scannable,
  ShieldConfig,
} from "./types.js";
import { runDetector } from "./detectors/index.js";

export type * from "./types.js";

/**
 * Build a Shield instance from a config.
 *
 * @example
 *   const shield = createShield({
 *     detectors: [
 *       { detector: "cloudflare-csam-scanning", config: { token: process.env.CF_TOKEN! } },
 *       { detector: "photodna", config: { apiKey: process.env.PHOTODNA_KEY! } },
 *     ],
 *     strategy: "any-match",
 *     onDecision: async (resp) => { await myAuditLog.write(resp); },
 *   });
 *
 *   const result = await shield.scan({ kind: "image-bytes", data, contentType: "image/jpeg" });
 *   if (result.decision === "match") {
 *     // block + escalate to CyberTipline
 *   }
 */
export function createShield(config: ShieldConfig): Shield {
  if (config.detectors.length === 0) {
    throw new Error(
      "csam-shield: refusing to create a shield with zero detectors. " +
        "A shield with no detectors silently returns 'nomatch' on everything " +
        "and is therefore worse than no shield at all.",
    );
  }
  return new ShieldImpl(config);
}

export interface Shield {
  scan(content: Scannable): Promise<MatchResponse>;
  /** Detector wiring for inspection / testing. */
  readonly detectors: readonly DetectorConfig[];
}

class ShieldImpl implements Shield {
  constructor(private readonly config: ShieldConfig) {}

  get detectors(): readonly DetectorConfig[] {
    return this.config.detectors;
  }

  async scan(content: Scannable): Promise<MatchResponse> {
    const startedAt = performance.now();
    const requestId = this.config.requestId?.() ?? crypto.randomUUID();

    const results = await Promise.all(
      this.config.detectors.map((d) => runDetector(d, content, requestId)),
    );

    const decision = decide(results, this.config.strategy ?? "any-match");
    const durationMs = Math.round(performance.now() - startedAt);

    const response: MatchResponse = {
      decision,
      results,
      durationMs,
      requestId,
      logSummary: summarize(decision, results, durationMs, requestId),
    };

    if (this.config.onDecision) {
      // Don't let audit-log failures break the request path.
      try {
        await this.config.onDecision(response);
      } catch (_err) {
        // Swallow. The platform's audit-log infrastructure is its own
        // operational concern; we surface the response to the caller
        // either way so the platform can act on the decision.
      }
    }

    return response;
  }
}

function decide(
  results: DetectorResult[],
  strategy: "any-match" | "majority" | "consensus",
): MatchDecision {
  const errored = results.filter((r) => r.error !== undefined);
  const matched = results.filter((r) => r.matched);
  const cleanRan = results.filter((r) => r.error === undefined);

  if (cleanRan.length === 0) {
    return "error";
  }

  switch (strategy) {
    case "any-match":
      if (matched.length > 0) return "match";
      if (errored.length > 0) return "error";
      return "nomatch";
    case "majority":
      if (matched.length * 2 > cleanRan.length) return "match";
      if (errored.length > 0) return "error";
      return "nomatch";
    case "consensus":
      if (matched.length === cleanRan.length && cleanRan.length === results.length) {
        return "match";
      }
      if (errored.length > 0) return "error";
      return "nomatch";
  }
}

function summarize(
  decision: MatchDecision,
  results: DetectorResult[],
  durationMs: number,
  requestId: string,
): string {
  const detectorSummary = results
    .map((r) => {
      if (r.error) return `${r.detector}=err`;
      return `${r.detector}=${r.matched ? "match" : "clean"}`;
    })
    .join(",");
  return `req=${requestId} decision=${decision} ms=${durationMs} ${detectorSummary}`;
}
