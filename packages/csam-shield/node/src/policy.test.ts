import { test } from "node:test";
import assert from "node:assert/strict";
import { createShield } from "./index.js";
import type { Scannable } from "./types.js";

const scannable: Scannable = {
  kind: "image-bytes",
  data: new Uint8Array([0]),
  contentType: "image/jpeg",
};

test("retryPolicy retries a flaky detector until it succeeds", async () => {
  let attempts = 0;
  const shield = createShield({
    detectors: [
      {
        detector: "custom",
        config: {
          scan: async () => {
            attempts++;
            if (attempts < 3) throw new Error("transient");
            return { matched: false };
          },
        },
        retryPolicy: { maxRetries: 3, backoffMs: 1 },
      },
    ],
  });

  const result = await shield.scan(scannable);
  assert.equal(attempts, 3, "should retry until the third attempt succeeds");
  assert.equal(result.decision, "nomatch");
  assert.equal(result.results[0]?.error, undefined);
});

test("retryPolicy gives up after maxRetries and reports the attempt count", async () => {
  let attempts = 0;
  const shield = createShield({
    detectors: [
      {
        detector: "custom",
        config: {
          scan: async () => {
            attempts++;
            throw new Error("always fails");
          },
        },
      },
    ],
    retryPolicy: { maxRetries: 2, backoffMs: 1 },
  });

  const result = await shield.scan(scannable);
  assert.equal(attempts, 3, "1 initial + 2 retries");
  assert.equal(result.decision, "error");
  assert.match(result.results[0]?.error ?? "", /after 3 attempts/);
});

test("shield-wide timeoutMs is applied when a detector has no override", async () => {
  const shield = createShield({
    detectors: [
      {
        detector: "custom",
        config: {
          scan: async () => {
            await new Promise((r) => setTimeout(r, 200));
            return { matched: false };
          },
        },
      },
    ],
    timeoutMs: 30,
  });

  const result = await shield.scan(scannable);
  assert.equal(result.decision, "error");
  assert.match(result.results[0]?.error ?? "", /timed out after 30ms/);
});

test("per-detector timeoutMs overrides the shield-wide default", async () => {
  const shield = createShield({
    detectors: [
      {
        detector: "custom",
        config: {
          scan: async () => {
            await new Promise((r) => setTimeout(r, 80));
            return { matched: false };
          },
        },
        timeoutMs: 200, // generous override beats the tight shield default
      },
    ],
    timeoutMs: 10,
  });

  const result = await shield.scan(scannable);
  assert.equal(result.decision, "nomatch");
});

test("onError 'deny' fails closed: a detector error forces a block", async () => {
  const shield = createShield({
    detectors: [
      {
        detector: "custom",
        config: {
          scan: async () => {
            throw new Error("provider down");
          },
        },
      },
    ],
    onError: "deny",
  });

  const result = await shield.scan(scannable);
  assert.equal(result.decision, "match", "fail-closed treats a failed scan as a hit");
});

test("onError 'allow' fails open: a detector error is treated as no-match", async () => {
  const shield = createShield({
    detectors: [
      {
        detector: "custom",
        config: {
          scan: async () => {
            throw new Error("provider down");
          },
        },
      },
    ],
    onError: "allow",
  });

  const result = await shield.scan(scannable);
  assert.equal(result.decision, "nomatch", "fail-open lets the request proceed");
});

test("onError 'allow' still matches when a clean detector matches", async () => {
  const shield = createShield({
    detectors: [
      {
        detector: "custom",
        config: {
          scan: async () => {
            throw new Error("provider down");
          },
        },
      },
      { detector: "custom", config: { scan: async () => ({ matched: true }) } },
    ],
    onError: "allow",
  });

  const result = await shield.scan(scannable);
  assert.equal(result.decision, "match");
});

test("default (no onError) preserves legacy error reporting", async () => {
  const shield = createShield({
    detectors: [
      {
        detector: "custom",
        config: {
          scan: async () => {
            throw new Error("provider down");
          },
        },
      },
    ],
  });

  const result = await shield.scan(scannable);
  assert.equal(result.decision, "error");
});
