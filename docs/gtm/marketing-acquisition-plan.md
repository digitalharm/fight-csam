# FightCSAM — Marketing & Customer-Acquisition Plan

> **Plan of record** for the FightCSAM open-source go-to-market. Authored by a 6-persona PM council + 3-judge synthesis (workflow `gtm-acquisition-council`, run `wf_dbedf3eb-af1`), 2026-06-05.
> Companion files in `docs/gtm/`; cold-start handoff in `docs/ops/gtm-acquisition-handoff.md`.
>
> **All outbound is gated** — see *Guardrails*: no outreach before v0.1 publish resolves installs; never the word "compliant"; never "beats Meta"; no mass GitHub issue/PR spam (human-written, <=5/week, "use"-verdict allies only, opt-out-respecting, gitignored ledger); no live legal-tier (cybertip real-submit / evidencevault retention) before NCMEC-ESP credentials **and** outside-counsel sign-off.
>
> _Note: the FightCSAM site is already merged and live at https://fightcsam.org — some source planning docs predate that and say "owner-gated on fightsam.org / unmerged branch."_

---


# FightCSAM — Customer-Acquisition Master Plan (v0.1 → v2.0)

**One sentence.** Make FightCSAM the answer a developer — or, increasingly, their AI coding agent — reaches for when told "add CSAM safety to my app," and earn the right to be that answer through conformance, restraint, and generosity, never reach-at-any-cost.

This synthesis takes the **DevRel funnel as the load-bearing spine**, governs all outbound with the **Ecosystem-Outreach anti-spam policy**, hangs the **Compliance legal-duty wedge + buyer-trust surfaces** off it as the "why now," stands on the **Community zero-gate hygiene + contribution on-ramp** as the credibility floor, and uses **Partnerships** as the connective tissue that sequences institutional vouches (ROOST → Lantern → NCMEC → reference logos) so each lowers the cost of the next. Every hard gate from the council's red flags is carried forward as a non-negotiable rule (see Guardrails).

---

## 1. Positioning & the wedge

**Developer/agent one-liner:** *"Open, auditable, self-hostable CSAM detect / report / prevent libraries you can install in 60 seconds — and an AI agent can wire automatically. You bring the credentialed hash list; we ship the engine and the plumbing."*

**Buyer (T&S lead / founder / counsel) one-liner:** *"Get to a defensible CSAM posture — detect known material, file the NCMEC report, keep a record of reasonable steps — without a Thorn contract, PhotoDNA vetting, or vendor lock-in. We help you meet the OSA / TAKE IT DOWN / §2258A duty; we never claim to make you compliant."*

**Three load-bearing claims (all defensible from ground truth):**
1. **No gate, no lock, no per-scan fee, Apache-2.0.** `cargo add` / `pip install` / `npm i` and run — vs PhotoDNA (vetting-gated), Thorn/Hive (paid, sales-gated), Cloudflare (lock-in). We ship **no hash list, ever** — the operator holds the credentialed NCMEC/IWF/Arachnid relationship. This both limits liability and signals we understand the threat model.
2. **Conformance-verified, not "better than Meta."** hashkit's PDQ is byte-tested against `facebook/ThreatExchange`'s C++ reference, CI fails closed on drift, vectors reproducible on a synthetic non-CSAM corpus — a credibility artifact **no incumbent offers**. Meta is **upstream and our conformance source**; hashkit's edge is framed only as Rust/WASM portability + NCMEC conformance vectors, never algorithm superiority.
3. **Agent-native by design.** A coding agent told "add CSAM scanning to my upload pipeline" reads `/llms.txt` → queries the manifest / docs-MCP → runs `create-fightcsam --profile bluesky|ai-startup|small-platform` → emits correct install + wiring **with the no-hash-list and "compliance-defensible, never compliant" caveats baked in.** No gated incumbent has an agent-consumable surface; the ethical rail travels *with* the artifact, so scaling reach does not scale risk.

**The two differentiators that compound:** the **agent-native surface** (lowest-cost reach for a solo maintainer — the agent does the integration labor) and the **conformance + attribution graph** (the human trust moat *and* the relationship engine). The same artifacts that make agents accurate (manifest, conformance vectors, golden-path spec, ecosystem directory) double as the credibility proof a risk-averse buyer and a funder demand.

---

## 2. Target segments (priority order, from the ICP)

- **Tier 1 — warmest beachhead: self-hosted / Fediverse + small-platform T&S engineers.** Orphaned by the **IFTAS CSAM-scanner shutdown (Mar 2025)** — no vendor, no budget, self-host by ideology (Apache-2.0 is a requirement). Entry tools: hashkit + hashkit-match behind a **hepa rule → Ozone**; the source of the first nameable reference adopter. Lead artifact: the AT-Proto adapter.
- **Tier 4 — highest-pressure AI generation** (the second beachhead): model hubs / inference hosts / open-weight labs under TAKE IT DOWN + Safety-by-Design + payment-processor pressure (Civitai, Fal.ai, Replicate, Black Forest Labs, Character.AI). Entry tools: promptshield (input) + csam-shield output mode + c2pa-lite. Lead surface: `create-fightcsam --profile ai-startup` + a synthetic-only HF Space.
- **Tier 2 — highest leverage: infrastructure / embedders** (one adopter → many platforms): Supabase template, media-SaaS add-ons. Slower, force-multiplying. Entry tool: hashkit-match (cdylib).
- **Tiers 3 & 5 — urgent-trigger UGC + mission-aligned** (creator/dating/gaming; INHOPE/academic): opportunistic, trigger-timed; not a near-term push.

