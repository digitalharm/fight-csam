# CyberTip CLI · Counsel scope brief

**Status:** Draft. To be reviewed by outside counsel with 18 U.S.C. § 2258A
experience before any production submission path lands. This document
defines the scope the tool will and will not cover, the open questions
counsel needs to resolve, and the operational handoffs.

## What the tool does

- Formats CyberTipline reports per the NCMEC ESP API specification
- Validates field shapes against the documented schema before submission
- Submits via HTTPS to NCMEC's sandbox (testing) and production endpoints
- Logs every submission with chain-of-custody metadata
- Retries idempotently on transient transport failures
- Holds outgoing reports under encryption at rest while pending

## What the tool does NOT do

- **Does not decide whether to report.** That decision is the platform's
  trust-and-safety operator's, with counsel input. The tool executes the
  submission once the human has decided.
- **Does not determine what content is CSAM.** Detection (via PhotoDNA,
  PDQ, AI classifiers) lives upstream in `csam-shield`. The tool consumes
  the detection result and the operator's reporting decision.
- **Does not retain evidence after submission.** Evidence retention is
  `evidencevault`'s job. The tool submits the report and hands the
  evidence pointer back to the platform's vault.
- **Does not provide legal advice.** Outputs include disclaimers; the
  CLI prints a counsel-review reminder on first run.

## Open questions for counsel

1. **Mandatory reporter scope.** The ESP framework applies to providers
   meeting the 2258A definition; CLI users may or may not. The CLI should
   refuse to submit if the operator has not affirmed their reporting
   status. What language should that affirmation use?
2. **Sandbox vs production endpoints.** NCMEC distinguishes test (CSP)
   vs production endpoints. The CLI should default to sandbox and require
   an explicit `--production` flag plus the affirmation above. Acceptable?
3. **Idempotency keys.** NCMEC accepts a client-supplied transaction
   reference. We should mandate one to prevent double-reporting on
   retry. What header should we use?
4. **Privilege at rest.** Reports queued locally before submission are
   privileged work product. Should they be encrypted with the operator's
   counsel's key, or under the operator's KMS?
5. **Audit log retention.** How long does the operator's audit log of
   submissions need to be retained? Does the federal preservation period
   for evidence (typically 90 days, extensible) apply to the audit log
   itself or only the underlying evidence?
6. **Cross-border.** A non-US operator may report to NCMEC anyway (NCMEC
   accepts international reports), but the documentation should be clear
   about jurisdiction. Counsel guidance on language?

## Handoff to outside counsel

The maintainer engages counsel at the start of Wave 4 (per
[docs/roadmap.md](../../../docs/roadmap.md) and the funding line in
[docs/outreach/lantern.md](../../../docs/outreach/lantern.md)). This
brief is the starting deck. Counsel review must complete before any
production submission path lands in the published package.

The scaffold below the `docs/` directory implements the data model and
validation logic only — no live submission code. Counsel approval gates
the next layer.
