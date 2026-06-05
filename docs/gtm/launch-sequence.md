# FightCSAM — Launch Sequence: Release-Tied Marketing Calendar

**Authored 2026-06-05.** Derived from `docs/ops/v2-release-plan.md` (the ratified
v0.1 → v2.0 engineering spine), the Customer-Acquisition Master Plan, the
Anti-Spam & CSAM-Credibility Guardrails, and the Release × Pillar Action Matrix.

**What this is.** A marketing calendar that maps every customer-acquisition beat
to the release that *earns the right to fire it*. The engineering plan decides
when a capability is real; this plan decides when — and how — we are allowed to
talk about it. Marketing **never leads** the engine.

**The one rule that governs all of it.** *A claim ships only after the capability
**and** its gate are real.* The master gate is **v0.1 publish**: until every
`install → quickstart` resolves from a clean machine, we do **zero** outbound —
a broken `cargo add` on a CSAM tool is worse than silence.

**Brand split (do not blur).** Packages keep the `digitalharm` name on the
registries; **FightCSAM is the developer brand, the docs site (fightcsam.org),
and the `create-fightcsam` CLI**. Every install string we publish is
`@digitalharm/*` / `digitalharm-*`; every story we tell is FightCSAM.

**How to read the cadence.** Releases below `1.0` are portfolio themes the
project crosses together; `1.0`/`2.0` land per package. The marketing beats are
timed to the theme, not to any single package tag. v0.3, v0.4, and v0.9 are
intermediate engineering rungs that the matrix folds into the v0.5 and v1.0
*marketing* columns — they appear here as sub-beats with their true rung flagged.

---

## The four pillars (recurring across every release)

Every release section below is organized by these four audiences. The DevRel
funnel (Users) is the load-bearing spine; the other three lower the cost of the
next turn of that spine.

- **USERS** — developers + their AI coding agents: discover → install → first
  value → wire → become a reference. The primary acquisition channel is
  *agent-native* (the "add CSAM scanning" task starts in a coding assistant).
- **CONTRIBUTORS** — a downstream output of a great funnel + the bus-factor fix.
  Wide-open safe surfaces (conformance repro, synthetic fixtures, docs,
  adapters); fenced gated surfaces (anything touching real lists / statutory
  submit / retention).
- **META** — pure technical-credibility posture. Meta is upstream, our
  conformance source, and a ROOST co-founder. Never "beats Meta." Outreach is
  contribution-shaped and routed through ROOST.
- **ECOSYSTEM** — the `roostorg/awesome-safety-tools` spine + merged-PR-as-
  outreach. The 113 profiled projects are an integration surface to credit and
  build on, **not** a list to spam.

---

## Front-loaded priority: highest leverage, lowest reputational risk first

Ordered by ROI ÷ risk, so the cheapest, most durable, least-spammy beats fire
earliest. **Everything above the v0.1-publish line is non-promotional repo
hygiene that can run today; everything below it waits on the master gate.**

| # | Beat | Release | Why it's first | Risk |
|---|---|---|---|---|
| 1 | Fix GitHub description **"FightSAM"→"FightCSAM"**; refresh stale README; issue/PR templates w/ CSAM safety checklist; domain + difficulty + SAFETY-CRITICAL labels | v0.1 (pre-publish, **today**) | Zero owner-gate, zero promotion, pure credibility floor. A misspelled brand on a CSAM repo is silent damage. | none |
| 2 | Run the overdue **full git-history** secrets/CSAM/hash-list scan | v0.1 (**today**) | Repo is already public; `safety-check.sh` only covers new commits. One leaked artifact detonates the project. | none (this *reduces* risk) |
| 3 | **Owner-gated publish** of all 11 at `0.1.0`; fix the 3 wrong install strings | v0.1 (master gate) | Unblocks *every* downstream beat. Lowest-effort, highest-leverage, dry-runs already green. | low (one-way door — verify names at publish minute) |
| 4 | The **ONE** `roostorg/awesome-safety-tools` PR | v0.2 | Single highest-ROI, lowest-reputational-risk discovery channel. Opt-in, durable, earns ROOST/Meta standing. | low (factual, no superlatives) |
| 5 | **Agent-native baseline** + **csam-safety Claude Skill** + rewritten READMEs | v0.2 | The most differentiated acquisition asset; the agent does the integration labor — the solo-maintainer reach multiplier. | low |
| 6 | **CONFORMANCE.md** (byte-identical PDQ parity + drift-gate) | v0.5 col / true rung **v0.3** | The human trust moat *and* the relationship engine; a procurement-grade artifact no incumbent offers. | low |
| 7 | **Conformance-reproduction program** (pinned cross-OS issue) | v0.5 col / true rung **v0.3** | The best good-first-issue in the project: safe-by-construction, high-status, *and* it is the roadmap's literal Beta gate. | none |
| 8 | **hepa adapter + Ozone emitter** + the 15-min copy-paste guide | v0.5 col / true rung **v0.4** | Turns "11 libraries" into a paste-and-run drop-in for the #1 ICP's exact stack, in the IFTAS vacuum. Credential-free code. | low |
| 9 | **create-fightcsam** (`--json` + `--profile`) + synthetic-only HF Space | v0.5 | A channel in itself; the agent-mode CLI is the scalable, opt-in reach. | low |
| 10 | **One disciplined Show HN / dev.to launch** | v1.0 | Highest visibility, highest scrutiny — gated on install + golden path + ≥1 named logo all simultaneously true. | high (do last, maintainer present) |