The unifying ICP: *a small-to-mid platform or AI startup newly obligated by the 2024–2026 regulatory wave but locked out of the incumbents.* The legal duty is the wedge that turns "nice-to-have" into "must-ship-this-quarter."

**Explicitly NOT the ICP:** Big Tech with in-house T&S (they consume the open algorithms, never the product), existing Thorn/Hive/Cloudflare customers, no-media products, bad-faith operators (they are the threat our tools detect).

---

## 3. The four pillars

### Pillar A — USERS (DevRel spine: discover → install → first value → wire → reference)

**Approach.** Collapse time-to-first-value (TTFV) to under 60 seconds per language and make the **agent-native path the primary acquisition channel**, because in 2026 the "add CSAM scanning" task starts in a coding assistant, not a search bar. Sequence strictly against the release ladder; **promote nothing until v0.1 publish makes installs resolve** — a broken `cargo add` on a CSAM tool is worse than silence. Each persona gets one entry tool; every public demo uses `detectkit-test` synthetic fixtures only.

**Mechanics + tactics.**
- **v0.1 (owner-gated master action):** publish all 11 at `0.1.0` in dependency order (Rust dep-chain → 5 PyPI → 3 npm `@digitalharm/*` → **both** Go per-module tags); CI-on-tag so future releases publish automatically; fix the 3 wrong install strings in `apps/fightsam-site/app/tools/page.tsx` (verify the path at execution time — the site is on the unmerged `codex/fightsam-site` branch); verify every `install → run quickstart` from a clean machine.
- **v0.2:** ship the **agent-native baseline** (`/llms.txt`, `/llms-full.txt`, per-page raw `.md`, `/.well-known/fightsam.json` manifest, `/agents` conventions page that **explicitly states "no bundled hash list" and "compliance-defensible, never compliant"**); rewrite all 11 READMEs to **lead with the verified copy-paste install (final names) + a 5-line first-value snippet**; set precise GitHub topics (`csam-detection`, `perceptual-hashing`, `pdq`, `trust-and-safety`, `ncmec`, `online-safety`); publish + register the **csam-safety Claude Agent Skill** + a Cursor/Claude rules snippet (the single most differentiated acquisition asset — it already encodes the 11 tools, exact installs, build-vs-wrap split, and the no-hash-list rule).
- **v0.3:** publish **CONFORMANCE.md** (reproducible PDQ parity, CI drift-gate) as a first-class TTFV + trust artifact — a dev verifies our hashing matches Meta's in one command; ship per-tool `/docs` pages.
- **v0.4:** ship the `/golden-path` wizard + downloadable **compliance checklist**; promptshield **reasoning-trace verdicts** (defensibility, not a bare boolean); **land the hepa adapter** (the Tier-1 beachhead — see Ecosystem).
- **v0.5:** ship **create-fightcsam** (`npx`/`uvx`, interactive + `--json` agent mode + `--profile bluesky|ai-startup|small-platform`) generating a starter that **passes detectkit-test in CI out of the box**; demo `--profile ai-startup` as a synthetic-only Hugging Face Space.
- **v0.9:** ship the **docs MCP** (`search_docs`/`get_tool`/`get_golden_path`/`get_compliance`) so an agent answers "how do I add CSAM scanning" cold; add a GitHub Action + Supabase storage-hook template (embed-into-existing-workflows growth engine, the Trivy/Semgrep lesson).
- **v1.0:** **one disciplined Show HN / dev.to launch**, civic framing, lead with threat-model depth + conformance, maintainer present to engage critics — hard-gated on three simultaneously-true conditions: airtight install + complete golden path + ≥1 named reference logo.

**Channels:** package registries (crates.io / PyPI / npm keywords+categories, docs.rs, pkg.go.dev) as the primary discovery surface; the agent-native endpoints + csam-safety Skill + docs-MCP; create-fightcsam as a channel in itself; fightcsam.org docs; one disciplined Show HN/Lobste.rs/dev.to; GitHub Action + Supabase hook + synthetic-only HF Space; T&S distribution channels (TrustCon, TSPA/All-Tech-Is-Human Slacks, *Everything in Moderation* + *T&S Insider* newsletters) — value-first, never spam.

### Pillar B — CONTRIBUTORS (a downstream output of a great funnel + the bus-factor fix)

**Approach.** A solo, self-funded maintainer cannot run a community program, so **engineer the repo so one good contribution is cheap to make and cheap to review**, and convert the best early contributors into named co-maintainers (bus-factor is the top enterprise objection AND a funder discount). Keep the **safe surfaces wide open** (conformance reproduction, synthetic fixtures, docs, language bindings, thin adapters) and the **gated surfaces fenced** (anything touching real lists, statutory submit, retention enforcement) inside the contribution flow itself. Recruit narrowly and high-signal from self-selected T&S venues, not generic drive-bys.

