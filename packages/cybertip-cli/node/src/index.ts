/**
 * @digitalharm/cybertip-cli
 *
 * NCMEC CyberTipline report submission as a library and CLI.
 *
 * Status: see https://github.com/digitalharm/digitalharm-oss/blob/main/docs/roadmap.md
 * Counsel scope: ../docs/counsel-scope-brief.md
 * Safety: https://github.com/digitalharm/digitalharm-oss/blob/main/docs/safety-policy.md
 *
 * Scaffold stage: data model, validation, redaction, and the audit-
 * log shape are implemented. Production submission is gated on
 * counsel review and an active NCMEC ESP credential.
 */

export * from "./model/report.js";
export { submitDryRun } from "./submit.js";
