import type { DetectorResult, Scannable } from "../types.js";

export interface CloudflareConfig {
  /** Cloudflare account API token with CSAM Scanning permissions. */
  token: string;
  /** Optional zone ID if scanning is scoped to a single zone. */
  zoneId?: string;
  /** Sensitivity threshold, 0–1. Defaults to Cloudflare's recommended 0.7. */
  threshold?: number;
}

/**
 * Cloudflare CSAM Scanning Tool detector.
 *
 * Free for all Cloudflare customers regardless of plan. Fuzzy-hash
 * matching against NCMEC databases with automatic HTTP 451 blocking.
 * See https://blog.cloudflare.com/the-csam-scanning-tool/.
 *
 * Scaffold stage. Wire protocol is documented in the Cloudflare API
 * reference; landing the implementation is straightforward once an
 * account-level token is available for the e2e test path.
 */
export async function runCloudflareCSAMScanning(
  config: Record<string, unknown>,
  _content: Scannable,
  _requestId: string,
): Promise<Omit<DetectorResult, "detector" | "durationMs">> {
  const typed = validate(config);
  void typed;
  throw new Error(
    "csam-shield: Cloudflare CSAM Scanning adapter is a scaffold stub. " +
      "Wire-protocol implementation pending account-token test access. See " +
      "https://github.com/digitalharm/fight-csam/blob/main/docs/roadmap.md.",
  );
}

function validate(config: Record<string, unknown>): CloudflareConfig {
  if (typeof config.token !== "string" || config.token.length === 0) {
    throw new Error("cloudflare config: token is required (non-empty string)");
  }
  const zoneId = config.zoneId;
  if (zoneId !== undefined && typeof zoneId !== "string") {
    throw new Error("cloudflare config: zoneId must be a string if provided");
  }
  const threshold = config.threshold;
  if (
    threshold !== undefined &&
    (typeof threshold !== "number" || threshold < 0 || threshold > 1)
  ) {
    throw new Error("cloudflare config: threshold must be between 0 and 1");
  }
  return {
    token: config.token,
    ...(typeof zoneId === "string" ? { zoneId } : {}),
    ...(typeof threshold === "number" ? { threshold } : {}),
  };
}
