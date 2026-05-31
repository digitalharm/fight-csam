import type { DetectorResult, Scannable } from "../types.js";

/**
 * Custom detector adapter. The escape hatch for adopters who need to
 * wire a detector csam-shield doesn't natively support — a private
 * model, an internal hash database, an experimental classifier.
 *
 * The config must include a `scan` function that returns a
 * DetectorResult-shaped object.
 */
export interface CustomConfig {
  scan: (
    content: Scannable,
    requestId: string,
  ) => Promise<{
    matched: boolean;
    confidence?: number;
    reasoning?: string;
  }>;
  /** Optional display name for logs. Defaults to "custom". */
  displayName?: string;
}

export async function runCustom(
  config: Record<string, unknown>,
  content: Scannable,
  requestId: string,
): Promise<Omit<DetectorResult, "detector" | "durationMs">> {
  const typed = validate(config);
  const result = await typed.scan(content, requestId);
  const out: Omit<DetectorResult, "detector" | "durationMs"> = {
    matched: result.matched,
  };
  if (result.confidence !== undefined) out.confidence = result.confidence;
  if (result.reasoning !== undefined) out.reasoning = result.reasoning;
  return out;
}

function validate(config: Record<string, unknown>): CustomConfig {
  if (typeof config.scan !== "function") {
    throw new Error("custom config: scan must be a function");
  }
  return {
    scan: config.scan as CustomConfig["scan"],
    ...(typeof config.displayName === "string"
      ? { displayName: config.displayName }
      : {}),
  };
}
