import { test } from "node:test";
import assert from "node:assert/strict";
import { createShield, createPdqListDetector } from "../index.js";
import type { Scannable, Shield } from "../index.js";
import { expressMiddleware } from "./express.js";
import { fastifyHook } from "./fastify.js";
import { honoMiddleware } from "./hono.js";

const HASH_LEN = 32;
function makeHash(seed: number): Uint8Array {
  const out = new Uint8Array(HASH_LEN);
  for (let i = 0; i < HASH_LEN; i++) out[i] = (seed + i * 7) & 0xff;
  return out;
}

const BAD = makeHash(123);
const GOOD = makeHash(7);
const OPERATOR_LIST = [BAD, makeHash(250)];

/** A shield wired to the operator list, primed with a specific query hash. */
function shieldFor(hash: Uint8Array): Shield {
  return createShield({
    detectors: [createPdqListDetector({ hashList: OPERATOR_LIST, threshold: 10, hash })],
  });
}

const scannable: Scannable = {
  kind: "image-bytes",
  data: new Uint8Array([0]),
  contentType: "image/jpeg",
};

// ---------------- Express ----------------

interface FakeRes {
  statusCode?: number;
  body?: unknown;
  status(n: number): { json(b: unknown): void };
}
function fakeRes(): FakeRes {
  const res: FakeRes = {
    status(n: number) {
      res.statusCode = n;
      return {
        json(b: unknown) {
          res.body = b;
        },
      };
    },
  };
  return res;
}

test("express adapter blocks an in-list image (451)", async () => {
  const mw = expressMiddleware(shieldFor(BAD), { extract: () => scannable });
  const res = fakeRes();
  let nextCalled = false;
  await mw({}, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false, "blocked request must not call next()");
  assert.equal(res.statusCode, 451);
  assert.deepEqual((res.body as { error: string }).error, "content-blocked");
});

test("express adapter allows an out-of-list image (next)", async () => {
  const mw = expressMiddleware(shieldFor(GOOD), { extract: () => scannable });
  const res = fakeRes();
  let nextCalled = false;
  await mw({}, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true, "clean request must call next()");
  assert.equal(res.statusCode, undefined, "clean request must not write a status");
});

test("express adapter skips scanning when extract returns null", async () => {
  let scanned = false;
  const probeShield: Shield = {
    detectors: [],
    async scan() {
      scanned = true;
      throw new Error("should not be called");
    },
  };
  const mw = expressMiddleware(probeShield, { extract: () => null });
  let nextCalled = false;
  await mw({}, fakeRes(), () => {
    nextCalled = true;
  });
  assert.equal(scanned, false);
  assert.equal(nextCalled, true);
});

// ---------------- Fastify ----------------

interface FakeReply {
  statusCode?: number;
  body?: unknown;
  code(n: number): { send(b: unknown): void };
}
function fakeReply(): FakeReply {
  const reply: FakeReply = {
    code(n: number) {
      reply.statusCode = n;
      return {
        send(b: unknown) {
          reply.body = b;
        },
      };
    },
  };
  return reply;
}

test("fastify hook blocks an in-list image (451)", async () => {
  const hook = fastifyHook(shieldFor(BAD), { extract: () => scannable });
  const reply = fakeReply();
  await hook({}, reply);
  assert.equal(reply.statusCode, 451);
  assert.deepEqual((reply.body as { error: string }).error, "content-blocked");
});

test("fastify hook allows an out-of-list image (no block)", async () => {
  const hook = fastifyHook(shieldFor(GOOD), { extract: () => scannable });
  const reply = fakeReply();
  await hook({}, reply);
  assert.equal(reply.statusCode, undefined, "clean request must not short-circuit");
});

// ---------------- Hono ----------------

test("hono middleware blocks an in-list image (451 Response)", async () => {
  const mw = honoMiddleware(shieldFor(BAD), { extract: () => scannable });
  let nextCalled = false;
  const res = await mw({}, async () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false, "blocked request must not call next()");
  assert.ok(res instanceof Response);
  assert.equal((res as Response).status, 451);
  const body = (await (res as Response).json()) as { error: string };
  assert.equal(body.error, "content-blocked");
});

test("hono middleware allows an out-of-list image (next, no Response)", async () => {
  const mw = honoMiddleware(shieldFor(GOOD), { extract: () => scannable });
  let nextCalled = false;
  const res = await mw({}, async () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true, "clean request must call next()");
  assert.equal(res, undefined, "clean request returns no Response");
});
