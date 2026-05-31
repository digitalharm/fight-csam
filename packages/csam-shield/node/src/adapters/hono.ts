/**
 * Hono adapter for csam-shield.
 *
 * Returns a Hono middleware that scans the upload and short-circuits
 * the request on block / error decisions. Hono runs on Bun, Deno,
 * Cloudflare Workers, and Node — the same middleware works in all
 * of them.
 */

import type { Shield, Scannable, MatchResponse } from "../index.js";

export interface HonoMiddlewareOptions {
  extract: (c: unknown) => Scannable | null | Promise<Scannable | null>;
  onBlock?: (response: MatchResponse, c: unknown) => Response | Promise<Response>;
  onError?: (response: MatchResponse, c: unknown) => Response | Promise<Response>;
}

export function honoMiddleware(
  shield: Shield,
  options: HonoMiddlewareOptions,
): (c: unknown, next: () => Promise<void>) => Promise<Response | undefined> {
  return async (c, next) => {
    const scannable = await options.extract(c);
    if (scannable === null) {
      await next();
      return undefined;
    }

    const response = await shield.scan(scannable);

    if (response.decision === "match" || response.decision === "pending") {
      return options.onBlock
        ? await options.onBlock(response, c)
        : defaultBlock(response);
    }

    if (response.decision === "error") {
      return options.onError
        ? await options.onError(response, c)
        : defaultError(response);
    }

    await next();
    return undefined;
  };
}

function defaultBlock(response: MatchResponse): Response {
  return new Response(
    JSON.stringify({
      error: "content-blocked",
      requestId: response.requestId,
      decision: response.decision,
    }),
    { status: 451, headers: { "content-type": "application/json" } },
  );
}

function defaultError(response: MatchResponse): Response {
  return new Response(
    JSON.stringify({
      error: "scan-failed",
      requestId: response.requestId,
    }),
    { status: 503, headers: { "content-type": "application/json" } },
  );
}
