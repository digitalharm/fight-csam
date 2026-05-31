import type { DetectorConfig, DetectorResult, Scannable } from "../types.js";
import { runPhotoDNA } from "./photodna.js";
import { runCloudflareCSAMScanning } from "./cloudflare.js";
import { runNCMECHash } from "./ncmec.js";
import { runPDQ } from "./pdq.js";
import { runCustom } from "./custom.js";

/**
 * Dispatch a single detector with timeout + error containment.
 */
export async function runDetector(
  config: DetectorConfig,
  content: Scannable,
  requestId: string,
): Promise<DetectorResult> {
  const startedAt = performance.now();
  const timeoutMs = config.timeoutMs ?? 5000;

  try {
    const result = await withTimeout(
      dispatch(config, content, requestId),
      timeoutMs,
      config.detector,
    );
    return {
      ...result,
      detector: config.detector,
      durationMs: Math.round(performance.now() - startedAt),
    };
  } catch (err) {
    return {
      detector: config.detector,
      matched: false,
      durationMs: Math.round(performance.now() - startedAt),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function dispatch(
  config: DetectorConfig,
  content: Scannable,
  requestId: string,
): Promise<Omit<DetectorResult, "detector" | "durationMs">> {
  switch (config.detector) {
    case "photodna":
      return runPhotoDNA(config.config, content, requestId);
    case "cloudflare-csam-scanning":
      return runCloudflareCSAMScanning(config.config, content, requestId);
    case "ncmec-hash":
      return runNCMECHash(config.config, content, requestId);
    case "pdq":
      return runPDQ(config.config, content, requestId);
    case "iwf-hash":
    case "arachnid-hash":
    case "thorn-safer":
    case "hive-ai":
      throw new Error(
        `csam-shield: detector '${config.detector}' is not yet implemented in this scaffold. ` +
          `See https://github.com/digitalharm/digitalharm-oss/blob/main/docs/roadmap.md for status.`,
      );
    case "custom":
      return runCustom(config.config, content, requestId);
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  detector: string,
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`${detector} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }
}
