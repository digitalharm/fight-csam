# The golden path — a compliance-defensible CSAM pipeline

An ordered pipeline from "nothing" to a defensible posture. Each step is
conditional on what the developer is building (see SKILL.md Step 1) — an
AI-only startup skips the upload-middleware step; a Fediverse admin gets the
self-host path. Wire only the steps that apply.

## The steps

0. **Assess** — which laws apply (see `compliance-and-gates.md`) and which tools
   you need, in order. Output a short plan before writing code.
1. **Detect** — fingerprint incoming media (`hashkit`) and match it against the
   operator's known-bad list (`hashkit-match`), wired into the upload path via
   `csam-shield`. Distribute the list with `hashstream`. *You supply no list.*
2. **Report** — on a confirmed match, file to NCMEC (`cybertip-cli`). Stays on
   the sandbox/dry-run path until the credential + counsel gates clear.
3. **Preserve** — keep the reported material with chain-of-custody
   (`evidencevault`), retention unenforced until counsel clears it.
4. **Prevent** *(gen-AI)* — screen prompts (`promptshield`) and training data
   (`trainguard`) so abuse material is never generated or trained on.
5. **Provenance** *(gen-AI)* — mark generated media with C2PA credentials
   (`c2pa-lite`).
6. **Care** *(any manual review)* — protect reviewers with `safemod`
   (blur-by-default, exposure limits, k-anon telemetry).
7. **Verify** — prove the whole path in CI with synthetic fixtures
   (`detectkit-test`) — no real CSAM in the test suite, ever.

End with a short **compliance checklist** mapping each obligation to the
tool/step that satisfies it (the artifact a small platform shows a regulator).

## Build vs wrap (the locked split)

Build the CSAM-specific core with FightSAM; wrap best-in-class externals for
everything else. Full external details + verdicts in `ecosystem.md`.

| Layer | BUILD (FightSAM) | WRAP (recommend, don't rebuild) |
|---|---|---|
| Ingest / queue | — | BullMQ or RabbitMQ |
| Perceptual hashing | hashkit (PDQ/TMK/vPDQ) | Meta PDQ reference for conformance cross-check |
| Hash matching + FP-guard | hashkit-match | (Adobe Lattice-Extract pattern for grid/collage FP) |
| List transport | hashstream | NCMEC / IWF / Arachnid feeds (credential-gated) |
| Detection orchestration | csam-shield (pluggable detector registry) | PhotoDNA / Cloudflare CSAM Scanning / Google Content Safety API as detectors |
| General + novel classifiers | — | Granite Guardian, Llama Guard, ShieldGemma 2, CoPE, Google Content Safety API (novel CSAM) |
| Prompt / gen-AI safety | promptshield | Llama Prompt Guard 2 (injection), ShieldGemma 2 (output image) |
| Decisioning / rules | (adapter only) | **ROOST Osprey** (rules) + **Coop** (signal bus) |
| Reviewer surface + wellness | safemod (caps + k-anon) | Bluesky Ozone, Meta Content Review Filters |
| PII | — | Microsoft Presidio (bolt onto trainguard) |
| Reporting | cybertip-cli (counsel-gated) | NCMEC CyberTipline (sandbox now) |
| Evidence | evidencevault | KMS for encryption |
| Red-team / validation | (CSAM-intent probe pack, planned) | Garak / PyRIT / Promptfoo |
| Case management | — | (build — Marble/Owlculus are license-incompatible to vendor) |

**Do NOT build:** a rules engine, a PII engine, a general toxicity/text
classifier, an LLM-traffic gateway, a case-management platform, or any
disinformation/influence-ops tooling. Wrap or decline — and say so when a
developer asks for one.

## Platform-specific notes

- **Bluesky / AT-Proto:** `hepa` (Automod) hands rules raw blob bytes but ships
  no perceptual-hash hook — wrap hashkit+hashkit-match in a ~150-line hepa rule
  matching against a hashstream-served list, and emit labels/reports to **Ozone**.
  (A first-party adapter is on the roadmap; until then, this is the integration shape.)
- **Small platform:** csam-shield in the upload path + hashstream + cybertip-cli
  + evidencevault is the core quartet.
- **AI startup:** promptshield + ShieldGemma 2 + c2pa-lite; add csam-shield on
  any stored/served output.