---

# v0.1 — Installable everywhere, auditable, under final permanent names

**Theme.** *Be real before being loud.* Claim the names, make every install
resolve, fix the repo's credibility floor. **Zero promotion.**

**Marketing beats this release unlocks.**
- The repo becomes *quotable*: correct brand, honest README pointing at
  fightcsam.org, contribution on-ramp visibly safe-vs-gated. (Pre-publish, no
  owner gate — the only "marketing" that is allowed before names go live.)
- Nothing outbound. The single beat that matters is **making the foundation true
  so v0.2 can fire** — installs resolving is the prerequisite for *all* reach.
- **Pre-stage** the v0.2 assets so they fire the minute names are live: the
  awesome-safety-tools PR branch, the Tier-1 ally outreach drafts, the README
  rewrites, the GitHub topics list.

**Channels.** GitHub repo surface only (description, README, ISSUE/PR templates,
labels). No registries-as-marketing yet (installs must first be true). No
external channel.

**Timed actions across the four pillars.**

- **USERS** — *(owner-gated, critical path)* Publish all 11 at `0.1.0` in
  dependency order: Rust dep-chain (`digitalharm-hashkit` → `hashkit-match` →
  `c2pa-lite` → `safemod`) → 5 PyPI → 3 npm `@digitalharm/*` → **both** Go
  per-module tags (`packages/{hashstream,evidencevault}/v0.1.0`). Turn on
  CI-on-tag so future releases publish automatically. Fix the 3 wrong install
  strings in `apps/fightsam-site/app/tools/page.tsx` (L47/100/130 per the plan —
  verify the path; the site is on the unmerged `codex/fightsam-site` branch).
  Verify every `install → run quickstart` from a clean machine.
