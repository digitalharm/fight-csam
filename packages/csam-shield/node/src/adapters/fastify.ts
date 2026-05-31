/**
 * Fastify adapter for csam-shield.
 *
 * Returns a preHandler hook that scans the upload and short-circuits
 * the request on block / error decisions.
 */

import type { Shield, Scannable, MatchResponse } from "../index.js";

export interface FastifyHookOptions {
  extract: (req: unknown) => Scannable | null;
  onBlock?: (response: MatchResponse, req: unknown, reply: unknown) => void | Promise<void>;
  onError?: (response: MatchResponse, req: unknown, reply: unknown) => void | Promise<void>;
}

export function fastifyHook(
  shield: Shield,
  options: FastifyHookOptions,
): (req: unknown, reply: unknown) => Promise<void> {
  return async (req, reply) => {
    const scannable = options.extract(req);
    if (scannable === null) return;

    const response = await shield.scan(scannable);

    if (response.decision === "match" || response.decision === "pending") {
      if (options.onBlock) {
        await options.onBlock(response, req, reply);
      } else {
        defaultBlock(response, reply);
      }
      return;
    }

    if (response.decision === "error") {
      if (options.onError) {
        await options.onError(response, req, reply);
      } else {
        defaultError(response, reply);
      }
    }
  };
}

function defaultBlock(response: MatchResponse, reply: unknown): void {
  const r = reply as {
    code: (n: number) => { send: (body: unknown) => void };
  };
  r.code(451).send({
    error: "content-blocked",
    requestId: response.requestId,
    decision: response.decision,
  });
}

function defaultError(response: MatchResponse, reply: unknown): void {
  const r = reply as {
    code: (n: number) => { send: (body: unknown) => void };
  };
  r.code(503).send({
    error: "scan-failed",
    requestId: response.requestId,
  });
}
