/**
 * HashStream TypeScript SDK.
 *
 * Thin client over the HashStream HTTP API. Designed so the call
 * surface stays narrow and the wire shape is the source of truth —
 * mirrors the Go types in packages/hashstream/internal/store/.
 *
 * Status: see https://github.com/digitalharm/digitalharm-oss/blob/main/docs/roadmap.md
 */

export type Source = "ncmec" | "iwf" | "project-arachnid";

export interface Snapshot {
  id: string;
  source: Source;
  version: string;
  hash_count: number;
  created_at: string;
  upstream_at: string;
  blob_uri: string;
  signature: string | null;
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

  private async request<T>(path: string): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const resp = await this.fetchFn(`${this.baseUrl}${path}`, { headers });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new HashStreamError(resp.status, body || resp.statusText);
    }
    return (await resp.json()) as T;
  }
}

export class HashStreamError extends Error {
  constructor(public readonly status: number, message: string) {
    super(`HashStream ${status}: ${message}`);
    this.name = "HashStreamError";
  }
}
