import type {
  DetectorConfig,
  DetectorResult,
  RetryPolicy,
  Scannable,
  ShieldConfig,
} from "../types.js";
import { runPhotoDNA } from "./photodna.js";
import { runCloudflareCSAMScanning } from "./cloudflare.js";
import { runNCMECHash } from "./ncmec.js";
import { runPDQ } from "./pdq.js";
import { runCustom } from "./custom.js";

export { createPdqListDetector, hammingDistance, pdqHashToHex } from "./pdq.js";
export type { PDQConfig } from "./pdq.js";
export type { CustomConfig } from "./custom.js";

/** Shield-wide defaults threaded into each detector invocation. */
export interface DetectorRunDefaults {
  timeoutMs?: ShieldConfig["timeoutMs"];
  retryPolicy?: ShieldConfig["retryPolicy"];
}

/**
 * Dispatch a single detector with timeout, retry, and error containment.
 *
 * Each attempt is bounded by `timeoutMs` (per-detector override → shield
 * default → 5000). On throw/timeout the call is retried per the resolved
 * retry policy (per-detector override → shield default → none) with a
 * fixed backoff. A clean result is never retried. A detector that
 * exhausts its retries is contained as an `error` result rather than
 * throwing, so one bad detector never breaks the scan.
 */
export async function runDetector(
  config: DetectorConfig,
  content: Scannable,
  requestId: string,
  defaults: DetectorRunDefaults = {},
): Promise<DetectorResult> {
  const startedAt = performance.now();
  const timeoutMs = config.timeoutMs ?? defaults.timeoutMs ?? 5000;
  const retry = config.retryPolicy ?? defaults.retryPolicy;
  const maxRetries = retry && retry.maxRetries > 0 ? retry.maxRetries : 0;
  const backoffMs = retry?.backoffMs ?? 0;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
      lastErr = err;
      if (attempt < maxRetries && backoffMs > 0) {
        await delay(backoffMs);
      }
    }
  }

  const baseMessage = lastErr instanceof Error ? lastErr.message : String(lastErr);
  return {
    detector: config.detector,
    matched: false,
    durationMs: Math.round(performance.now() - startedAt),
    error:
      maxRetries > 0
        ? `${baseMessage} (after ${maxRetries + 1} attempts)`
        : baseMessage,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type { RetryPolicy };

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
          `See https://github.com/digitalharm/fight-csam/blob/main/docs/roadmap.md for status.`,
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
