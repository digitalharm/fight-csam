import type { CyberTipReport } from "./model/report.js";
import { redactForLog, validateReport } from "./model/report.js";

export interface DryRunResult {
  ok: boolean;
  errors: string[];
  redactedSummary: Record<string, unknown>;
  /** What the wire payload would be. Useful for audit before the real submit lands. */
  wirePayload: Record<string, unknown>;
}

/**
 * Validate a report and produce the wire payload that WOULD be submitted.
 * Does not perform any network I/O. Always safe to call.
 *
 * Retained for backward compatibility; `submit(report, "dry-run")` is the
 * mode-aware equivalent.
 */
export function submitDryRun(report: CyberTipReport): DryRunResult {
  const errors = validateReport(report);
  return {
    ok: errors.length === 0,
    errors,
    redactedSummary: redactForLog(report),
    wirePayload: toWirePayload(report),
  };
}

// ---------------------------------------------------------------------------
// v0.5: three-mode submission (dry-run / sandbox / production).
//
// There is intentionally NO real network path. dry-run and sandbox both
// perform zero network I/O; production is absent (not merely disabled) and
// throws. The project holds no ESP credentials and ships no default endpoint.
// ---------------------------------------------------------------------------

export type SubmitMode = "dry-run" | "sandbox" | "production";

/**
 * The exact error thrown when production submission is attempted. Production
 * cannot be enabled by a flag — it requires outside-counsel sign-off
 * (docs/counsel-scope-brief.md) and a real ESP credential, neither of which
 * lives in this package.
 */
export const COUNSEL_REQUIRED_MESSAGE =
  "counsel sign-off required: production CyberTipline submission is blocked until outside counsel signs off on packages/cybertip-cli/docs/counsel-scope-brief.md";

export class ProductionSubmitBlocked extends Error {
  constructor(message: string = COUNSEL_REQUIRED_MESSAGE) {
    super(message);
    this.name = "ProductionSubmitBlocked";
  }
}

export interface SubmitResult {
  ok: boolean;
  mode: SubmitMode;
  errors: string[];
  redactedSummary: Record<string, unknown>;
  wirePayload: Record<string, unknown>;
  /**
   * For sandbox mode with a valid report + resolved URL: the curl-equivalent
   * the operator runs themselves (with their own ESP credential). Empty string
   * for dry-run, or for sandbox when the report is invalid / no URL is given.
   */
  curlPreview: string;
  /** Human-readable audit lines (sandbox mode emits a SIMULATED marker). */
  logLines: string[];
}

/**
 * Mode-aware submission.
 *
 * - "dry-run" (default): validate + build the wire payload. No network, no curl.
 * - "sandbox": additionally emit the curl-equivalent for an operator-supplied
 *   sandbox URL (arg `sandboxUrl` or `NCMEC_SANDBOX_URL`). Performs NO network
 *   I/O — the operator runs the emitted request themselves. The Authorization
 *   header is always the `<ESP_CREDENTIAL>` placeholder; no real credential is
 *   ever read or emitted.
 * - "production": throws {@link ProductionSubmitBlocked}. The real POST path is
 *   absent by design.
 */
export function submit(
  report: CyberTipReport,
  mode: SubmitMode = "dry-run",
  sandboxUrl?: string,
): SubmitResult {
  if (mode === "production") {
    throw new ProductionSubmitBlocked();
  }

  const errors = validateReport(report);
  const redactedSummary = redactForLog(report);
  const wirePayload = toWirePayload(report);
  const logLines: string[] = [];
  let curlPreview = "";

  if (mode === "sandbox") {
    const url = sandboxUrl ?? process.env.NCMEC_SANDBOX_URL ?? "";
    if (!url) {
      errors.push(
        "sandbox mode needs a target URL: pass --sandbox-url or set NCMEC_SANDBOX_URL " +
          "(operator-supplied; there is no default — the project holds no ESP credentials).",
      );
    } else if (errors.length === 0) {
      curlPreview = buildCurlPreview(url, wirePayload);
      logLines.push(
        `SIMULATED sandbox submission to ${url} — NO network I/O was performed. ` +
          "Run the emitted curl yourself with a real ESP credential.",
      );
      logLines.push(`redacted summary: ${JSON.stringify(redactedSummary)}`);
    }
  }

  return {
    ok: errors.length === 0,
    mode,
    errors,
    redactedSummary,
    wirePayload,
    curlPreview,
    logLines,
  };
}

/** Build the curl-equivalent for the operator to run. Never emits a real credential. */
function buildCurlPreview(url: string, wirePayload: Record<string, unknown>): string {
  const body = JSON.stringify(wirePayload).replace(/'/g, "'\\''");
  return [
    `curl -X POST '${url}' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -H 'Authorization: Bearer <ESP_CREDENTIAL>' \\`,
    `  -d '${body}'`,
  ].join("\n");
}

function toWirePayload(report: CyberTipReport): Record<string, unknown> {
  // SHOUTY_CASE keys match the NCMEC API spec. Exact field names will
  // be confirmed against the current ESP specification PDF as part of
  // the counsel-review handoff.
  return {
    CLIENT_REFERENCE: report.clientReference,
    REPORTING_PERSON: {
      ORG_NAME: report.reportingPerson.orgName,
      ESP_ID: report.reportingPerson.espId,
      CONTACT_EMAIL: report.reportingPerson.contactEmail,
      ...(report.reportingPerson.contactName
        ? { CONTACT_NAME: report.reportingPerson.contactName }
        : {}),
    },
    INCIDENT: {
      TYPE: report.incident.incidentType,
      DATETIME: report.incident.incidentDateTimeIso,
      DESCRIPTION: report.incident.description,
      SEVERITY: report.incident.severity,
      EVIDENCE_REFS: report.incident.evidenceRefs,
    },
    ...(report.suspect ? { SUSPECT: report.suspect } : {}),
    ...(report.victim ? { VICTIM: report.victim } : {}),
  };
}
