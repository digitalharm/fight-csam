/**
 * CyberTipline report data model.
 *
 * Mirrors the NCMEC ESP API specification (the "Submitting a Report"
 * section of the NCMEC industry-partner documentation). Field names
 * are SHOUTY_CASE to match the wire spec; the runtime carries the
 * canonical names so callers don't have to remember the protocol's
 * quirks.
 *
 * Scaffold stage: data model, validation, redaction. NO wire submission.
 * The submission path is gated on counsel review per
 * packages/cybertip-cli/docs/counsel-scope-brief.md.
 */

/**
 * The incident type as defined in the NCMEC API.
 *
 * Values are the literal codes the NCMEC API accepts; the labels are
 * for our own surface.
 */
export type IncidentType =
  | "child-pornography"
  | "online-enticement"
  | "child-sex-trafficking"
  | "child-sex-tourism"
  | "child-sexual-molestation"
  | "csam-distribution"
  | "ai-generated-csam";

/** Severity tier from the operator's first-line review. */
export type SeverityTier = "A" | "B" | "C" | "unknown";

/**
 * Incident details — the heart of the report.
 *
 * Carry only references to evidence, not the evidence itself. The
 * tool does NOT package or upload raw imagery; the upload path is
 * separate, runs after submission ID is issued, and is gated on
 * counsel review.
 */
export interface IncidentDetails {
  incidentType: IncidentType;
  /** ISO 8601 UTC. */
  incidentDateTimeIso: string;
  /** Free-text incident description (no imagery). */
  description: string;
  /** Operator's first-line severity tier. */
  severity: SeverityTier;
  /**
   * Pointers to evidence held by EvidenceVault or the operator's own
   * vault. Format: opaque URN; receiving system resolves.
   */
  evidenceRefs: string[];
}

export interface ReportingPerson {
  /** Operator org name. */
  orgName: string;
  /** ESP credential identifier issued by NCMEC. */
  espId: string;
  /** Contact email for follow-up. */
  contactEmail: string;
  /** Optional contact name. */
  contactName?: string;
}

export interface SuspectInfo {
  /** All fields optional; supplied only as confirmed. */
  ipAddresses?: string[];
  emailAddresses?: string[];
  screenNames?: string[];
  knownUrls?: string[];
}

export interface VictimInfo {
  /** A platform user identifier (NOT a real name in the wire payload). */
  victimUserRef?: string;
  /** Age if known and confirmed. */
  age?: number;
}

/**
 * A complete CyberTipline report ready for submission (or queued).
 */
export interface CyberTipReport {
  /**
   * Client-supplied idempotency key. The CLI generates one if not
   * supplied; required by the submission path to prevent
   * double-reporting on retry.
   */
  clientReference: string;
  reportingPerson: ReportingPerson;
  incident: IncidentDetails;
  suspect?: SuspectInfo;
  victim?: VictimInfo;
  /**
   * Free-form structured metadata the operator wants attached for
   * their own audit trail (not transmitted to NCMEC unless wrapped
   * into description per their policy).
   */
  operatorMetadata?: Record<string, unknown>;
}

/**
 * Validate a report's shape before submission. Returns a list of
 * human-readable errors; empty list means valid. Does NOT validate
 * the content — that's the operator's review.
 */
export function validateReport(report: CyberTipReport): string[] {
  const errors: string[] = [];

  if (!report.clientReference || report.clientReference.length === 0) {
    errors.push("clientReference is required (idempotency key)");
  } else if (!/^[A-Za-z0-9_.:-]{8,128}$/.test(report.clientReference)) {
    errors.push(
      "clientReference must be 8-128 chars, alphanumeric + _.-:",
    );
  }

  if (!report.reportingPerson.orgName) errors.push("reportingPerson.orgName required");
  if (!report.reportingPerson.espId) errors.push("reportingPerson.espId required");
  if (!/^[^@\s]+@[^@\s]+$/.test(report.reportingPerson.contactEmail ?? "")) {
    errors.push("reportingPerson.contactEmail invalid");
  }

  if (!report.incident.description || report.incident.description.length < 10) {
    errors.push("incident.description must be at least 10 chars");
  }
  if (!isIsoDateTime(report.incident.incidentDateTimeIso)) {
    errors.push("incident.incidentDateTimeIso must be ISO 8601");
  }
  if (report.incident.evidenceRefs.length === 0) {
    errors.push("incident.evidenceRefs must contain at least one pointer");
  }

  if (report.victim?.age !== undefined) {
    if (!Number.isInteger(report.victim.age) || report.victim.age < 0 || report.victim.age > 17) {
      errors.push("victim.age must be an integer 0-17");
    }
  }

  return errors;
}

function isIsoDateTime(s: string | undefined): boolean {
  if (!s) return false;
  // Conservative ISO 8601 check (date + time + optional Z/offset).
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/.test(s);
}

/**
 * Generate a default client reference if the operator doesn't supply one.
 * Format: `cybertip-{epoch-ms}-{8 hex of crypto random}`.
 *
 * The CLI accepts an externally-supplied reference too — large
 * operators may want to plumb in their own correlation IDs.
 */
export function generateClientReference(now: () => number = Date.now): string {
  const epoch = now();
  const rand = crypto.getRandomValues(new Uint8Array(4));
  const hex = Array.from(rand)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `cybertip-${epoch}-${hex}`;
}

/**
 * Produce a redacted summary of a report safe for logging.
 * Strips contact details, evidence pointers (kept as count only),
 * and any operator metadata fields except keys.
 */
export function redactForLog(report: CyberTipReport): Record<string, unknown> {
  return {
    clientReference: report.clientReference,
    incidentType: report.incident.incidentType,
    severity: report.incident.severity,
    evidenceCount: report.incident.evidenceRefs.length,
    orgName: report.reportingPerson.orgName,
    metadataKeys: Object.keys(report.operatorMetadata ?? {}),
  };
}
