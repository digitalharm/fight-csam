/**
 * HashStream TypeScript SDK.
 *
 * Thin client over the HashStream HTTP API. Designed so the call
 * surface stays narrow and the wire shape is the source of truth —
 * mirrors the Go types in packages/hashstream/internal/store/.
 *
 * Status: see https://github.com/digitalharm/fight-csam/blob/main/docs/roadmap.md
 */

export type Source = "ncmec" | "iwf" | "project-arachnid" | "local";

export interface Snapshot {
  id: string;
  source: Source;
  version: string;
  hash_count: number;
  created_at: string;
  upstream_at: string;
  blob_uri: string;
  /**
   * Inline hash set as lowercase-hex 32-byte strings. Present for
   * operator-supplied ("local") snapshots; omitted for credentialed
   * upstream snapshots whose blob lives behind a separate fetch.
   */
  hashes_hex?: string[];
  /** Base64 Ed25519 signature over the canonical payload, or null if unsigned. */
  signature: string | null;
  /** Hex sha256 prefix of the signing public key, present only when signed. */
  signing_key_id?: string;
}

export interface Diff {
  from: Snapshot;
  to: Snapshot;
  added_n: number;
  removed_n: number;
  unchanged_n: number;
}

export interface HashStreamClientOptions {
  /** Base URL of the HashStream service, e.g. https://hashstream.example.com */
  baseUrl: string;
  /** Optional bearer token for authentication. */
  token?: string;
  /** Optional fetch implementation. Defaults to globalThis.fetch. */
  fetch?: typeof globalThis.fetch;
}

export class HashStreamClient {
  private readonly baseUrl: string;
  private readonly token: string | undefined;
  private readonly fetchFn: typeof globalThis.fetch;

  constructor(options: HashStreamClientOptions) {
    if (!options.baseUrl) {
      throw new Error("HashStreamClient: baseUrl required");
    }
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async health(): Promise<{ status: string }> {
    return this.request("/health");
  }

  async listSources(): Promise<{ sources: Source[] }> {
    return this.request("/sources");
  }

  async listSnapshots(source: Source): Promise<{ source: Source; snapshots: Snapshot[] }> {
    return this.request(`/snapshots/${encodeURIComponent(source)}`);
  }

  async latestSnapshot(source: Source): Promise<Snapshot> {
    return this.request<Snapshot>(`/snapshots/${encodeURIComponent(source)}/latest`);
  }

  async getSnapshot(id: string): Promise<Snapshot> {
    return this.request<Snapshot>(`/snapshot/${encodeURIComponent(id)}`);
  }

  async diff(fromId: string, toId: string): Promise<Diff> {
    return this.request<Diff>(
      `/diff/${encodeURIComponent(fromId)}/${encodeURIComponent(toId)}`,
    );
  }

  /**
   * Create an operator-supplied snapshot from a pre-encoded hash list.
   *
   * `hashesHex` is a list of hex-encoded 32-byte hashes (the newline-delimited
   * "hash file" format, already split into an array). The service stores it,
   * computes hash_count and created_at, and — when started with a signing key
   * — returns a signed snapshot.
   *
   * Returns the created Snapshot (HTTP 201).
   */
  async putSnapshot(source: Source, snapshotId: string, hashesHex: string[]): Promise<Snapshot> {
    return this.request<Snapshot>(`/sources/${encodeURIComponent(source)}/snapshots`, {
      method: "POST",
      body: { snapshot_id: snapshotId, hashes_hex: hashesHex },
    });
  }

  /**
   * Verify a snapshot's Ed25519 signature against an operator-supplied public
   * key (PEM SPKI "PUBLIC KEY"; raw or hex 32-byte keys are also accepted).
   *
   * Reconstructs the canonical payload exactly as the server signed it —
   * `id "\n" sortedHashesHexJoinedByNewline "\n" createdAtUnixSeconds` — and
   * checks the detached signature. Returns true on success, false if the
   * signature is absent or does not verify.
   *
   * Node-only: uses `node:crypto`.
   */
  async verifySnapshotSignature(snapshot: Snapshot, pubkeyPem: string): Promise<boolean> {
    return verifySnapshotSignature(snapshot, pubkeyPem);
  }

  private async request<T>(
    path: string,
    opts?: { method?: string; body?: unknown },
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const init: RequestInit = { method: opts?.method ?? "GET", headers };
    if (opts?.body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }
    const resp = await this.fetchFn(`${this.baseUrl}${path}`, init);
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new HashStreamError(resp.status, body || resp.statusText);
    }
    return (await resp.json()) as T;
  }
}

/**
 * Canonical signing payload for a snapshot. MUST match the Go implementation
 * in packages/hashstream/internal/signing byte-for-byte:
 *
 *   id "\n" hashesSerialized "\n" createdAtUnixSeconds
 *
 * where hashesSerialized is the lowercase-hex hashes, sorted ascending and
 * joined with "\n" (empty string when there are no hashes).
 */
export function snapshotSigningPayload(snapshot: Snapshot): string {
  const hashes = (snapshot.hashes_hex ?? []).map((h) => h.toLowerCase());
  hashes.sort();
  const created = Math.floor(Date.parse(snapshot.created_at) / 1000);
  if (!Number.isFinite(created)) {
    throw new Error(`verifySnapshotSignature: invalid created_at ${snapshot.created_at}`);
  }
  return `${snapshot.id}\n${hashes.join("\n")}\n${created}`;
}

/**
 * Standalone verifier (see HashStreamClient.verifySnapshotSignature).
 */
export async function verifySnapshotSignature(
  snapshot: Snapshot,
  pubkeyPem: string,
): Promise<boolean> {
  if (!snapshot.signature) return false;

  // Lazy import so the rest of the SDK stays isomorphic (browser-safe).
  const crypto = await import("node:crypto");

  const key = parsePublicKey(crypto, pubkeyPem);
  const payload = Buffer.from(snapshotSigningPayload(snapshot), "utf8");
  const sig = Buffer.from(snapshot.signature, "base64");
  try {
    return crypto.verify(null, payload, key, sig);
  } catch {
    return false;
  }
}

type NodeCrypto = typeof import("node:crypto");

function parsePublicKey(crypto: NodeCrypto, key: string): import("node:crypto").KeyObject {
  const trimmed = key.trim();
  if (trimmed.includes("BEGIN")) {
    return crypto.createPublicKey({ key: trimmed, format: "pem" });
  }
  // Accept raw 32-byte Ed25519 public keys provided as hex or base64 by
  // wrapping them in DER SPKI (the prefix is the fixed Ed25519 SPKI header).
  let raw: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    raw = Buffer.from(trimmed, "hex");
  } else {
    raw = Buffer.from(trimmed, "base64");
  }
  if (raw.length !== 32) {
    throw new Error("verifySnapshotSignature: public key must be PEM, 32 hex bytes, or base64 32 bytes");
  }
  const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
  const der = Buffer.concat([spkiPrefix, raw]);
  return crypto.createPublicKey({ key: der, format: "der", type: "spki" });
}

export class HashStreamError extends Error {
  constructor(public readonly status: number, message: string) {
    super(`HashStream ${status}: ${message}`);
    this.name = "HashStreamError";
  }
}
