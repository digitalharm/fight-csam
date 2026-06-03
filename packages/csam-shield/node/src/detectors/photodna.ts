import type { DetectorResult, Scannable } from "../types.js";

export interface PhotoDNAConfig {
  /** Microsoft PhotoDNA Cloud Service API key. */
  apiKey: string;
  /** Endpoint URL. Defaults to the production endpoint. */
  endpoint?: string;
}

/**
 * PhotoDNA detector.
 *
 * Wraps the Microsoft PhotoDNA Cloud Service. Free for qualified
 * organizations; access is gated through Microsoft's application
 * process. See https://www.microsoft.com/en-us/photodna for
 * onboarding.
 *
 * Scaffold stage: this stub validates the config shape and throws
 * a documented NotImplementedError. The wire-protocol implementation
 * lands when an active PhotoDNA application has been approved.
 */
export async function runPhotoDNA(
  config: Record<string, unknown>,
  _content: Scannable,
  _requestId: string,
): Promise<Omit<DetectorResult, "detector" | "durationMs">> {
  const typed = validate(config);
  // Touch typed to keep the symbol referenced; remove when wire impl lands.
  void typed;
  throw new Error(
    "csam-shield: PhotoDNA adapter is a scaffold stub. Wire-protocol " +
      "implementation depends on an approved PhotoDNA application. See " +
      "https://github.com/digitalharm/fight-csam/blob/main/docs/roadmap.md.",
  );
}

function validate(config: Record<string, unknown>): PhotoDNAConfig {
  if (typeof config.apiKey !== "string" || config.apiKey.length === 0) {
    throw new Error("photodna config: apiKey is required (non-empty string)");
  }
  const endpoint = config.endpoint;
  if (endpoint !== undefined && typeof endpoint !== "string") {
    throw new Error("photodna config: endpoint must be a string if provided");
  }
  return {
    apiKey: config.apiKey,
    ...(typeof endpoint === "string" ? { endpoint } : {}),
  };
}
