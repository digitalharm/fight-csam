/**
 * Tool integration: TrainGuard (pre-training dataset screening).
 *
 * Real package: `packages/trainguard` (Python) — screens a dataset (e.g. a
 * LAION-format manifest) against hash lists before any training compute, and
 * emits a signed `ComplianceReport` with chain-of-custody. This is a faithful
 * TS port of that scan + report contract for the demo's "export messages for
 * training" admin path. Production runs the real Python package (which reads
 * real LAION/WebDataset manifests and consumes HashStream snapshots) here.
 *
 * Motivated by the Stanford Internet Observatory's 2023 finding of CSAM in
 * LAION-5B: screen *before* the contaminated data is baked into a model.
 */

import { hamming, type PdqHex } from "./hashkit";
import { referenceHashes } from "./hashstream";
import { db } from "../store";
import { pdqHashFromBytes } from "./hashkit";

export interface ComplianceReport {
  reportId: string;
  datasetId: string;
  datasetSize: number;
  matchesTotal: number;
  flaggedItemIds: string[];
  sourcesConsulted: string[];
  scannedAtIso: string;
  /** Ed25519-style signature placeholder over the report's canonical fields. */
  signature: string;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Screen the current message corpus (the "export") against the hash list.
 * Each message becomes a synthetic dataset item whose hash is derived from its
 * id, except messages carrying an attachment, which use the real attachment
 * PDQ hash — so a previously-uploaded flagged image would be caught here too.
 */
export async function screenExport(threshold = 31): Promise<ComplianceReport> {
  const reference = referenceHashes();
  const channels = db.channels();
  const items: { id: string; hash: PdqHex }[] = [];
  for (const ch of channels) {
    for (const m of db.messages(ch.id)) {
      const hash = m.attachment?.pdqHex ?? pdqHashFromBytes(new TextEncoder().encode(m.id));
      items.push({ id: m.id, hash });
    }
  }

  const flagged: string[] = [];
  for (const item of items) {
    if (reference.some((ref) => hamming(item.hash, ref) <= threshold)) flagged.push(item.id);
  }

  const reportId = `tg-${Date.now().toString(36)}`;
  const datasetId = "messenger-export-synthetic";
  const scannedAtIso = new Date().toISOString();
  const signature = await sha256Hex(`${reportId}|${datasetId}|${items.length}|${flagged.length}|${scannedAtIso}`);

  return {
    reportId,
    datasetId,
    datasetSize: items.length,
    matchesTotal: flagged.length,
    flaggedItemIds: flagged,
    sourcesConsulted: ["local"],
    scannedAtIso,
    signature,
  };
}