- **CONTRIBUTORS** — *(zero owner-gate, do today)* Fix the GitHub description
  typo **"FightSAM" → "FightCSAM"**. Refresh the stale README (drop the
  "20-person platform" framing, sync tool statuses, point to fightcsam.org). Add
  `.github/ISSUE_TEMPLATE/` (bug, conformance-discrepancy, design-proposal, docs)
  + a **PR template with a mandatory CSAM safety checklist** ("no real
  hashes/imagery/credentials; synthetic fixtures only"). Expand labels with
  **domain** (`area:hashkit`, `area:conformance`, `area:csam-shield`,
  `area:promptshield`, `area:docs`, `area:connectors`), **difficulty**
  (`good-first-issue`, `help-wanted`), and **SAFETY-CRITICAL gate** labels
  (`needs-counsel`, `gated:credentialed`, `safety-sensitive`).
- **META** — Nothing public. Privately verify the conformance harness reproduces
  on a clean machine so the v0.3 claim is airtight when it ships.
- **ECOSYSTEM** — Pre-stage the `roostorg/awesome-safety-tools` PR branch and the
  Tier-1 ally outreach drafts. **Nothing outbound.**

**Owner-gated prerequisites.**
- Registry credentials: `CARGO_REGISTRY_TOKEN` (scopes `publish-new` +
  `publish-update`); PyPI Trusted-Publishing/OIDC (`PYPI_API_TOKEN` fallback);
  **own the `@digitalharm` npm org** (or a squatter takes the scope) + `NPM_TOKEN`.
- **Repo made PUBLIC** — but only *after* the full git-history secrets/CSAM/
  hash-list scan (one-way blast radius).
- **Re-verify `digitalharm-hashkit` + `digitalharm-promptshield` are 404-free at
  the publish minute** — names are permanent (crates yank only; PyPI/npm forever).
- No NCMEC / no counsel needed at this rung.

**Success metrics.**
- 11/11 packages resolve from a clean machine across crates.io / PyPI / npm /
  pkg.go.dev; every quickstart runs green. *(This is the real KPI — it is the gate
  for all reach.)*
- 0 install strings wrong on the site/READMEs (currently 3).
- `safety-check.sh` + the one-time history scan: 0 bundled hash artifacts, 0
  secrets, 0 real imagery in history.
- GitHub description spelled correctly; CONTRIBUTING shows a safe-vs-gated map;
  ≥4 issue templates + a PR safety checklist live.

**Do NOT do yet (v0.1).**
- **Do NOT promote anything.** No awesome PR, no ally notes, no Show HN, no
  registry keyword promotion, no Meta/ROOST ask, no ecosystem outreach — *until
  publish makes every install→quickstart resolve.*
- **Do NOT** publish conformance vectors yet (synthetic-corpus sign-off is a v0.2
  gate; the claim isn't airtight until v0.3).
- **Do NOT** flip the repo public before the git-history scan completes clean.
- **Do NOT** first-publish under a wrong name to "reserve" it — a wrong name is
  permanent.
- **Do NOT** use the word "compliant" anywhere (README, templates, agent text).

---

# v0.2 — Discoverable where intent lives, trust moat public, engine-vendor repositioning

**Theme.** *Be findable + agent-ready + honestly positioned.* This is where
acquisition genuinely begins. Fire the highest-ROI, lowest-risk beats first: the
ONE awesome-safety-tools PR, the agent-native surface, the csam-safety Skill.

**Marketing beats this release unlocks.**
- **The ONE `roostorg/awesome-safety-tools` PR** — our single best discovery
  channel, under the correct existing Hash-Matching / Classification / Reporting
  sections, leading with "conformance-tested against Meta PDQ / ships no hash
  list / Apache-2.0," crediting the upstreams already listed.
- **Agent-native baseline goes live** so a coding agent told "add CSAM scanning"
  can read us: `/llms.txt`, `/llms-full.txt`, per-page raw `.md`,
  `/.well-known/fightsam.json` manifest, and an `/agents` page that explicitly
  states "no bundled hash list" and "compliance-defensible, never compliant."
- **The csam-safety Claude Agent Skill** + a Cursor/Claude rules snippet — the
  single most differentiated acquisition asset (it already encodes the 11 tools,
  exact installs, the build-vs-wrap split, and the no-hash-list rule).
- **All 11 READMEs rewritten** to lead with the verified copy-paste install
  (final names) + a 5-line first-value snippet. GitHub topics set precisely.
- **Engine-vendor repositioning stated**: "PDQ/TMK/vPDQ are Meta's; hashkit
  conforms and does not compete" in every README + on the site; the residual
  raw-hashing-superiority claim stripped.
- **Begin Tier-1 ally outreach** — value-first, batched, opt-out-respecting.

**Channels.**
- Package registries as the primary discovery surface (crates.io / PyPI / npm
  keywords + categories, docs.rs, pkg.go.dev).
- `roostorg/awesome-safety-tools` (the ONE PR); `awesome-rust` / `-python` /
  `-go` + relevant AppSec lists (single precise PR each, never bulk).
- The agent-native endpoints + the csam-safety Skill + the Cursor/Claude snippet.
- fightcsam.org docs (Phase 0 scaffold + Phase 1 agent baseline).
- Email / existing threads / DMs to Tier-1 "use"-verdict allies (≤5/week).

**Timed actions across the four pillars.**

- **USERS** — Ship the agent-native baseline (above). Rewrite all 11 READMEs to
  lead with the verified install + 5-line snippet. Set GitHub topics
  (`csam-detection`, `perceptual-hashing`, `pdq`, `trust-and-safety`, `ncmec`,
  `online-safety`). Publish + register the **csam-safety Claude Agent Skill** +
  the Cursor/Claude rules snippet.
- **CONTRIBUTORS** — Hand-author the first **10–15 good-first-issues** (credential-
  free surfaces only — conformance repro, synthetic fixtures, docs, bindings, thin
  adapters; each with an acceptance test + a "why this is safe to work on" note).
  Rewrite CONTRIBUTING from gate-only into a real on-ramp: a "pick your first
  issue" path, the safe-vs-gated surface map, 60-second per-language dev setup,
  and an explicit **"contributions we are NOT taking"** section (no rules engine /
  PII / toxicity classifier / case-mgmt; nothing touching real lists; statutory
  submit paths).
- **META** — State in every README + on the site: "PDQ/TMK/vPDQ are Meta's;
  hashkit conforms to them and does not compete." Strip the raw-hashing-
  superiority claim (engine-vendor repositioning). No outreach to Meta yet.
- **ECOSYSTEM** — Merge the **ONE** `roostorg/awesome-safety-tools` PR (only
  after install strings are true). Publish/refresh a dated `fightcsam.org/docs/
  ecosystem` snapshot (24 use / 35 learn-from / 41 reference / 13 out-of-scope).
  Single precise PRs into `awesome-rust`/`-python`/`-go` + AppSec lists.
  **Begin Tier-1 "use"-verdict ally outreach** (24 max, **≤5/week**, individually
  written, framed as "we recommend your tool and send you traffic — did we
  characterize your entry right?"). Lead with ROOST/Osprey, Bluesky/Ozone, Meta
  Content Review Filters (adoption not competition), IBM Granite, Microsoft
  Presidio. Reciprocal-credit, not asks. Standing opt-out. **Gitignored outreach
  ledger** (who / when / response / opt-out).

**Owner-gated prerequisites.**
- v0.1 published (install strings must be true — hard predecessor).
- **Synthetic-corpus distribution sign-off** (content/safety judgment) — gates
  publishing conformance vectors + detectkit fixtures. Low-risk (synthetic by
  construction) but clear it early or the conformance beat stalls.
- **fightcsam.org DNS + a SEPARATE Vercel project** (not the addiction/
  digitalharm.org project) — gates the site going live.

**Success metrics.**
- awesome-safety-tools PR **merged** (binary; the keystone discovery event).
- Agent-native endpoints reachable; an external agent (Claude/Cursor) can read
  `/llms.txt` + manifest and produce a correct install with the no-hash-list +
  "never compliant" caveats present in its output.
- csam-safety Skill published/registered; Cursor/Claude snippet live.
- 11/11 READMEs lead with a verified install + 5-line snippet; topics set on all
  repos; the directory snapshot is dated and live.
- First ally-outreach batch sent (≤5), with ≥1 "characterization confirmed"
  reply; ledger started; 0 opt-out violations.
- Early discovery signal: package-page impressions / docs.rs + pkg.go.dev
  resolution; first inbound stars (note: conversion is poor below ~100 stars —
  treat as a leading indicator, not a goal in itself).

**Do NOT do yet (v0.2).**
- **No "compliant" / "turnkey compliance"** anywhere — including the `/agents`
  page, the manifest, `/llms.txt`, the csam-safety Skill, and READMEs. Always
  "helps you take defensible, documented steps toward X; consult counsel."
- **No mass / automated GitHub issues or PRs** across the 113 (or Meta/ROOST
  repos). Ally outreach is human-written, ≤5/week, via email/threads/DMs — never
  cold GitHub issues. Do-not-contact: all 13 out-of-scope + all 41 reference-only
  + Big-Tech in-house T&S.
- **No bulk submit** to awesome-rust/-python/-go — one precise, factual,
  no-superlatives PR each, manually.
- **No "beats Meta / beats PDQ"** and no implied ROOST/Meta endorsement from
  directory-adjacency or a merged PR. Mirror the directory's own "inclusion is
  not an endorsement" line.
- **No conformance claim** until the vector is actually published with the
  drift-gate (that's the v0.3 sub-beat — don't pre-announce it).
- **No Show HN / Lobste.rs / dev.to launch** — the funnel isn't self-serve yet.
- **No Lantern / funder / Meta / ROOST ask** — no live conformance proof point yet.

---

# v0.5 — The conformance moat, the Tier-1 beachhead, and the golden-path scaffolder

*(This marketing column spans engineering rungs v0.3 → v0.4 → v0.5. Each beat is
flagged with its true rung. This is the densest, highest-compounding stretch:
the trust artifact, the reference-adopter machine, and the agent-mode CLI all
land here.)*

**Theme.** *Earn the trust moat, prove drop-in adoption, ship the golden path.*

**Marketing beats this release unlocks.**
- **[v0.3] CONFORMANCE.md** — reproducible byte-identical PDQ parity with
  `facebook/ThreatExchange`, CI failing closed on drift, vectors reproducible on
  a synthetic non-CSAM corpus. A dev verifies our hashing matches Meta's in one
  command. The credibility artifact **no incumbent offers** — and the single best
  thing to put in front of a risk-averse buyer or a funder.
- **[v0.3] The conformance-reproduction program** — a pinned "reproduce hashkit
  PDQ byte-identical on your OS/arch, synthetic vectors only" tracking issue. The
  best good-first-issue in the project (safe-by-construction, high-status) *and*
  the roadmap's literal Beta gate ("independent reproduction of the WASM build by
  ≥1 external contributor on a different OS"). Credit every reproducer by name.
- **[v0.4] The hepa beachhead lands** — the ~150-line `atproto-adapter` (hashkit +
  hashkit-match against an operator-supplied, hashstream-served list) + an Ozone
  label/report emitter + a safemod Ozone reviewer-pane skin + a 15-minute
  copy-paste "add CSAM matching to your hepa instance, synthetic fixtures only"
  guide. **The hepa rule IS the marketing**: it turns 11 libraries into a
  paste-and-run drop-in for the exact stack the #1 ICP already runs.
- **[v0.4] The CSAM-intent red-team pack opens** as upstream-ready Garak / PyRIT /
  Promptfoo plugins — *the PR is the outreach* (generalist harnesses omit CSAM
  probes; our NCMEC-aware, counsel-conscious posture uniquely qualifies us to
  author them responsibly).
- **[v0.4] The golden-path build-vs-wrap spec** is authored as structured data —
  the single source of truth the wizard, CLI, and MCP all read. Plus the
  `/golden-path` wizard + a downloadable compliance checklist, and promptshield
  reasoning-trace verdicts (defensibility, not a bare boolean).
- **[v0.5] create-fightcsam ships** (`npx`/`uvx`, interactive + `--json` agent
  mode + `--profile bluesky|ai-startup|small-platform`) generating a starter that
  **passes detectkit-test in CI out of the box** — demoed as a synthetic-only
  Hugging Face Space for the `ai-startup` profile.
- **[v0.5] The python-threatexchange SignalExchangeAPI plugin** — Meta's pytx
  installed base points at hashstream **by configuration, not migration**.
- **In parallel (legal clock): send the Lantern outreach** now that v0.1 publish +
  v0.3 conformance give it a live, verifiable proof point.

**Channels.**
- fightcsam.org docs (Phase 2 per-tool `/docs`; Phase 3 `/golden-path` + `/start`).
- GitHub: the pinned conformance-reproduction issue; the curated good-first-issue
  board; release-note shout-outs.
- Merged upstream PRs as the scalable, opt-in channel (Garak/PyRIT/Promptfoo;
  python-threatexchange).
- The AT-Proto Discord + one maintainer bsky thread for the hepa guide (posted
  **once**, then let it travel on merit).
- ROOST community (`community@roost.tools`, Discord) — partner + design-partner
  source; notify FIRES/FediMod + ROOST directly on the interop feeds.
- create-fightcsam as a channel in itself; the synthetic-only HF Space.
- T&S distribution surfaces (TSPA / All-Tech-Is-Human Slacks) — value-first,
  release-pegged, never continuous.
- Lantern outreach (email) on the legal clock.

**Timed actions across the four pillars.**

- **USERS** — **[v0.3]** Publish CONFORMANCE.md (reproducible PDQ parity +
  drift-gate) as a first-class TTFV + trust artifact; ship per-tool `/docs`
  pages. **[v0.4]** Ship the `/golden-path` wizard + downloadable compliance
  checklist; ship promptshield reasoning-trace verdicts. **[v0.5]** Ship
  create-fightcsam (`--json` + `--profile`, starter passes detectkit-test in CI);
  stand up the synthetic-only HF Space for `--profile ai-startup`.
- **CONTRIBUTORS** — **[v0.3 flagship]** Launch the conformance-reproduction
  program (pinned cross-OS issue = the roadmap's Beta gate); credit reproducers
  by name. **[v0.3→v0.5]** Stand up recognition + governance: CONTRIBUTORS.md, a
  per-release "thanks to" line, a short GOVERNANCE.md naming the never-PR-able
  CSAM invariants; **onboard the first named co-maintainer** from the
  reproducer / connector-contributor pool. **[v0.4→v0.5]** Open contributor-
  friendly issues on the thin connector packages (`atproto-adapter`,
  `osprey-coop-adapter`, `csam-redteam`); keep csam-shield's core refactor +
  create-fightcsam maintainer-led (single-writer, blast radius).
- **META** — **[v0.3–v0.5]** File high-quality upstream issues/vectors to
  `facebook/ThreatExchange` / `python-threatexchange` **only where there is a
  genuine, reproducible discrepancy** (signal, not noise). **[v0.4]** Contribute
  the CSAM-intent red-team pack to the Purple Llama / Garak / PyRIT / Promptfoo
  ecosystem; pair with crediting Llama Guard / Prompt Guard 2 / ShieldGemma 2 as
  recommended companions (wrap-and-credit, never reimplement). **[v0.5]** Ship the
  python-threatexchange SignalExchangeAPI plugin; adopt HMA's declarative
  ActionRule shape in csam-shield and cite it.
- **ECOSYSTEM** — **[v0.3]** Scope the AT-Proto adapter (it only needs hashkit's
  PDQ, which lands at v0.3). **[v0.4]** **Land** the hepa adapter + Ozone emitter +
  safemod skin; **open** the red-team pack PRs (the PR is the outreach); open the
  Osprey/Coop adapter; post the 15-minute hepa guide **once** in the AT-Proto
  Discord + one maintainer bsky thread. **[v0.5]** Ship the SignalExchangeAPI
  plugin + a FIRES-compatible advisory-feed output, then notify only FIRES/FediMod
  + ROOST directly. Continue Tier-2 "learn-from" outreach **only where genuine
  value exists** (still ≤5/week, ledgered). **(Legal clock):** send the Lantern
  outreach.

**Owner-gated prerequisites.**
- **Synthetic-corpus sign-off** (from v0.2) — gates vector + fixture publication;
  CONFORMANCE.md cannot publish without it. **Escalate this to clear immediately**
  (it is the only thing gating the dependency-root trust artifact).
- **Technical gate:** byte-identical conformance + drift CI green before the
  conformance beat fires (the claim must be live-verifiable, not aspirational).
- **Owner confirm** the recommended best-in-class externals at the steps we don't
  cover (Osprey / Presidio / Granite / Llama-Guard) before publishing the
  golden-path spec that recommends them.
- Still **NOT** gated on NCMEC/ESP or counsel — every path ships a credential-free
  demo with **visibly stubbed** gates (cybertip real POST blocked; retention
  enforcement off; the Bluesky adapter's list stays the operator's).
- *(Legal clock, off critical path):* kick off the Lantern outreach +
  `counsel-scope-brief.md` review now — longest lead time; gates only v2.0.

**Success metrics.**
- CONFORMANCE.md published; `cargo`-one-command parity reproduces byte-identical;
  drift CI is green and fails-closed on a deliberate poison test.
- **≥1 external contributor reproduces the WASM build on a different OS/arch**
  (the roadmap's Beta gate — the single most important contributor metric).
- ≥1 named co-maintainer onboarded; CONTRIBUTORS.md + GOVERNANCE.md live.
- hepa adapter + Ozone emitter + safemod skin shipped; the 15-min guide posted
  once; ≥1 IFTAS-orphaned operator running it on synthetic fixtures (the
  reference-adopter pipeline opened — the v1.0 launch gate prerequisite).
- Red-team pack PRs opened into ≥1 of Garak/PyRIT/Promptfoo; SignalExchangeAPI
  plugin published (a pytx user can point at hashstream by config).
- create-fightcsam published; a cold run of `--profile ai-startup` produces a
  CI-green, detectkit-test-passing starter; the HF Space runs on synthetic
  fixtures only.
- Lantern outreach sent with the live conformance + publish proof point attached.

**Do NOT do yet (v0.5).**
- **Do NOT** publish CONFORMANCE.md before the drift-gate is green and the
  synthetic-corpus sign-off is in hand — an unverifiable parity claim is
  credibility death.
- **Do NOT** demo statutory reporting (cybertip real submit) or enforced
  retention (evidencevault) — those stay `ProductionSubmitBlocked` / unenforced
  until **both** NCMEC ESP credentials **and** counsel sign-off land (v2.0).
  Every demo, HF Space, and quickstart uses `detectkit-test` synthetic fixtures
  only — never a real list, never real CSAM.
- **Do NOT** pull the red-team pack earlier than v0.4 or the legal tier earlier
  than v2.0 — beachhead/contributor enthusiasm never overrides the release gate.
- **Do NOT** post the hepa guide more than once or spray it across communities —
  post once, let it travel on merit.
- **Do NOT** say "compliant"; pair every obligation claim with the counsel
  disclaimer **and** the "known-hash-isn't-enough" framing (self-generated
  content is the most-removed CSAM — under-promise relative to the legal duty).
- **Do NOT** make any Meta ask yet (the ONE ask waits for v1.0, conformance +
  reference logo in hand). File discrepancy issues only — no "please list us."
- **Do NOT** make Lantern's "same-week member support"-style SLA commitments
  without a co-maintainer; publish honest solo/small-team response expectations.
- **Do NOT** launch publicly (no Show HN) — the named-logo gate isn't met yet.

---

# v1.0 — The one disciplined launch (per package; non-legal tier)

**Theme.** *Earn the right to be loud, once.* Everything to here has been
self-serve funnel-building and quiet credibility. v1.0 is the single coordinated
public moment — and it is **hard-gated on three simultaneously-true conditions.**

**Marketing beats this release unlocks.**
- **The docs MCP server goes live** (`search_docs` / `get_tool` /
  `get_golden_path` / `get_compliance` + `/mcp`) so an agent answers "how do I add
  CSAM scanning" **cold** — FightCSAM becomes a live agent tool, not just an
  agent-readable site. *(true rung v0.9)*
- **A GitHub Action + a Supabase storage-hook template** — the embed-into-existing-
  workflows growth engine (the Trivy/Semgrep lesson: meet developers inside the
  pipelines they already run). *(true rung v0.9)*
- **ONE disciplined Show HN / dev.to launch** — civic framing, lead with
  threat-model depth + conformance, maintainer present to engage critics.
- **The ONE named reference-adopter logo** goes public — the IFTAS-orphaned
  Fediverse/Bluesky operator warmed since v0.3–v0.4. (Civic framing without a
  named adopter reads as vaporware — this is why the logo is a launch gate.)
- **A commissioned third-party security review** (Trail of Bits / Cure53 class) of
  sensitive surfaces is published and credited — the bus-factor / trust capstone
  woven into the launch narrative, alongside 2–3 named advisors and an honest
  stewardship model.
- **Per-package API-freeze story**: documented semver, conformance/property tests,
  ≥1 production-shaped example per package.

**Channels.**
- The docs MCP (`/mcp`) — Claude / Cursor connect and answer cold.
- The GitHub Action marketplace listing + the Supabase hook template.
- ONE Show HN + ONE dev.to post (civic framing, no superlatives).
- fightcsam.org Phase 6 (developer visual identity, live-snippet hero, WCAG AA +
  reduced-motion).
- The reference-adopter's own channels (with **written** sign-off before any logo,
  quote, or the word "partner").
- The full package-registry + agent-native + Skill + MCP surface now compounding
  together.

**Timed actions across the four pillars.**

- **USERS** — Ship the docs-MCP + the GitHub Action + the Supabase hook (v0.9),
  then run the **one disciplined Show HN / dev.to launch** — maintainer present,
  civic framing, no superlatives, lead with conformance + threat-model depth.
- **CONTRIBUTORS** — Commission + publicly credit the **third-party security
  review**. Publish honest solo/small-team triage SLAs. Weave the stewardship
  model + 2–3 named advisors into the launch narrative.
- **META** — **Only now** (conformance + a reference logo exist) make **ONE**
  low-key ask via the ROOST bridge: to be listed as a conformant open PDQ
  implementation, **or** to have a Meta safety engineer sanity-check the
  conformance methodology. Accept silence gracefully; never imply endorsement.
- **ECOSYSTEM** — Land the **ONE named reference-adopter logo** (the launch-gate
  prerequisite). Harden the adapters (Bluesky beta; red-team published upstream-
  ready; Osprey/Coop stable). Keep the directory current with a fast "correct your
  entry" PR path.

**Owner-gated prerequisites.**
- **The three launch-gate conditions, all simultaneously true:** (1) airtight
  install (v0.1–v0.2), (2) a complete golden path (v0.3–v0.5), (3) **≥1 named
  reference logo with written sign-off.**
- Per-package: API freeze + a real production example + the third-party security
  review complete on sensitive surfaces.
- **Written** sign-off from the reference adopter before any logo / quote / the
  word "partner."
- The ROOST relationship warm enough to carry the ONE Meta ask.
- **HARD WALL:** cybertip-cli + evidencevault **cannot** cross 1.0 here (counsel
  clock unsigned) — they remain pre-1.0.

**Success metrics.**
- All three launch-gate conditions verified true *before* the post goes up
  (binary go/no-go).
- The docs-MCP answers "how do I add CSAM scanning" cold from a fresh Claude/Cursor
  connection, emitting correct installs with the no-hash-list + never-compliant
  caveats.
- ≥1 named reference logo public with written sign-off; security review published.
- Launch-day: maintainer present for the full comment window; the thread stays
  substantive (threat-model + conformance discussion, not over-claim defense).
- Post-launch durable signal: GitHub Action installs + Supabase template uses +
  create-fightcsam runs trending up (workflow-embed adoption, not just stars).
- The ONE Meta ask sent via ROOST; any outcome (including silence) accepted.

**Do NOT do yet (v1.0).**
- **Do NOT launch** unless all three gate conditions are simultaneously true.
  Civic framing without a named adopter reads as vaporware.
- **Do NOT** run more than one launch — a single disciplined Show HN / dev.to, not
  a drumbeat. Solo maintainer: presence > frequency.
- **Do NOT** claim "compliant" / "turnkey compliance" in the launch copy, the
  MCP's `get_compliance` output, the Action's docs, or anywhere else. Lead with
  CONFORMANCE.md (parity), never benchmarks (superiority).
- **Do NOT** imply ROOST / Meta / Bluesky / NCMEC endorsement from the merged PR,
  the directory, or the reference logo.
- **Do NOT** flip cybertip-cli to real submit or evidencevault to enforced
  retention to "complete the story" for launch — the legal tier stays at v2.0; the
  buyer story at v1.0 is detect + (stubbed) report, never the full statutory span.
- **Do NOT** use a logo / quote / the word "partner" without prior **written**
  sign-off.
- **Do NOT** turn the ONE Meta ask into a press request or imply a relationship
  beyond technical acknowledgement.

---

# v2.0 — Legal-tier GA (counsel-cleared) — the full detect → report → preserve story

**Theme.** *The differentiated end-to-end story no incumbent bundles — but only
after two external owner gates, and still never "compliant."* This is an additive
unlock communicated to funders that way; the rest of the portfolio reached v1.0
without it.

**Marketing beats this release unlocks.**
- **The buyer story graduates to detect → report → preserve, end-to-end** — the
  full obligation span no incumbent bundles. The golden path flips stubbed
  reporting rows to live. **Still never "compliant"** — "helps you take
  defensible, documented steps across the full duty; consult counsel."
- **The strongest possible conformance proof**: the `ncmec_verified` corpus
  vectors land (ESP in hand) — hashkit as a verified conformant downstream of
  Meta PDQ against credentialed vectors.
- **Mission-aligned reach opens** (INHOPE / national-hotline / academic) —
  hashstream ≈ their Global-Standard exchange need; these were on the do-not-rush
  list until the credentialed tier was real.
- **Platform-hardening credibility**: Sigstore/cosign-signed artifacts across all
  packages; a cross-platform conformance matrix (macOS/Linux/Windows + WASM) with
  mandatory drift gates; per-tool deploy guides.
- **A coordinated breaking-change wave** with per-package migration guides (the
  one batched 2.0 cut) — a release-notes / migration-guide moment, not a
  promotional blitz.

**Channels.**
- fightcsam.org docs (the now-live reporting/preserve rows; per-tool deploy guides;
  the migration guides).
- The docs-MCP (`get_compliance` now reflects the real, counsel-cleared, still-
  never-"compliant" end-to-end path).
- Direct, individual notification to FIRES/FediMod, ROOST, and (newly) INHOPE /
  national-hotline contacts — interop + mission-aligned, not a campaign.
- The reference-adopter + consented filing partner's channels (written sign-off
  required).
- Registry release notes + per-package migration guides for the breaking wave.

**Timed actions across the four pillars.**

- **USERS** — Flip the golden path's stubbed reporting rows to live; graduate the
  buyer story to detect → report → preserve end-to-end — still never "compliant."
- **CONTRIBUTORS** — Keep `legal-tier-ga` **contributor-CLOSED** (counsel-gated,
  highest blast radius); route would-be contributors to docs / test-vectors /
  jurisdiction-research.
- **META** — hashstream + the Bluesky adapter now serve **real credentialed
  lists**; the `ncmec_verified` conformance vectors land (ESP in hand) — the
  strongest "conformant downstream" proof. (Frame as conformance lineage; still
  never endorsement.)
- **ECOSYSTEM** — Bluesky adapter + hashstream serve real credentialed lists;
  INHOPE / national-hotline mission-aligned reach opens (hashstream ≈ their
  Global-Standard exchange need). **Only after BOTH** NCMEC ESP credentials **AND**
  outside-counsel sign-off **+ ≥1 consented filing partner.**

**Owner-gated prerequisites.**
- **TWO hard external owner gates, non-bypassable:** (1) **NCMEC ESP credentials**
  (unblock live sync + cybertip real submit + the ncmec_verified vectors);
  (2) **outside-counsel sign-off** on cybertip + evidencevault production/retention
  (`counsel-scope-brief.md` reviewed first).
- **Plus ≥1 consented real-world filing partner.**
- Until **both** land, cybertip stays `ProductionSubmitBlocked` and retention
  stays unenforced — stubs visible, never bypassed (even in agent-generated code).
- Written sign-off from the filing partner before any partner-named messaging.
- All un-gated platform hardening (signing, matrix, deploy guides) ships
  regardless — v2.0 platform work is **not** blocked by the legal-tier hold.

**Success metrics.**
- Both external gates verifiably satisfied **before** any "report/preserve" claim
  goes live (ESP credentials in hand + counsel sign-off on file + ≥1 consented
  filing partner).
- ≥1 consented real filing executed end-to-end on the live path.
- `ncmec_verified` corpus vectors landed (target ≥50 per the plan); cross-platform
  conformance matrix green with mandatory drift gates.
- Sigstore/cosign signatures across all packages; per-tool deploy guides published.
- The coordinated 2.0 breaking wave shipped with per-package migration guides;
  no un-guided breaking change.
- ≥1 mission-aligned (INHOPE / national-hotline / academic) conversation opened
  off the live credentialed proof — individually, not via a blast.

**Do NOT do yet / Do NOT ever (v2.0).**
- **Do NOT** flip cybertip to real submit or evidencevault to enforced retention
  before **both** gates **and** a consented filing partner are real. Stubs visible,
  never bypassed.
- **Do NOT** claim "compliant" even now — the end-to-end story is "defensible,
  documented steps across the full duty; consult counsel." (Safety-policy
  invariant #4: no compliance attestation by default.)
- **Do NOT** imply NCMEC / Meta / ROOST endorsement from holding ESP credentials
  or serving credentialed lists — credentials are an operational unlock, not a
  vouch.
- **Do NOT** name the filing partner, the ESP relationship, or any hotline without
  prior **written** sign-off.
- **Do NOT** mass-contact INHOPE / national hotlines — individual, value-first,
  ledgered, opt-out-respecting, off the live proof point only.
- **Do NOT** bundle the legal-tier GA into a second big "launch" — it is a
  release-notes + targeted-notification moment; the one disciplined launch already
  happened at v1.0.
- **Do NOT** ship a hash list, ever — operators still bring their own credentialed
  NCMEC/IWF/Arachnid list even on the live path.

---

## Standing guardrails (apply to every release, every channel, every word)

These are hard gates, not guidelines — carried from the Anti-Spam &
CSAM-Credibility Guardrails. A single violation can brand the project a spammer
or an over-claimer and poison the ROOST/Meta/NCMEC relationships the whole plan
depends on.

- **Outreach:** human-written, individually relevant, **batched ≤5/week**,
  opt-out-respecting, via email/threads/DMs — **never cold GitHub issues**. Capped
  to the 24 "use"-verdict allies + a curated "learn-from" subset, only where there
  is genuine value to send. **Prefer merged upstream PRs over emails.** Maintain a
  gitignored outreach ledger; honor every "no"; never re-contact; never automate.
- **Do-not-contact:** all 13 out-of-scope + all 41 reference-only projects +
  Big-Tech in-house T&S.
- **Claims:** never "compliant" / "turnkey compliance" — anywhere, including
  agent-generated code, `/llms.txt`, the manifest, the Agent Skill, READMEs, the
  Evidence Pack, and the docs-MCP. Pair every obligation claim with the counsel
  disclaimer **and** the "known-hash-isn't-enough" framing. Never "beats Meta /
  beats PDQ"; lead with CONFORMANCE.md (parity), never benchmarks. Never imply
  ROOST/Meta/Bluesky/NCMEC endorsement. Mirror "inclusion is not an endorsement."
  Secure **written** sign-off before any logo, quote, or the word "partner."
- **Safety:** ship **no hash list, ever** (`safety-check.sh` fails closed on any
  bundled hash artifact). Every demo / Space / Show HN example / quickstart uses
  `detectkit-test` synthetic fixtures only. Encode the no-hash-list rule +
  "compliance-defensible, never compliant" into `/llms.txt`, the manifest, the
  csam-safety Skill, and the `/agents` page so the constraint travels with every
  agent-consumed artifact. Privacy framing always: auditable, operator-controlled,
  self-hosted, no client-side-scanning mandate — never "surveillance."
- **Solo-maintainer discipline:** lean on passive acquisition (agent-native
  surface, create-fightcsam, docs-MCP) + tight release-pegged outreach batches;
  do not treat multi-community presence as continuous. Keep the contributable
  surface narrow + gated surfaces fenced; publish honest response expectations;
  never promise SLAs the maintainer can't keep. Stage the public launch only after
  the funnel is self-serve.
- **Never (yet):** no promotion before v0.1 publish resolves every
  install→quickstart; no cybertip real submit / evidencevault enforced retention
  before both NCMEC ESP credentials + outside-counsel sign-off + ≥1 consented
  filing partner; no pulling gated surfaces forward (red-team pack stays v0.4,
  legal tier stays v2.0); no public launch without all three gate conditions; no
  Lantern/funder/Meta/ROOST ask before v0.1 publish + v0.3 conformance give a live
  proof point; no bulk submit to any awesome-list.
