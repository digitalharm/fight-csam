/**
 * Tool integration: HashStream (hash-list version control + audit trail).
 *
 * Real package: `packages/hashstream` — a Go service that ingests operator
 * hash lists, versions them as signed snapshots, and serves diffs; plus a
 * TypeScript SDK (`@digitalharm/hashstream` / `packages/hashstream/sdk-ts`)
 * that this code mirrors. In production you point the SDK at the running
 * service; here we serve a seeded synthetic snapshot in-process so the demo
 * needs no sidecar.
 *
 * **Critical safety property (same as the real tool): this ships NO real CSAM
 * hash list.** The seeded "known-bad" entries are hashes of synthetic,
 * non-CSAM fixtures (see lib/tools/detectkit + public/fixtures) used purely to
 * demonstrate a positive match. Production operators load NCMEC / IWF / Project
 * Arachnid lists they are credentialed to hold.
 */

import { pdqHashFromBytes, type PdqHex } from "./hashkit";
import { knownBadFixtureBytes } from "./detectkit";

export type HashSource = "ncmec" | "iwf" | "project-arachnid" | "local";

export interface Snapshot {
  id: string;
  source: HashSource;
  hashCount: number;
  createdAt: string;
  /** The hex hashes in this snapshot (HashStream `Snapshot.hashes`). */
  hashes: PdqHex[];
}

// Seed a single "local" snapshot whose one entry is the hash of the synthetic
// flagged fixture. Computed at module load so it always matches what the
// "Try a flagged test image" button uploads.
function seedSnapshot(): Snapshot {
  const flaggedHash = pdqHashFromBytes(knownBadFixtureBytes());
  return {
    id: "local-2026-05-31",
    source: "local",
    hashCount: 1,
    createdAt: "2026-05-31T00:00:00Z",
    hashes: [flaggedHash],
  };
}

let SNAPSHOT: Snapshot | null = null;

/** Latest snapshot for a source (HashStream `/snapshots/{source}/latest`). */
export function latestSnapshot(): Snapshot {
  if (!SNAPSHOT) SNAPSHOT = seedSnapshot();
  return SNAPSHOT;
}

/** The reference hash set the matcher screens against. */
export function referenceHashes(): PdqHex[] {
  return latestSnapshot().hashes;
}
