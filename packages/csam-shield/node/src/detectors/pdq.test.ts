import { test } from "node:test";
import assert from "node:assert/strict";
import { createShield } from "../index.js";
import { createPdqListDetector, hammingDistance, runPDQ } from "./pdq.js";
import type { Scannable } from "../types.js";

/**
 * Deterministic, inline synthetic hashes. We do NOT depend on
 * detectkit-test (Python) or hashkit (not yet merged); these are just
 * raw byte arrays so the matching logic is exercisable on its own.
 */
const HASH_LEN = 32;

function makeHash(seed: number): Uint8Array {
  const out = new Uint8Array(HASH_LEN);
  for (let i = 0; i < HASH_LEN; i++) out[i] = (seed + i * 7) & 0xff;
  return out;
}

/** Flip `n` bits in the first bytes of a copy of `hash`. */
function flipBits(hash: Uint8Array, n: number): Uint8Array {
  const out = hash.slice();
  for (let i = 0; i < n; i++) {
    const byte = i >> 3;
    const bit = i & 7;
    out[byte] = (out[byte] as number) ^ (1 << bit);
  }
  return out;
}

const bytes = (data: Uint8Array): Scannable => ({
  kind: "image-bytes",
  data,
  contentType: "image/jpeg",
});

test("hammingDistance counts differing bits and guards length mismatch", () => {
  assert.equal(hammingDistance(new Uint8Array([0b0000]), new Uint8Array([0b0000])), 0);
  assert.equal(hammingDistance(new Uint8Array([0b1010]), new Uint8Array([0b0101])), 4);
  assert.equal(hammingDistance(new Uint8Array([0xff]), new Uint8Array([0x00])), 8);
  assert.equal(
    hammingDistance(new Uint8Array([1, 2]), new Uint8Array([1])),
    Number.POSITIVE_INFINITY,
  );
});

test("runPDQ matches an in-list hash within threshold (exact)", async () => {
  const known = makeHash(10);
  const result = await runPDQ(
    { knownBad: [makeHash(200), known], threshold: 0, hash: known },
    bytes(new Uint8Array([1, 2, 3])),
    "req-1",
  );
  assert.equal(result.matched, true);
  assert.equal(result.confidence, 1);
});

test("runPDQ matches a near hash within threshold", async () => {
  const known = makeHash(10);
  const near = flipBits(known, 5); // 5 bits different
  const result = await runPDQ(
    { knownBad: [known], threshold: 10, hash: near },
    bytes(new Uint8Array([9])),
    "req-2",
  );
  assert.equal(result.matched, true);
  assert.match(result.reasoning ?? "", /minHamming=5/);
});

test("runPDQ does NOT match a hash outside threshold", async () => {
  const known = makeHash(10);
  const far = flipBits(known, 40); // 40 bits different
  const result = await runPDQ(
    { knownBad: [known], threshold: 10, hash: far },
    bytes(new Uint8Array([9])),
    "req-3",
  );
  assert.equal(result.matched, false);
  assert.equal(result.confidence, undefined);
});

test("runPDQ threshold boundary is inclusive", async () => {
  const known = makeHash(10);
  const edge = flipBits(known, 10); // exactly 10 bits different
  const at = await runPDQ(
    { knownBad: [known], threshold: 10, hash: edge },
    bytes(new Uint8Array([0])),
    "req-4a",
  );
  assert.equal(at.matched, true, "distance == threshold should match");

  const over = await runPDQ(
    { knownBad: [known], threshold: 9, hash: edge },
    bytes(new Uint8Array([0])),
    "req-4b",
  );
  assert.equal(over.matched, false, "distance > threshold should not match");
});

test("runPDQ accepts an async hash-list loader", async () => {
  const known = makeHash(42);
  const result = await runPDQ(
    { knownBad: async () => [known], threshold: 0, hash: known },
    bytes(new Uint8Array([0])),
    "req-5",
  );
  assert.equal(result.matched, true);
});

test("runPDQ derives a deterministic hash from bytes when none supplied", async () => {
  // The content-derived path has no precomputed hash. We assert the two
  // properties that matter for an exact-dedupe list (threshold 0):
  //   (a) identical input bytes always collide, and
  //   (b) different input bytes do not.
  // To build a known-bad entry equal to the content-derived hash without
  // exposing the internal fn, we recover it from a self-match: scan the
  // same bytes against a list seeded with the derived hash of those bytes,
  // which we obtain via `derivedHashOf` (a deterministic mirror of pdq.ts).
  const dataA = new Uint8Array([5, 6, 7, 8, 9, 10]);
  const dataB = new Uint8Array([99, 98, 97]);

  const emptyList = await runPDQ({ knownBad: [], threshold: 0 }, bytes(dataA), "req-6a");
  assert.equal(emptyList.matched, false, "empty list never matches");

  const sameBytes = await runPDQ(
    { knownBad: [derivedHashOf(dataA)], threshold: 0 },
    bytes(dataA),
    "req-6b",
  );
  assert.equal(sameBytes.matched, true, "identical bytes match at threshold 0");

  const otherBytes = await runPDQ(
    { knownBad: [derivedHashOf(dataB)], threshold: 0 },
    bytes(dataA),
    "req-6c",
  );
  assert.equal(otherBytes.matched, false, "different bytes do not match at threshold 0");
});

/**
 * Deterministic mirror of `deriveSyntheticHash` in pdq.ts. Kept in
 * lockstep so the test can construct a known-bad entry that equals the
 * hash the detector derives from the same bytes. If pdq.ts's derivation
 * changes, update this and the test will keep its meaning.
 */
function derivedHashOf(data: Uint8Array): Uint8Array {
  const width = 32;
  const out = new Uint8Array(width);
  for (let i = 0; i < width; i++) out[i] = (i * 31 + 7) & 0xff;
  for (let i = 0; i < data.length; i++) {
    const lane = i % width;
    out[lane] = ((out[lane] as number) + (data[i] as number) * 131 + i) & 0xff;
  }
  let carry = 0;
  for (let i = 0; i < width; i++) {
    const mixed = ((out[i] as number) ^ ((carry << 3) | (carry >> 5))) & 0xff;
    out[i] = mixed;
    carry = mixed;
  }
  return out;
}

test("runPDQ on URL-only content asks for a precomputed hash", async () => {
  const result = await runPDQ(
    { knownBad: [makeHash(1)], threshold: 31 },
    { kind: "image-url", url: "https://example.test/a.jpg" },
    "req-7",
  );
  assert.equal(result.matched, false);
  assert.match(result.reasoning ?? "", /pre-computed hash/);
});

test("end-to-end: shield blocks an in-list hash and allows an out-of-list one", async () => {
  const bad = makeHash(123);
  const good = makeHash(7); // far from `bad`
  const operatorList = [bad, makeHash(250)];

  const blockingShield = createShield({
    detectors: [createPdqListDetector({ hashList: operatorList, threshold: 10, hash: bad })],
  });
  const blocked = await blockingShield.scan(bytes(new Uint8Array([0])));
  assert.equal(blocked.decision, "match");

  const allowingShield = createShield({
    detectors: [createPdqListDetector({ hashList: operatorList, threshold: 10, hash: good })],
  });
  const allowed = await allowingShield.scan(bytes(new Uint8Array([0])));
  assert.equal(allowed.decision, "nomatch");
});
