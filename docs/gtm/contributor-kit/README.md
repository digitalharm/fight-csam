# Contributor-acquisition kit (STAGED — not live)

These files were produced by the GTM council (`gtm-acquisition-council`, run `wf_dbedf3eb-af1`) as the contributor pillar of the [marketing & acquisition plan](../marketing-acquisition-plan.md). They are **staged here on purpose** — they are inert until promoted to the repo root, where GitHub reads `.github/` and `CONTRIBUTING.md`.

```
CONTRIBUTING.md
.github/ISSUE_TEMPLATE/config.yml
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/PULL_REQUEST_TEMPLATE.md
```

## Before promoting — reconcile + verify

1. **The repo already has a root `CONTRIBUTING.md` + `.github/ISSUE_TEMPLATE/` + `PULL_REQUEST_TEMPLATE.md`** (currently **untracked** — created in a prior session, never committed). That existing set already has good CSAM-aware routing (`security@digitalharm.org` private channel, `report.cybertip.org` for real CSAM, a conformance-mismatch template, Discussions, `conduct@digitalharm.org`). **Diff the two and keep the best of each** — do not blindly overwrite. The council version is longer/more detailed; the existing version is already wired and tested in spirit.

2. **Confirm the sensitive-report channel actually routes before going live.** Both versions send CSAM/abuse/security reports to `security@digitalharm.org`. On a public CSAM-safety repo, a report that silently goes nowhere is a real-world safety failure. Either confirm that mailbox is monitored, **or** (recommended) enable **GitHub Private Vulnerability Reporting** for the repo and point `config.yml` at the Security tab — it always works and needs no mailbox:
   ```bash
   gh api -X PATCH repos/digitalharm/fight-csam --field security_and_analysis='{"secret_scanning":{"status":"enabled"}}'
   # then: repo Settings → Security → enable "Private vulnerability reporting"
   ```

3. **Promote** (once reconciled + routing confirmed):
   ```bash
   cp docs/gtm/contributor-kit/CONTRIBUTING.md CONTRIBUTING.md
   cp -r docs/gtm/contributor-kit/.github/. .github/
   git add CONTRIBUTING.md .github && git commit -m "Activate contributor funnel"
   ```

Per the plan's Guardrails, the contributor on-ramp (templates, labels, good-first-issues) is **zero-owner-gated** and can ship as soon as `v0.1` publish makes installs resolve — it does not wait on credentials.
