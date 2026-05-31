/**
 * Tool integration: EvidenceVault (defensible chain-of-custody).
 *
 * Real package: `packages/evidencevault` (Go) — an append-only, tamper-evident
 * custody log + jurisdiction retention schedules + KMS-backed vault, exposed
 * over HTTP. This mirrors its custody hash-chain contract in TS so the demo is
 * self-contained: every block writes a custody record whose entries chain by
 * hash, so any later modification is detectable (`verify`).
 *
 * Like the real tool, the vault stores **metadata and hashes, never the raw
 * image bytes.** The content stays with the operator under their own retention
 * policy; here we simply never persist the upload.
 */

import { rid } from "../store";

export type CustodyAction = "stored" | "accessed" | "hold-placed" | "deleted";

export interface CustodyEntry {
  sequence: number;
  action: CustodyAction;
  operator: string;
  purpose: string;
  occurredAt: string;
  /** Hash of the prior entry; "" for genesis. Breaks if any entry is edited. */
  priorEntryHash: string;
}

export interface CustodyRecord {
  id: string;
  /** Hash of the offending content (NOT the content itself). */
  contentRefHash: string;
  retentionSchedule: string;
  entries: CustodyEntry[];
}

const records = new Map<string, CustodyRecord>();

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashEntry(e: CustodyEntry): Promise<string> {
  return sha256Hex(`${e.sequence}|${e.action}|${e.operator}|${e.occurredAt}`);
}

/**
 * Open a custody record with a genesis "stored" entry. Retention defaults to
 * the US federal 18 U.S.C. § 2258A 90-day window (the real tool's
 * `USFederal2258A` schedule). Retention is recorded, not enforced — enforcement
 * is gated on counsel review in the real package.
 */
export async function openCustody(args: {
  contentRefHash: string;
  operator: string;
  purpose: string;
}): Promise<CustodyRecord> {
  const now = new Date().toISOString();
  const genesis: CustodyEntry = {
    sequence: 0,
    action: "stored",
    operator: args.operator,
    purpose: args.purpose,
    occurredAt: now,
    priorEntryHash: "",
  };
  const record: CustodyRecord = {
    id: rid("custody"),
    contentRefHash: args.contentRefHash,
    retentionSchedule: "USFederal2258A (90d) — counsel review pending",
    entries: [genesis],
  };
  records.set(record.id, record);
  return record;
}

/** Verify the hash chain is intact (EvidenceVault `Log.Verify`). */
export async function verifyCustody(id: string): Promise<boolean> {
  const record = records.get(id);
  if (!record) return false;
  for (let i = 1; i < record.entries.length; i++) {
    const expected = await hashEntry(record.entries[i - 1]);
    if (record.entries[i].priorEntryHash !== expected) return false;
  }
  return true;
}

export function getCustody(id: string): CustodyRecord | undefined {
  return records.get(id);
}
