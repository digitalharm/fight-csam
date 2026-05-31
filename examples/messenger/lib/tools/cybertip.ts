/**
 * Tool integration: CyberTip CLI (NCMEC CyberTipline reporting).
 *
 * Real package: `packages/cybertip-cli` (TS + Python) — builds a validated
 * NCMEC report, redacts it for logging, and submits in one of three modes:
 * `dry-run`, `sandbox` (simulate the POST, no live request), and `production`
 * (BLOCKED until outside counsel signs off). This mirrors that exact surface.
 *
 * The demo always uses **sandbox** mode: it validates and builds the wire
 * payload and returns the curl-equivalent that *would* be sent — it performs
 * NO network I/O and holds NO credentials. Production submission stays blocked
 * by design (18 U.S.C. § 2258A carries direct federal obligations).
 */

import { rid } from "../store";

export type SubmitMode = "dry-run" | "sandbox" | "production";

export const COUNSEL_REQUIRED_MESSAGE =
  "production submission is blocked at the CLI: outside counsel sign-off " +
  "required. Use dry-run or sandbox.";

export interface CyberTipReport {
  clientReference: string;
  incidentType: string;
  incidentDateTimeIso: string;
  description: string;
  severity: "A" | "B" | "C";
  evidenceRefs: string[];
}

export interface SubmitResult {
  mode: SubmitMode;
  ok: boolean;
  clientReference: string;
  /** SHOUTY_CASE wire payload per the NCMEC spec (never sent in this demo). */
  wirePayload: Record<string, unknown>;
  /** The curl-equivalent the operator would run; sandbox only. */
  curlPreview: string;
}

function toWire(r: CyberTipReport): Record<string, unknown> {
  return {
    CLIENT_REFERENCE: r.clientReference,
    INCIDENT: {
      TYPE: r.incidentType,
      DATETIME: r.incidentDateTimeIso,
      DESCRIPTION: r.description,
      SEVERITY: r.severity,
      EVIDENCE_REFS: r.evidenceRefs,
    },
  };
}

/**
 * File a report in sandbox mode. Returns the validated payload + curl preview.
 * `production` throws — the path is intentionally disabled.
 */
export function fileSandboxReport(args: {
  custodyId: string;
  matchedSource: string;
}): SubmitResult {
  const clientReference = rid("cybertip");
  const report: CyberTipReport = {
    clientReference,
    incidentType: "csam-image-match",
    incidentDateTimeIso: new Date().toISOString(),
    description:
      `Image upload matched a hash in the ${args.matchedSource} list via CSAM-Shield. ` +
      `Content withheld; see EvidenceVault custody ${args.custodyId}.`,
    severity: "A",
    evidenceRefs: [`urn:evidencevault:${args.custodyId}`],
  };
  const wirePayload = toWire(report);
  const sandboxUrl = process.env.NCMEC_SANDBOX_URL ?? "https://sandbox.report.example/ncmec";
  const curlPreview =
    `curl -X POST '${sandboxUrl}' ` +
    `-H 'Content-Type: application/json' ` +
    `-H 'Authorization: Basic <ESP_CREDENTIAL>' ` +
    `--data '${JSON.stringify(wirePayload)}'`;
  return { mode: "sandbox", ok: true, clientReference, wirePayload, curlPreview };
}
