import { test } from "node:test";
import assert from "node:assert/strict";
import { createShield } from "./index.js";

test("createShield rejects empty detector list", () => {
  assert.throws(() => createShield({ detectors: [] }), /zero detectors/);
});

test("createShield accepts a custom detector and runs it", async () => {
  const shield = createShield({
    detectors: [
      {
        detector: "custom",
        config: {
          scan: async () => ({ matched: false, confidence: 0.01 }),
          displayName: "test",
        },
      },
    ],
    strategy: "any-match",
  });

  const result = await shield.scan({
    kind: "image-bytes",
    data: new Uint8Array([0xff, 0xd8, 0xff]),
    contentType: "image/jpeg",
  });

  assert.equal(result.decision, "nomatch");
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0]?.matched, false);
});

test("createShield with consensus strategy requires all matches", async () => {
  const shield = createShield({
    detectors: [
      { detector: "custom", config: { scan: async () => ({ matched: true }) } },
      { detector: "custom", config: { scan: async () => ({ matched: false }) } },
    ],
    strategy: "consensus",
  });

  const result = await shield.scan({
    kind: "image-bytes",
    data: new Uint8Array([0]),
    contentType: "image/jpeg",
  });

  assert.equal(result.decision, "nomatch");
});

test("createShield with any-match short-circuits on first match", async () => {
  const shield = createShield({
    detectors: [
      { detector: "custom", config: { scan: async () => ({ matched: false }) } },
      { detector: "custom", config: { scan: async () => ({ matched: true, confidence: 0.99 }) } },
    ],
    strategy: "any-match",
  });

  const result = await shield.scan({
    kind: "image-bytes",
    data: new Uint8Array([0]),
    contentType: "image/jpeg",
  });

  assert.equal(result.decision, "match");
});

test("detector timeout is contained, returns error result not throw", async () => {
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
        timeoutMs: 50,
      },
    ],
  });

  const result = await shield.scan({
    kind: "image-bytes",
    data: new Uint8Array([0]),
    contentType: "image/jpeg",
  });

  assert.equal(result.decision, "error");
  assert.match(result.results[0]?.error ?? "", /timed out/);
});

test("onDecision audit-log failure does not break the request path", async () => {
  const shield = createShield({
    detectors: [
      { detector: "custom", config: { scan: async () => ({ matched: false }) } },
    ],
    onDecision: async () => {
      throw new Error("audit log unavailable");
    },
  });

  // Should not throw.
  const result = await shield.scan({
    kind: "image-bytes",
    data: new Uint8Array([0]),
    contentType: "image/jpeg",
  });
  assert.equal(result.decision, "nomatch");
});
