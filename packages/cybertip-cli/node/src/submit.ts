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
 * The production submit is intentionally not exposed yet — see the
 * counsel scope brief in packages/cybertip-cli/docs/.
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
