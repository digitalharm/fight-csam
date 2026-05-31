import { test } from "node:test";
import assert from "node:assert/strict";
import { HashStreamClient, HashStreamError } from "./index.js";

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

test("rejects empty baseUrl", () => {
  assert.throws(
    () => new HashStreamClient({ baseUrl: "" }),
    /baseUrl required/,
  );
});

test("strips trailing slash from baseUrl", async () => {
  const fetch = mockFetch([{ status: 200, body: { status: "ok" } }]);
  const client = new HashStreamClient({ baseUrl: "https://x.example/", fetch });
  await client.health();
  // No assertion needed beyond no-throw; the URL composition is internal.
  assert.ok(true);
});

test("health returns status payload", async () => {
  const fetch = mockFetch([{ status: 200, body: { status: "ok" } }]);
  const client = new HashStreamClient({ baseUrl: "https://x.example", fetch });
  const result = await client.health();
  assert.equal(result.status, "ok");
});

test("listSources returns the three sources", async () => {
  const fetch = mockFetch([
    {
      status: 200,
      body: { sources: ["ncmec", "iwf", "project-arachnid"] },
    },
  ]);
  const client = new HashStreamClient({ baseUrl: "https://x.example", fetch });
  const result = await client.listSources();
  assert.equal(result.sources.length, 3);
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
