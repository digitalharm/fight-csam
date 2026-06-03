/**
 * @digitalharm/cybertip-cli
 *
 * NCMEC CyberTipline report submission as a library and CLI.
 *
 * Status: see https://github.com/digitalharm/fight-csam/blob/main/docs/roadmap.md
 * Counsel scope: ../docs/counsel-scope-brief.md
 * Safety: https://github.com/digitalharm/fight-csam/blob/main/docs/safety-policy.md
 *
 * Data model, validation, redaction, dry-run wire payload, and a sandbox
 * simulation path are implemented. Production submission is absent by design,
 * gated on counsel review and an active NCMEC ESP credential.
 */

export * from "./model/report.js";
export {
  submitDryRun,
  submit,
  ProductionSubmitBlocked,
  COUNSEL_REQUIRED_MESSAGE,
} from "./submit.js";
export type { DryRunResult, SubmitMode, SubmitResult } from "./submit.js";
