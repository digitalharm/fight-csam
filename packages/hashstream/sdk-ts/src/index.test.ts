import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateKeyPairSync,
  sign as nodeSign,
  type KeyObject,
} from "node:crypto";
import {
  HashStreamClient,
  HashStreamError,
  snapshotSigningPayload,
  verifySnapshotSignature,
  type Snapshot,
} from "./index.js";

function mockFetch(
  responses: Array<{ status: number; body: unknown }>,
): typeof globalThis.fetch {
  let i = 0;
  return (async (_url: unknown, _init?: unknown) => {
    const r = responses[i++];
    if (!r) throw new Error("mockFetch exhausted");
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      statusText: String(r.status),
      json: async () => r.body,
      text: async () => (typeof r.body === "string" ? r.body : JSON.stringify(r.body)),
    } as unknown as Response;
  }) as unknown as typeof globalThis.fetch;
}

// Captures the last request so tests can assert method/body/url.
function recordingFetch(response: {
  status: number;
  body: unknown;
}): { fn: typeof globalThis.fetch; calls: Array<{ url: string; init: RequestInit | undefined }> } {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  const fn = (async (input: unknown, init?: unknown) => {
    calls.push({ url: String(input), init: init as RequestInit | undefined });
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: String(response.status),
      json: async () => response.body,
      text: async () =>
        typeof response.body === "string" ? response.body : JSON.stringify(response.body),
    } as unknown as Response;
  }) as unknown as typeof globalThis.fetch;
  return { fn, calls };
}

test("rejects empty baseUrl", () => {
  assert.throws(() => new HashStreamClient({ baseUrl: "" }), /baseUrl required/);
});

test("strips trailing slash from baseUrl", async () => {
  const fetch = mockFetch([{ status: 200, body: { status: "ok" } }]);
  const client = new HashStreamClient({ baseUrl: "https://x.example/", fetch });
  await client.health();
  assert.ok(true);
});

test("health returns status payload", async () => {
  const fetch = mockFetch([{ status: 200, body: { status: "ok" } }]);
  const client = new HashStreamClient({ baseUrl: "https://x.example", fetch });
  const result = await client.health();
  assert.equal(result.status, "ok");
});

test("listSources returns the sources", async () => {
  const fetch = mockFetch([
    { status: 200, body: { sources: ["ncmec", "iwf", "project-arachnid", "local"] } },
  ]);
  const client = new HashStreamClient({ baseUrl: "https://x.example", fetch });
  const result = await client.listSources();
  assert.equal(result.sources.length, 4);
  assert.ok(result.sources.includes("local"));
});

test("error response is wrapped in HashStreamError with status", async () => {
  const fetch = mockFetch([{ status: 404, body: { error: "not found" } }]);
  const client = new HashStreamClient({ baseUrl: "https://x.example", fetch });
  await assert.rejects(client.getSnapshot("missing"), (err: unknown) => {
    assert.ok(err instanceof HashStreamError);
    assert.equal((err as HashStreamError).status, 404);
    return true;
  });
});

test("putSnapshot POSTs the right body and returns the created snapshot", async () => {
  const created: Snapshot = {
    id: "local-1",
    source: "local",
    version: "",
    hash_count: 2,
    created_at: "2026-05-30T00:00:00Z",
    upstream_at: "0001-01-01T00:00:00Z",
    blob_uri: "",
    hashes_hex: ["aa".repeat(32), "bb".repeat(32)],
    signature: null,
  };
  const rec = recordingFetch({ status: 201, body: created });
  const client = new HashStreamClient({ baseUrl: "https://x.example", fetch: rec.fn });

  const got = await client.putSnapshot("local", "local-1", ["aa".repeat(32), "bb".repeat(32)]);
  assert.equal(got.id, "local-1");
  assert.equal(got.hash_count, 2);

  assert.equal(rec.calls.length, 1);
  const call = rec.calls[0]!;
  assert.equal(call.url, "https://x.example/sources/local/snapshots");
  assert.equal(call.init?.method, "POST");
  const sentBody = JSON.parse(String(call.init?.body));
  assert.deepEqual(sentBody, {
    snapshot_id: "local-1",
    hashes_hex: ["aa".repeat(32), "bb".repeat(32)],
  });
});

// --- signature verification --------------------------------------------------

function ed25519Pair(): { pubPem: string; privKey: KeyObject } {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pubPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  return { pubPem, privKey: privateKey };
}

// Build a snapshot and sign it the same way the Go server does, so the test
// exercises the real canonical-payload contract end-to-end.
function signedSnapshot(privKey: KeyObject, hashesHex: string[]): Snapshot {
  const snap: Snapshot = {
    id: "signed-1",
    source: "local",
    version: "",
    hash_count: hashesHex.length,
    created_at: "2023-11-14T22:13:20.000Z", // = unix 1700000000
    upstream_at: "0001-01-01T00:00:00Z",
    blob_uri: "",
    hashes_hex: hashesHex,
    signature: null,
    signing_key_id: "deadbeefdeadbeef",
  };
  const payload = Buffer.from(snapshotSigningPayload(snap), "utf8");
  const sig = nodeSign(null, payload, privKey);
  snap.signature = sig.toString("base64");
  return snap;
}

test("snapshotSigningPayload sorts hashes and uses unix seconds", () => {
  const snap: Snapshot = {
    id: "s",
    source: "local",
    version: "",
    hash_count: 2,
    created_at: "2023-11-14T22:13:20.000Z",
    upstream_at: "0001-01-01T00:00:00Z",
    blob_uri: "",
    hashes_hex: ["02".padEnd(64, "0"), "01".padEnd(64, "0")],
    signature: null,
  };
  const got = snapshotSigningPayload(snap);
  const want = `s\n${"01".padEnd(64, "0")}\n${"02".padEnd(64, "0")}\n1700000000`;
  assert.equal(got, want);
});

test("verifySnapshotSignature accepts a valid signature", async () => {
  const { pubPem, privKey } = ed25519Pair();
  const snap = signedSnapshot(privKey, ["11".repeat(32), "22".repeat(32)]);
  assert.equal(await verifySnapshotSignature(snap, pubPem), true);
});

test("client.verifySnapshotSignature accepts a valid signature", async () => {
  const { pubPem, privKey } = ed25519Pair();
  const snap = signedSnapshot(privKey, ["33".repeat(32)]);
  const client = new HashStreamClient({
    baseUrl: "https://x.example",
    fetch: mockFetch([{ status: 200, body: {} }]),
  });
  assert.equal(await client.verifySnapshotSignature(snap, pubPem), true);
});

test("verifySnapshotSignature rejects a tampered hash set", async () => {
  const { pubPem, privKey } = ed25519Pair();
  const snap = signedSnapshot(privKey, ["11".repeat(32), "22".repeat(32)]);
  snap.hashes_hex = ["11".repeat(32), "ff".repeat(32)];
  assert.equal(await verifySnapshotSignature(snap, pubPem), false);
});

test("verifySnapshotSignature rejects the wrong key", async () => {
  const { privKey } = ed25519Pair();
  const other = ed25519Pair();
  const snap = signedSnapshot(privKey, ["44".repeat(32)]);
  assert.equal(await verifySnapshotSignature(snap, other.pubPem), false);
});

test("verifySnapshotSignature returns false when unsigned", async () => {
  const { pubPem } = ed25519Pair();
  const snap = signedSnapshot(ed25519Pair().privKey, ["55".repeat(32)]);
  snap.signature = null;
  assert.equal(await verifySnapshotSignature(snap, pubPem), false);
});