**Mechanics + tactics.**
- **v0.1 (zero owner-gate — do TODAY):** fix the GitHub description typo **"FightSAM" → "FightCSAM"** and the stale README (drop "20-person platform" L7, sync statuses, point to fightcsam.org); add `.github/ISSUE_TEMPLATE/` (bug, conformance-discrepancy, design-proposal, docs) + a **PR template with a mandatory CSAM safety checklist** ("no real hashes/imagery/credentials; synthetic fixtures only"); expand labels beyond the 9 defaults with **domain** (`area:hashkit`, `area:conformance`, `area:csam-shield`, `area:promptshield`, `area:docs`, `area:connectors`), **difficulty** (`good-first-issue`, `help-wanted`), and **SAFETY-CRITICAL gate labels** (`needs-counsel`, `gated:credentialed`, `safety-sensitive`) that visibly fence the legal tier from drive-by PRs.
- **v0.1→v0.2:** hand-author the first 10–15 good-first-issues, each scoped to credential-free surfaces only, each with an acceptance test and a "why this is safe to work on" note; rewrite CONTRIBUTING from gate-only into a real on-ramp with a "pick your first issue" path, the safe-vs-gated surface map, 60-second dev setup per language, and an explicit **"contributions we are NOT taking"** section (no rules engine / PII / toxicity classifier / case-mgmt; nothing touching real lists; statutory submit paths).
- **v0.3 (flagship):** launch the **conformance-reproduction program** — a pinned "reproduce hashkit PDQ byte-identical on your OS/arch, synthetic vectors only" tracking issue. This is the single best good-first-issue in the project: safe-by-construction, high-status, and it directly satisfies the **roadmap's literal Beta gate** ("independent reproduction of the WASM build by ≥1 external contributor on a different OS"). Credit every reproducer by name.
- **v0.3→v0.5:** stand up recognition + governance — CONTRIBUTORS.md, a per-release "thanks to" line, a short GOVERNANCE.md naming the **never-PR-able CSAM invariants**; onboard the **first named co-maintainer** from the conformance-reproducer / connector-contributor pool.
- **v0.4→v0.5:** open contributor-friendly issues on the thin connector packages (`atproto-adapter`, `osprey-coop-adapter`, `csam-redteam`) — perfect "first real feature" work for people from those upstream communities; keep csam-shield's core refactor and create-fightcsam maintainer-led (single-writer, blast radius).
- **v1.0:** commission + publicly credit a **third-party security review (Trail of Bits / Cure53 class)**; document honest solo/small-team triage SLAs; weave the stated stewardship model into the launch narrative.
- **v2.0:** keep `legal-tier-ga` **contributor-CLOSED** (counsel-gated, highest blast radius); route would-be contributors to docs / test-vectors / jurisdiction-research.

**Channels:** GitHub (templates, curated good-first-issue board, labels, Discussions); the conformance/reproduction program; release-note shout-outs; All-Tech-Is-Human / TSPA Slacks + Bluesky/AT-Proto + ROOST dev communities (vetted, subject-matter-aware contributors); Stanford Internet Observatory / Trust & Safety Research Conference + TrustCon (the few high-signal contributors/advisors who matter).

### Pillar C — META outreach (deference + conformance + interop; never competition)

**Approach.** Meta is **upstream, our conformance source, and a ROOST co-founder** — the entire posture is technical credibility, never a beat-Meta claim, never a press-release ask. The enterprise/credibility value is the **conformance lineage itself**: "hashkit is conformance-tested byte-identical to `facebook/ThreatExchange` PDQ" is a procurement-grade trust statement. Outreach is low-frequency, high-substance, contribution-shaped, and **routed through ROOST** (Meta co-founded it) rather than cold-pinging Meta T&S (Big Tech consumes our algorithms, never our product). The realistic "win" is technical acknowledgement (a merged interop PR, a positive issue thread, being cited as a conformant implementation) — accept silence gracefully.

