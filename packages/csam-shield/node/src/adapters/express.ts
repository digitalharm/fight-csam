/**
 * Express adapter for csam-shield.
 *
 * Returns a middleware function that scans the upload (assumes the
 * platform's upload handler has placed the buffer on `req.file` or
 * similar) and gates the request based on the shield decision.
 *
 * Adopters integrate one of three ways:
 *   1. Manual: call shield.scan() in their own handler
 *   2. Adapter middleware (this file)
 *   3. Generic platform helpers (TODO)
 *
 * The adapter is intentionally framework-aware but does not pin a
 * specific upload library — the platform brings its own multer /
 * busboy / formidable / etc. and feeds the bytes into the shield.
 */

import type { Shield, Scannable, MatchResponse } from "../index.js";

export interface ExpressMiddlewareOptions {
  /**
   * How to extract the scannable content from the request. Platforms
   * vary; this is the integration seam.
   *
   * Return `null` to skip scanning entirely (e.g. for routes that
   * don't carry image content).
   */
  extract: (req: unknown) => Scannable | null;
  /**
   * What to do when the shield returns "match" or "pending".
   * Defaults to responding 451 (Unavailable For Legal Reasons).
   */
  onBlock?: (response: MatchResponse, req: unknown, res: unknown) => void | Promise<void>;
  /**
   * What to do when the shield errors. Defaults to responding 503.
   */
  onError?: (response: MatchResponse, req: unknown, res: unknown) => void | Promise<void>;
}

/**
 * Create an Express middleware. The actual `req`/`res`/`next` types
 * are intentionally unknown here so the package doesn't pin a
 * specific @types/express version.
 */
export function expressMiddleware(
  shield: Shield,
  options: ExpressMiddlewareOptions,
): (req: unknown, res: unknown, next: () => void) => Promise<void> {
  return async (req, res, next) => {
    const scannable = options.extract(req);
    if (scannable === null) {
      next();
      return;
    }

    const response = await shield.scan(scannable);

    if (response.decision === "match" || response.decision === "pending") {
      if (options.onBlock) {
        await options.onBlock(response, req, res);
      } else {
        defaultBlock(response, res);
      }
      return;
    }

    if (response.decision === "error") {
      if (options.onError) {
        await options.onError(response, req, res);
      } else {
        defaultError(response, res);
      }
      return;
    }

    next();
  };
}

function defaultBlock(response: MatchResponse, res: unknown): void {
  // Cast to minimal Express-shaped response. The package doesn't
  // depend on @types/express, but Express's response object always
  // exposes .status() and .json().
  const r = res as { status: (n: number) => { json: (body: unknown) => void } };
  r.status(451).json({
    error: "content-blocked",
    requestId: response.requestId,
    decision: response.decision,
  });
}

function defaultError(response: MatchResponse, res: unknown): void {
  const r = res as { status: (n: number) => { json: (body: unknown) => void } };
  r.status(503).json({
    error: "scan-failed",
    requestId: response.requestId,
  });
}