**Mechanics + tactics.**
- **v0.2–v0.3:** publish CONFORMANCE.md proving byte-identical PDQ parity with CI failing closed on drift; state plainly in every README and on the site that "PDQ/TMK/vPDQ are Meta's; hashkit conforms to them and does not compete"; **strip the residual raw-hashing-superiority claim** (already mandated for v0.2).
- **v0.3–v0.5:** file high-quality upstream issues/vectors to `facebook/ThreatExchange` / `python-threatexchange` **only where we find genuine, reproducible discrepancies** (signal, not noise) — earns standing without asking for anything.
- **v0.4:** contribute the **CSAM-intent red-team probe pack** to the Purple Llama / Garak / PyRIT / Promptfoo ecosystem (the generalist harnesses deliberately omit CSAM probes; our NCMEC-aware, counsel-conscious credibility uniquely qualifies us to author them responsibly); pair with crediting Llama Guard / Prompt Guard 2 / ShieldGemma 2 as recommended promptshield/csam-shield companions (wrap-and-credit, never reimplement).
- **v0.5:** ship the **python-threatexchange SignalExchangeAPI plugin** so Meta's pytx installed base points at hashstream **by configuration, not migration** — the concrete, deferential Meta-ecosystem bridge; adopt HMA's declarative ActionRule shape in csam-shield (build ON Meta's proven shapes, cite them).
- **v1.0+:** only after conformance + a reference adopter exist, make ONE low-key ask via the ROOST bridge — to be listed as a conformant open PDQ implementation, or to have a Meta safety engineer sanity-check the conformance methodology. Never imply endorsement.

**Channels:** `facebook/ThreatExchange` + `python-threatexchange` GitHub (substantive PRs/issues only); `meta-llama/PurpleLlama` (probe contributions); ROOST as the warm intermediary; Trust & Safety Research Conference / TrustCon (where Meta integrity engineers and the OSS-safety world overlap in person).

### Pillar D — ECOSYSTEM outreach (the awesome-safety-tools spine + merged-PR-as-outreach)

**Approach.** Win the single highest-ROI, lowest-reputational-risk discovery channel — **ONE value-first PR into `roostorg/awesome-safety-tools`** — and treat the 111 profiled projects (`fightcsam.org/docs/ecosystem`: **24 use / 35 learn-from / 39 reference / 13 out-of-scope**) as an **integration surface to credit and build on, not a list to spam.** The deeper play: **merged upstream contributions are the primary, spam-proof ecosystem channel** — a gift PR is opt-in, durable distribution, a contributor-recruiting funnel, and earns Meta/ROOST standing. The public directory is a **conformance + attribution graph and relationship engine**: accurate, generous crediting (Meta 10×, ROOST/Osprey, Bluesky/Ozone, Thorn, Presidio, IBM Granite) is the entry ticket to co-marketing and the defensible alternative to mass outreach.

**The hepa rule IS the marketing.** Shipping the **~150-line `atproto-adapter`** (hashkit + hashkit-match against an operator-supplied, hashstream-served list) + **Ozone label/report emitter** + a **safemod Ozone reviewer-pane skin** — with one 15-minute copy-paste "add CSAM matching to your hepa instance, synthetic fixtures only" guide — turns "11 interesting libraries" into a paste-and-run drop-in for the exact stack the #1 ICP already runs, in the documented IFTAS vacuum. It is **credential-free in the code** (the gated list stays the operator's), so it ships without NCMEC/counsel.

**Mechanics + tactics.**
- **v0.1:** pre-stage the awesome-safety-tools PR branch and the Tier-1 ally outreach drafts so they fire the minute names go live; do **nothing outbound** before publish.
- **v0.2:** merge the **ONE** `roostorg/awesome-safety-tools` PR (under the correct existing Hash-Matching / Classification / Reporting sections, leading with "conformance-tested against Meta PDQ / ships no hash list / Apache-2.0," crediting the upstreams already listed); publish/refresh `fightcsam.org/docs/ecosystem` (dated snapshot); PR into `awesome-rust`/`-python`/`-go` + relevant AppSec lists with precise one-liners — **never bulk-submit**.
- **v0.2–v0.3:** **Tier-1 "use"-verdict ally outreach** (24 max), batched **≤5/week**, individually written, framed as "we recommend your tool and send you traffic — did we characterize your entry right?" Lead with ROOST/Osprey, Bluesky/Ozone, Meta Content Review Filters (adoption not competition), IBM Granite, Microsoft Presidio. Reciprocal-credit, not asks; standing opt-out; gitignored outreach ledger.
- **v0.3:** **scope** the Bluesky/AT-Proto adapter (it only needs hashkit's PDQ, which lands here).
- **v0.4:** **land** the hepa adapter + Ozone emitter + safemod skin; **open the CSAM-intent red-team pack** as upstream-ready Garak/PyRIT/Promptfoo plugins (the PR *is* the outreach); open the Osprey/Coop adapter; post the 15-minute hepa guide **once** in the AT-Proto Discord + one maintainer bsky thread, and let it travel on merit.
- **v0.5:** ship the **python-threatexchange SignalExchangeAPI plugin** + a **FIRES-compatible advisory-feed** output, then notify only FIRES/FediMod and ROOST directly (interop, anti-bypass, "we interoperate so your users don't have to choose").
- **v0.9–v1.0:** convert the warmest IFTAS-orphaned Fediverse/Bluesky operator into the **ONE named reference-adopter logo** the launch gate requires.

**Channels:** the single `roostorg/awesome-safety-tools` PR; ROOST community (`community@roost.tools`, Discord) — partner + design-partner source; Bluesky/AT-Proto (Ozone + hepa) channels; `awesome-rust`/`-python`/`-go` + AppSec lists; merged upstream PRs (Garak/PyRIT/Promptfoo, python-threatexchange, Bluesky indigo) as the scalable, opt-in channel; `fightcsam.org/docs/ecosystem` as the credit-and-link asset.

**HARD LIMIT:** no mass/automated GitHub issue-or-PR spam across the 111. Do-not-contact list = all 13 out-of-scope + all 39 reference-only (many anonymous/low-provenance dataset dumps) + Big-Tech in-house T&S. Outreach restricted to the 24 "use" + a curated "learn-from" subset, only where there is genuine value to send. (See Guardrails.)

---

## 4. How it sequences across releases (two clocks)

**Engineering / adoption clock (reaches v1.0 without the legal tier):**
`v0.1 publish` (master gate — owner registry tokens + `@digitalharm` npm org + the overdue git-history scan) → `v0.2` be-findable + agent-ready + trust-stated (agent baseline, csam-safety Skill, READMEs, the ONE awesome PR, GitHub topics, engine-vendor repositioning) → `v0.3` the **conformance moat** (CONFORMANCE.md + drift-gate, the dependency root; gated only on synthetic-corpus sign-off — escalate it) + scope the hepa adapter + flagship conformance-reproduction good-first-issue → `v0.4` golden-path spec + wizard + **land the hepa beachhead** + open the red-team pack → `v0.5` create-fightcsam + legal-infra on credential-free dev/test paths with gates **visibly stubbed** → `v0.9` docs-MCP (FightCSAM as a live agent tool) → `v1.0` per-package API freeze + third-party security review + the **one disciplined launch** (gated on install + golden path + ≥1 reference logo).

**Legal / credential clock (longest lead — start NOW, runs alongside, never on the critical path):**
**Lantern outreach** (immediately *after* v0.1 publish + v0.3 conformance give it a live proof point) → **$25K counsel retainer** + the **NCMEC ESP introduction** (the in-kind win worth more than the cash) → only at **v2.0** do `cybertip-cli` (real submit) and `evidencevault` (enforced retention) open, behind **BOTH** NCMEC ESP credentials **AND** outside-counsel sign-off **+ ≥1 consented filing partner**. The entire un-gated portfolio is shippable to v1.0 without the credentialed tier — legal-tier GA is an additive unlock, communicated to funders that way.

**Ordering rule that governs everything:** a claim ships only after the capability **and** its gate are real; **"compliant" is never claimed at any rung**; contributor-funnel and beachhead enthusiasm never pull gated surfaces forward (red-team pack stays v0.4; legal tier stays v2.0).


---

## Release × Workstream matrix


# Release × Pillar Action Matrix

Each cell = the concrete action timed to that release. (v0.3/v0.4/v0.9 collapse into the v0.5 and v1.0 columns where the council placed the intermediate rungs; the spine actions are flagged with their true rung.)

| Release | USERS | CONTRIBUTORS | META | ECOSYSTEM |
|---|---|---|---|---|
| **v0.1** *(ship now — master gate)* | **Owner-gated publish** of all 11 at `0.1.0` (Rust dep-order → 5 PyPI → 3 npm `@digitalharm/*` → both Go per-module tags); CI-on-tag; **fix the 3 wrong install strings** in `apps/fightsam-site/app/tools/page.tsx` (verify path — site is on the unmerged branch); verify every install→quickstart from a clean machine. **Zero promotion.** | **Zero owner-gate, do TODAY:** fix GitHub description **"FightSAM"→"FightCSAM"**; refresh stale README (drop "20-person platform" L7, point to fightcsam.org); add `.github/ISSUE_TEMPLATE/` + PR template with a **mandatory CSAM safety checklist**; expand labels (domain + difficulty + **SAFETY-CRITICAL** `needs-counsel`/`gated:credentialed`/`safety-sensitive`). **Run the overdue full git-history secrets/CSAM/hash-list scan** (safety-check.sh only covers new commits). | Nothing yet. Privately verify the conformance harness reproduces on a clean machine so v0.3's claim is airtight. | **Pre-stage** the `roostorg/awesome-safety-tools` PR branch + Tier-1 ally drafts so they fire the minute names go live. **Nothing outbound.** |
| **v0.2** | Ship **agent-native baseline** (`/llms.txt`, `/llms-full.txt`, raw-md, `/.well-known/fightsam.json`, `/agents` page stating "no hash list / never compliant"); **rewrite all 11 READMEs** to lead with the verified install + 5-line snippet; set GitHub topics; publish + register the **csam-safety Claude Agent Skill** + Cursor/Claude rules snippet. | Hand-author the first **10–15 good-first-issues** (credential-free surfaces only, each with an acceptance test + "safe to work on" note); rewrite CONTRIBUTING into a real on-ramp with a **"contributions we are NOT taking"** section. | State "PDQ/TMK/vPDQ are Meta's; hashkit conforms, does not compete" in every README + site; **strip the raw-hashing-superiority claim** (engine-vendor repositioning). | **Merge the ONE** `roostorg/awesome-safety-tools` PR (after install strings are true); publish dated `/docs/ecosystem`; begin **Tier-1 "use"-ally outreach** (≤5/week, hand-written, opt-out, ledger); single precise PRs to `awesome-rust/-python/-go`. |
| **v0.5** *(incl. v0.3 conformance, v0.4 beachhead)* | **v0.3:** publish **CONFORMANCE.md** (reproducible PDQ parity + drift-gate) as a TTFV+trust artifact; per-tool `/docs`. **v0.4:** `/golden-path` wizard + downloadable compliance checklist; promptshield reasoning-trace verdicts. **v0.5:** ship **create-fightcsam** (`--json` + `--profile bluesky/ai-startup/small-platform`, starter passes detectkit-test in CI); synthetic-only **HF Space** for the ai-startup profile. | **v0.3 flagship:** launch the **conformance-reproduction program** (pinned cross-OS issue = the roadmap's Beta gate); credit reproducers by name. **v0.3→v0.5:** CONTRIBUTORS.md + per-release shout-outs + short **GOVERNANCE.md** (never-PR-able invariants); onboard the **first named co-maintainer**; open thin-adapter good-first-issues. | **v0.3–v0.5:** file high-quality upstream issues/vectors to `facebook/ThreatExchange` **only on genuine discrepancies**. **v0.4:** contribute the **CSAM-intent red-team pack** to Purple Llama/Garak/PyRIT/Promptfoo; wrap-and-credit Llama Guard/ShieldGemma. **v0.5:** ship the **python-threatexchange SignalExchangeAPI plugin** (adopt by config, not migration). | **v0.3:** scope the AT-Proto adapter. **v0.4:** **land** the hepa adapter + Ozone emitter + safemod skin; **open the red-team pack PRs** (the PR is the outreach); open Osprey/Coop adapter; post the 15-min hepa guide **once**. **v0.5:** ship the SignalExchangeAPI plugin + FIRES-compatible feed → notify FIRES/FediMod + ROOST directly. **Tier-2 "learn-from" outreach only where genuine value exists.** **In parallel (legal clock):** send **Lantern outreach** now that v0.1+v0.3 are live proof. |
| **v1.0** *(per package; non-legal tier)* | Ship **docs-MCP** (`/mcp`, agent answers cold) + GitHub Action + Supabase hook (v0.9), then **one disciplined Show HN/dev.to launch** — **hard-gated on install + complete golden path + ≥1 named reference logo**; maintainer present, civic framing, no superlatives. | Commission + publicly credit a **third-party security review** (Trail of Bits/Cure53 class); publish honest solo/small-team triage SLAs; stated **stewardship model + 2–3 named advisors** woven into the launch narrative. | Only now (conformance + reference logo exist) make **ONE** low-key ask via the ROOST bridge — listed as a conformant open PDQ implementation, or a Meta engineer sanity-checks the methodology. Accept silence gracefully; never imply endorsement. | Land the **ONE named reference-adopter logo** (the IFTAS-orphaned operator warmed since v0.3–0.4) — the launch-gate prerequisite; harden adapters (Bluesky beta, red-team published upstream-ready, Osprey/Coop stable); keep the directory current with a fast "correct your entry" PR path. |
| **v2.0** *(legal-tier GA — two external owner gates)* | Golden path flips **stubbed reporting rows to live**; buyer story graduates to **detect → report → preserve end-to-end** (the full obligation span no incumbent bundles) — still **never "compliant."** | Keep `legal-tier-ga` **contributor-CLOSED** (counsel-gated, highest blast radius); route would-be contributors to docs / test-vectors / jurisdiction-research. | hashstream + the Bluesky adapter now serve **real credentialed lists**; the ncmec_verified conformance vectors land (ESP in hand) — the strongest possible "conformant downstream" proof. | Bluesky adapter + hashstream serve real credentialed lists; INHOPE/national-hotline mission-aligned reach opens (hashstream ≈ their Global-Standard exchange need). **Only after BOTH** NCMEC ESP credentials **AND** outside-counsel sign-off **+ ≥1 consented filing partner.** |


---

## Acquisition metrics & targets


# Acquisition Funnel & Targets

**The funnel (and where each pillar acts):**
`Discover (registries / awesome-safety-tools / agent surface) → Install (TTFV <60s) → First value (hash/scan in 5 lines or one create-fightcsam run) → Wire the golden path (hepa rule / create-fightcsam profile) → Reference adopter → Contributor / co-maintainer`

Honest framing for a solo, self-funded maintainer in a credibility-first category: **these are leading-indicator targets, not vanity KPIs.** A handful of named reference adopters and a clean conformance story outweigh raw download counts. Quality and restraint beat volume.

### Pillar A — Users (leading indicators → outcomes)
- **TTFV < 60 seconds** per language, verified from a clean machine (binary pass/fail gate before any promotion).
- **0** broken install strings at any public moment (CI-on-tag enforces; re-verify name availability at the publish minute).
- **First ~100 GitHub stars seeded from the existing network before any public push** (conversion is poor below 100).
- **Registry installs trend** post-v0.2 (crates.io/PyPI/npm download deltas) as the discovery health signal — directional, not a target to game.
- **Agent-native proof point (v0.9):** Claude/Cursor connected to the docs-MCP answers "how do I add CSAM scanning" with a **correct, gate-respecting** wiring (no fabricated hash list, no "compliant" claim) — pass/fail, periodically re-tested.
- **Launch readiness (v1.0):** all three gate conditions simultaneously true (airtight install + complete golden path + ≥1 named reference logo).

### Pillar B — Contributors
- **v0.1:** issue/PR templates + safety checklist + SAFETY-CRITICAL labels live; **10–15 curated good-first-issues** open.
- **v0.3:** conformance reproduced byte-identical on **≥1 external OS/arch** by an outside contributor (satisfies the roadmap Beta gate) → target **≥3 platforms** by v0.5.
- **v0.5:** **1 named co-maintainer** onboarded from the reproducer/connector pool; GOVERNANCE.md + CONTRIBUTORS.md live.
- **Health guards:** honest, published triage SLA (no ghosted contributors); **0** out-of-scope PRs merged into fenced surfaces; **0** drive-by PRs touching legal-tier code.
- **v1.0:** third-party security review commissioned + credited; 2–3 named advisors stated.

### Pillar C — Meta
- **v0.3:** CONFORMANCE.md live, **byte-identical** parity, CI fails-closed on drift (the keystone artifact every later conversation opens with).
- **v0.3–v0.5:** upstream contributions filed **only on genuine, reproducible discrepancies** — quality over count (target: 0 noise PRs).
- **v0.5:** python-threatexchange SignalExchangeAPI plugin merged or in review (interop, not a pitch).
- **Realistic "win":** **1** technical acknowledgement (merged interop PR / positive issue thread / cited-as-conformant) by v1.0+ — **never** a press release; silence is an acceptable outcome.

### Pillar D — Ecosystem
- **v0.2:** **1** merged `roostorg/awesome-safety-tools` PR (the #1 discovery channel).
- **Outreach discipline (hard caps):** **≤5 hand-written messages/week**, capped to the **24 "use"-verdict** allies + a curated learn-from subset; **gitignored outreach ledger** (who/when/response/opt-out); **0** automated/bulk issues across the 111; **0** contacts to the do-not-contact list (13 out-of-scope + 39 reference-only + Big-Tech in-house T&S).
- **Merged-upstream-PR channel:** CSAM-intent red-team pack merged into **≥1** of Garak/PyRIT/Promptfoo by v0.4 (durable distribution + contributor funnel).
- **Beachhead:** hepa-adapter "add CSAM matching in 15 min" guide shipped (v0.4); **1–2 Fediverse design partners** seeded by v0.5 (cap total design partners at **5–10**).
- **The trust-currency outcome (v1.0):** **2–3 named reference-adopter logos** (≥1 IFTAS-orphaned Fediverse operator first; then a TAKE-IT-DOWN-deadline platform / an AI startup under Safety-by-Design scrutiny).

### Legal / credential clock (parallel, owner-driven)
- Lantern outreach sent (after v0.1+v0.3 proof) with the documented cadence (initial + 2 follow-ups, then pivot to Safe Online / McGovern / Cloudflare / EU Internet Forum / Mozilla MOSS).
- **NCMEC ESP introduction** secured (the in-kind win that unblocks the credentialed tier) — the true long-pole milestone.
- **$25K counsel retainer** engaged; `counsel-scope-brief.md` reviewed → gates `cybertip-cli`/`evidencevault` production at v2.0.


---

## Guardrails — credibility & anti-spam (non-negotiable)


# Guardrails — Anti-Spam & CSAM-Credibility Ethics

In this category **credibility and restraint are the only currency that converts.** Every rule below is a **hard gate, not a guideline.** Violating one can permanently brand the project a spammer or an over-claimer and poison the ROOST/Meta/NCMEC relationships the whole plan depends on.

### Outreach conduct (anti-spam — the #1 reputational threat)
- **NO mass/automated GitHub issues or PRs across the 111 profiled projects** (or Meta/ROOST repos). Ever. One scripted blast is reputationally fatal and could get the awesome-safety-tools PR rejected.
- All outreach is **human-written, individually relevant, batched ≤5/week, opt-out-respecting**, via email / existing threads / DMs — **never cold GitHub issues**.
- Capped to the **24 "use"-verdict allies** + a curated "learn-from" subset, **only where there is genuine value to send** (a credit, a working integration, a merged PR). Lead with the value; the ask comes much later, if ever.
- **Do-not-contact list:** all **13 out-of-scope** + all **39 reference-only** projects (many anonymous/low-provenance dataset dumps) + **Big-Tech in-house T&S** teams.
- Maintain a **gitignored outreach ledger** (who, when, response, opt-out). Honor every "no"; never re-contact; never automate.
- **Prefer merged upstream PRs over emails** — a gift PR is opt-in, durable, and the exact inverse of issue-spam.

### Claims & language (over-claim is instant credibility death)
- **NEVER the word "compliant" / "turnkey compliance"** — anywhere, including agent-generated code, `/llms.txt`, the manifest, the Agent Skill, READMEs, and the compliance Evidence Pack. Always *"helps you meet / take defensible, documented steps toward X; consult counsel."* (Safety-policy invariant #4: we do not provide compliance attestation by default; counsel remains required.)
- Pair **every** obligation claim with the counsel disclaimer **and** the "known-hash-isn't-enough" framing (self-generated content is most removed CSAM) — under-promise relative to the legal duty; defend against the false-confidence failure mode.
- **NEVER "beats Meta / beats PDQ"** or any implied-endorsement framing. Meta is upstream + our conformance source and co-founded ROOST. Lead with CONFORMANCE.md (parity), never benchmarks (superiority). Frame hashkit's edge **only** as Rust/WASM portability + NCMEC conformance vectors. Never imply ROOST/Meta/Bluesky/NCMEC endorsement from directory-adjacency or a merged PR.
- Mirror the directory's own **"inclusion is not an endorsement"** line in all outreach. Secure **written** sign-off before any logo, quote, or the word "partner."

### Safety (a single incident detonates the project)
- **Ship NO hash list, ever.** The operator brings their `.env`-stubbed credentialed NCMEC/IWF/Arachnid list. `safety-check.sh` **fails closed** on any bundled hash artifact.
- **Every demo, HF/Gradio Space, Show HN example, and quickstart uses `detectkit-test` synthetic fixtures only** — never real CSAM, never a real list.
- **Agent-native anti-hallucination control:** encode the no-hash-list rule and "compliance-defensible, never compliant" into `/llms.txt`, the manifest, the csam-safety Skill, and the `/agents` page so the constraint travels with every agent-consumed artifact.
- **Privacy framing** (defuse the Apple-NeuralHash backlash): always *auditable, operator-controlled, self-hosted, no client-side-scanning mandate* — never "surveillance."
- **Run the full git-HISTORY secrets/CSAM/hash-list scan immediately** — the repo is already public and `safety-check.sh` only covers new commits; this scan is overdue, not a future gate.

### Solo-maintainer discipline
- Lean on **passive** acquisition (agent-native surface, create-fightcsam, docs-MCP) and **tight release-pegged outreach batches**; do NOT treat multi-community presence as continuous.
- Keep the contributable surface **narrow** and gated surfaces **fenced**; publish honest solo/small-team response expectations; **never promise SLAs the maintainer can't keep** (do not make Lantern's "same-week member support" style commitments without a co-maintainer).
- Stage the public launch only **after the funnel is self-serve**.

### Never do (yet) — explicit
- **Do NOT promote anything before v0.1 publish** makes every install→quickstart resolve from a clean machine. A broken `cargo add` on a CSAM tool is worse than silence. (No awesome PR, no ally notes, no Show HN, no registry promotion, no Meta/ROOST ask, no ecosystem outreach.)
- **Do NOT flip `cybertip-cli` to real submit or `evidencevault` to enforced retention** before **BOTH** NCMEC ESP credentials **AND** outside-counsel sign-off **+ ≥1 consented filing partner**. Keep `ProductionSubmitBlocked` + retention-unenforced/noop-KMS — **stubs visible, never bypassed, even in agent-generated code.**
- **Do NOT pull gated surfaces forward:** the CSAM-intent red-team pack stays **v0.4**; the legal tier stays **v2.0**. Contributor-funnel and beachhead enthusiasm never override the release gate.
- **Do NOT launch publicly** without all three gate conditions simultaneously true: airtight install + complete golden path + ≥1 named reference logo. Civic framing without a named adopter reads as vaporware.
- **Do NOT send the Lantern grant** (or any funder/Meta/ROOST ask) until v0.1 publish + v0.3 conformance give it a **live, verifiable proof point.**
- **Do NOT bulk-submit to awesome-rust/-python/-go or any list** — one precise, factual, no-superlatives PR each, manually.


---

## First 90 days


# First 90 Days — Week-by-Week

Two tracks run in parallel: the **owner/unblock track** (registry tokens, repo scan, then publish) and the **zero-gate track** (repo hygiene + contribution on-ramp — needs no credentials, pure upside today). The calendar assumes the v0.1 owner gate clears around Weeks 2–3; the zero-gate work proceeds regardless. Nothing outbound fires before publish.

**Note on dependencies:** the conformance moat (v0.3) is gated on synthetic-corpus sign-off (no creds/counsel) — escalate that sign-off in Week 1 so it doesn't block Weeks 6–8.

### Weeks 1–2 — Zero-gate hygiene + unblock prep (no promotion)
- **W1 (today, zero owner-gate):** fix the GitHub description **"FightSAM" → "FightCSAM"**; refresh the stale README (drop "20-person platform" L7, point to fightcsam.org, sync statuses). Add `.github/ISSUE_TEMPLATE/` (bug, conformance-discrepancy, design-proposal, docs) + PR template with the **mandatory CSAM safety checklist**. Expand labels (domain + difficulty + SAFETY-CRITICAL gate labels).
- **W1 (owner):** provision `CARGO_REGISTRY_TOKEN`, PyPI Trusted-Publishing/OIDC, **create + own the `@digitalharm` npm org** + `NPM_TOKEN`. **Run the full git-HISTORY secrets/CSAM/hash-list scan** (overdue — repo is already public). **Escalate the synthetic-corpus sign-off** (gates v0.3 conformance + fixtures).
- **W2:** rewrite CONTRIBUTING into a real on-ramp with the **"contributions we are NOT taking"** section; hand-author the first **10–15 good-first-issues** (credential-free surfaces only). **Pre-stage** the `roostorg/awesome-safety-tools` PR branch + Tier-1 ally outreach drafts (do not send). Re-prove all publish dry-runs; re-verify `digitalharm-hashkit` + `digitalharm-promptshield` name availability.

### Week 3 — v0.1 PUBLISH (the master gate) + verify
- Release Captain publishes all 11 at `0.1.0` in dependency order (Rust chain → 5 PyPI → 3 npm → both Go per-module tags); enable CI-on-tag. **Fix the 3 wrong install strings** in `apps/fightsam-site/app/tools/page.tsx` (verify the path — site is on the unmerged `codex/fightsam-site` branch).
- **Verify every `install → run quickstart` from a clean machine, per language.** This is the binary gate that unlocks all promotion. Still zero outbound.

### Weeks 4–5 — v0.2 be-findable + agent-ready + the ONE PR
- Ship the **agent-native baseline** (`/llms.txt`, `/llms-full.txt`, raw-md, `/.well-known/fightsam.json`, `/agents` page stating "no hash list / never compliant"). **Rewrite all 11 READMEs** to lead with the verified copy-paste install + a 5-line first-value snippet. Set GitHub topics.
- Publish + register the **csam-safety Claude Agent Skill** + Cursor/Claude rules snippet.
- State the **engine-vendor repositioning** ("Meta is upstream + conformance source"; strip the raw-hashing-superiority claim); add the **"What this is NOT"** scope page.
- **Merge the ONE** `roostorg/awesome-safety-tools` PR (now that install strings are true). Begin seeding the **first ~100 stars from the existing network.**

### Weeks 6–8 — v0.3 the conformance moat + flagship contribution + Tier-1 outreach
- Publish **CONFORMANCE.md** (reproducible byte-identical PDQ parity, CI fails-closed on drift) + per-tool `/docs`. Market it as the trust artifact no incumbent offers.
- Launch the **conformance-reproduction program** (pinned cross-OS/arch good-first-issue = the roadmap Beta gate); credit reproducers by name.
- Begin **Tier-1 "use"-ally outreach** — **≤5 hand-written messages/week**, framed as "we credit you and send you traffic — did we get your entry right?", standing opt-out, gitignored ledger. Lead with ROOST/Osprey, Bluesky/Ozone, Presidio, Granite, Meta Content Review Filters.
- **Scope** the AT-Proto/Bluesky adapter (it only needs hashkit's PDQ, which lands here).
- **Legal clock:** with v0.1 published + conformance live, **send the Lantern outreach** (initial email; cadence = +10 business days, stop after 2 follow-ups, then pivot list). Start `counsel-scope-brief.md` review.

### Weeks 9–11 — v0.4 the hepa beachhead + golden path + red-team pack
- **Land the hepa adapter** (`atproto-adapter` ~150-line blob rule) + **Ozone label/report emitter** + **safemod Ozone reviewer skin**; publish the **"add CSAM matching to your hepa instance in 15 minutes (synthetic fixtures only)"** guide. Post it **once** in the AT-Proto Discord + one maintainer bsky thread; let it travel on merit.
- Ship the `/golden-path` wizard + downloadable **compliance checklist**; promptshield reasoning-trace verdicts.
- **Open the CSAM-intent red-team pack** as upstream-ready Garak/PyRIT/Promptfoo plugins (the PR is the outreach); open the Osprey/Coop adapter.
- Open good-first-issues on the thin adapter packages; begin identifying the **first co-maintainer** from the reproducer/connector pool.
- Begin **warming 1–2 IFTAS-orphaned Fediverse design partners** (via FediForum / r/selfhosted) toward the reference-logo gate. Cap total design partners at 5–10.

### Weeks 12–13 — v0.5 self-wiring golden path + Meta interop + governance
- Ship **create-fightcsam** (`--json` agent mode + `--profile bluesky/ai-startup/small-platform`, starter passes detectkit-test in CI); demo `--profile ai-startup` as a **synthetic-only Hugging Face Space**.
- Ship the **python-threatexchange SignalExchangeAPI plugin** (Meta-ecosystem bridge — adopt by config, not migration) + a **FIRES-compatible feed**; notify FIRES/FediMod + ROOST directly.
- Stand up **CONTRIBUTORS.md + GOVERNANCE.md** (never-PR-able CSAM invariants); onboard the first named co-maintainer if the pool has matured.
- **Day-90 checkpoint:** confirm the v1.0 launch gate is on track — (1) airtight install [done v0.1–0.2], (2) golden path complete [v0.3–0.5], (3) ≥1 named reference logo [warming]. The disciplined Show HN/dev.to launch fires only once all three are simultaneously true (post-90-day, at v1.0). Legal/credential clock continues independently toward v2.0.

