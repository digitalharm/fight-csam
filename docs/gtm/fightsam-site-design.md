# FightCSAM — developer website design

**What this is.** The design for **FightCSAM** (fightcsam.org): a separate,
developer- and coding-agent-facing website that is the front door to the 11
open-source CSAM-safety packages in this repo (`fight-csam`). It is the
"how do I actually build this" companion to **The Digital Harm Project**
(`digitalharm.org`, the public-education site). Naming stays as-is — the
*packages* keep the `digitalharm`/`@digitalharm` convention; **FightCSAM is the
site brand, not a package rename.**

**Decisions locked (owner):**
- **Scope (v1):** docs + a guided **golden path** + a **scaffolding CLI** +
  a **docs MCP server**. (Most ambitious option.)
- **Stack:** **Fumadocs** (Next.js App Router + MDX), Vercel-deployed.
- **Brand:** its **own developer identity** (code-forward, dark-first), cross-
  linked with digitalharm.org but visually distinct.
- **Domain:** **fightcsam.org**.
- **Agent-friendly baseline** (in scope regardless): `llms.txt`, per-page raw
  Markdown, a machine-readable package manifest, copy-as-Markdown / open-in-LLM
  actions, and SSG so all content is present without executing JS.

---

## 1. Why a separate site (positioning)

| | digitalharm.org — "The Digital Harm Project" | fightcsam.org — "FightCSAM" |
|---|---|---|
| Audience | Parents, survivors, clinicians, educators, policymakers | Developers, T&S engineers, AI startups, coding agents |
| Job | Understand the harm; get help | Ship the protection; reach compliance |
| Voice | Editorial, careful, survivor-centered | Direct, technical, copy-paste-first |
| Content | Research report, guides, crisis resources | API docs, quickstarts, the golden path, the CLI/MCP |
| Success | A person finds help / cites the research | A developer (or their agent) ships a compliant pipeline today |

Keeping them separate means neither compromises the other: the public site never
reads like an SDK, and the dev site never makes a panicking parent wade through
`cargo add`. They cross-link (digitalharm.org `/tools` → fightcsam.org; FightCSAM
footer → digitalharm.org for the "why").

**The north star for FightCSAM:** a developer — or a coding agent acting for one —
arrives, and within minutes has either (a) installed the one tool they came for,
or (b) been walked down the **golden path** to a working, compliant CSAM pipeline.
The site is optimized so an **AI coding agent** can consume it as well as a human.

---

## 2. Information architecture (sitemap)

```
/                         Landing — what FightCSAM is, the 3 entry paths, the pitch
/start                    "Get protected in 15 minutes" — the golden-path entry
/golden-path/             The guided compliance walkthrough (the crown jewel)
  /assess                   1. What are you? (UGC host / AI generator / Fediverse) + which laws apply
  /detect                   2. Wire CSAM detection (hashkit + csam-shield)
  /report                   3. Wire NCMEC reporting (cybertip-cli) + preservation (evidencevault)
  /prevent                  4. AI-generation guards (promptshield + trainguard) [if applicable]
  /provenance               5. Content credentials (c2pa-lite) [if applicable]
  /care                     6. Moderator wellbeing (safemod) [if manual review]
  /verify                   7. Prove it works (detectkit-test) + a compliance checklist
/docs/                    Per-tool documentation (the 11 packages)
  /docs/<tool>/             overview · install · quickstart · API · examples · gotchas
/compliance/              Reference: OSA / TAKE IT DOWN / §2258A / DSA mapped to tools
/concepts/                Perceptual hashing, the no-hash-list principle, the threat model
/cli/                     The `create-fightcsam` scaffolder + the FightCSAM CLI
/mcp/                     The docs MCP server: how an agent connects + tool catalog
/agents                   "For coding agents" — llms.txt, raw-md endpoints, manifest, conventions
/about                    What this is, link to The Digital Harm Project, governance, license
```

**Three entry paths on the landing page** (mirror the ICP personas):
1. **"I host user content"** → golden path (detect + report).
2. **"I build AI image/video"** → golden path (prevent + provenance + detect).
3. **"I run a Fediverse/self-hosted server"** → golden path (self-host detect + report), the warm beachhead.
Plus a fourth, quieter: **"I just want one tool"** → /docs.

---

## 3. The coding-agent-friendly system (the differentiator)

This is what makes FightCSAM stand out. Most docs sites are built for humans and
agents scrape them badly. FightCSAM treats **the coding agent as a first-class
visitor** with its own supported interface.

### 3.1 Discovery & whole-site context
- **`/llms.txt`** — the curated index (the llms.txt standard): one-line site
  description + a categorized link list of every page with its raw-markdown URL.
  The "front door" an agent reads first.
- **`/llms-full.txt`** — the entire docs corpus concatenated as plain Markdown,
  so an agent can load the whole site into context in one fetch. (Fumadocs can
  generate both at build time.)
- **`/.well-known/fightsam.json`** — a machine-readable **package manifest**:
  every tool with `{name, ecosystem, install command, repo, latest version, one-
  line purpose, docs URL, raw-md URL, capabilities[]}`. The canonical
  "what exists and how do I install it" an agent queries before writing code.

### 3.2 Per-page machine access
- **Raw Markdown for every page** at a predictable URL (`<page>.md` or an
  `?format=md` / content-negotiation on `Accept: text/markdown`). No HTML
  scraping, no JS execution needed.
- **A visible "Copy page as Markdown" button** + **"Open in Claude / ChatGPT"**
  action on every doc page (deep-links the page's raw-md into the assistant).
- **Content negotiation**: a request with `Accept: text/markdown` to any page
  returns the `.md` source. Agents get clean text; browsers get HTML.

### 3.3 SSG / no-JS-required
- Statically generated; **all content is in the initial HTML** (and the `.md`).
  Agents (and curl, and search crawlers) get the full page without running JS.
  Interactive bits (the golden-path wizard, copy buttons) are progressive
  enhancement layered on top of complete static content.

### 3.4 The docs MCP server (`/mcp`)
A Model Context Protocol server an agent connects to as a tool, exposing:
- `search_docs(query)` → ranked doc chunks (over the same content corpus).
- `get_tool(name)` → the manifest entry + install + quickstart for a package.
- `get_golden_path(profile)` → the ordered step list for a given platform profile.
- `get_compliance(regime)` → which tools satisfy which obligation (OSA/TAKE IT DOWN/§2258A).
Hosted alongside the site (a Next.js route handler or a small companion service);
documented on `/mcp` with a one-line connect string for Claude/Cursor/etc.
This is the "an agent can *query* FightCSAM as a live tool" capability, beyond
just reading static files.

### 3.5 Conventions page (`/agents`)
A single page (human- and agent-readable) that documents all of the above: the
llms.txt URLs, the raw-md scheme, the manifest location, the MCP connect string,
and the house rules (e.g. "we ship no hash lists; you bring the credentialed
list" — so an agent doesn't hallucinate a bundled NCMEC list).

> **Net effect:** a coding agent told "add CSAM scanning to my upload pipeline"
> can: read `/llms.txt` → query the manifest → pull `csam-shield`'s raw-md
> quickstart → (optionally) call the MCP `get_golden_path` → emit correct,
> current install + wiring code, with the no-hash-list caveat intact.

---

## 4. The golden path (the crown jewel)

A guided, branching walkthrough that takes a developer from "nothing" to a
working, **compliance-defensible** CSAM pipeline — the thing no incumbent offers
and no single tool delivers.

- **Step 0 — Assess.** A short branching questionnaire (host UGC? generate AI
  media? Fediverse? which user geographies?) → produces a **personalized plan**:
  which laws apply (OSA / TAKE IT DOWN / §2258A / DSA / eSafety) and which of the
  11 tools they need, in order.
- **Steps 1–7 — Wire it.** Each step is copy-paste-first: the exact install, the
  minimal integration snippet (Node + Python where both exist), what it does,
  the gotcha, and a "you've done this when…" check. Steps are **conditional** on
  the Step-0 profile (an AI-only startup skips the upload-middleware step; a
  Fediverse admin gets the self-host path).
- **The honest gates, surfaced inline:** where a step needs a credentialed hash
  list (NCMEC/IWF) or counsel sign-off (cybertip production submit), the path
  says so plainly and links how to obtain it — never pretends it's bundled.
- **Ends with** a downloadable **compliance checklist** mapping each obligation
  to the tool/step that satisfies it (the artifact a small platform shows a
  regulator), and the `detectkit-test` "prove it works in CI" step.
- **Agent-consumable:** the entire golden path is also a single structured object
  (served via the manifest + MCP `get_golden_path`) so an agent can execute it
  end-to-end, not just a human clicking through.

This directly answers the original "super-solution" question: **not** a monolith
that hides the tools, but a **guided golden path + scaffolder** that wires the
right subset of our tools (plus best-in-class externals where we don't compete)
into one opinionated, compliant pipeline.

**This is independently confirmed by the landscape analysis**
(`landscape-analysis-2026-06.md`, 79 projects): its super-solution verdict is the
same — *"neither a monolith nor 11 loose libraries, but a thin opinionated
meta-CLI that scaffolds a golden-path pipeline; build the CSAM detection + report
+ preserve core deep, wrap everything else."* The site's golden path and the
`create-fightcsam` CLI are the two front-ends of exactly that `fightsam init`
recommendation. The analysis also pins the **build-vs-wrap split** the golden
path should encode at each step:
- **BUILD/own deep:** hashkit (+vPDQ), hashkit-match (+FP-guard), csam-shield
  (refactored to an ActionRule + plugin registry), hashstream (+SignalExchange
  plugin), promptshield (+CSAM-intent red-team pack), cybertip-cli, evidencevault,
  safemod, c2pa-lite — plus two new connectors the analysis flags as highest-ROI:
  a **Bluesky/AT-Proto adapter** (hepa blob rule + Ozone emitter) and an
  **Osprey/Coop adapter**.
- **WRAP/recommend, don't rebuild:** Osprey (rules), Presidio (PII), Granite
  Guardian / Llama Guard / ShieldGemma (text/image classifiers), Ozone + Meta
  Content Review Filters (reviewer UI), BullMQ/RabbitMQ (queues), Garak/PyRIT/
  Promptfoo (red-team harness).
The golden-path wizard, the `create-fightcsam` profiles (`--profile bluesky` /
`ai-startup` / `small-platform`), and the MCP `get_golden_path` all read this one
build-vs-wrap spec as their single source of truth.

---

## 5. The scaffolding CLI + MCP (`create-fightcsam`)

- **`npx create-fightcsam`** (and a `pipx`/`uvx` equivalent) — an interactive
  scaffolder that runs the Step-0 assessment in the terminal and **generates a
  starter integration**: the chosen tools installed, wired into a sample
  upload/generation pipeline, with `.env.example` for the credentialed bits, a
  README mapping the setup to its compliance obligations, and a passing
  `detectkit-test` CI workflow. The "create-next-app for CSAM safety."
- **Non-interactive / agent mode:** `create-fightcsam --profile ugc-node
  --json` so a coding agent can scaffold without prompts.
- Lives in the repo as a new package (`packages/create-fightcsam` or
  `tools/create-fightcsam`), reusing the golden-path data as its single source of
  truth (the website wizard, the CLI, and the MCP all read the same path spec).
- **MCP server** (§3.4) ships from the same package so "the website's golden
  path," "the CLI," and "the agent tool" are three front-ends over one engine.

---

## 6. Developer brand direction

Its own identity — what a developer expects from a serious dev-tool, deliberately
distinct from digitalharm.org's editorial serif world:
- **Dark-mode-first**, high-contrast, code-forward. Monospace for the wordmark
  and accents; clean sans for body.
- **Terminal/console motifs**: the hero shows a real install + 5-line wiring
  snippet, not a stock illustration. Copy blocks everywhere, syntax-highlighted.
- **Restraint, given the subject.** Serious and trustworthy, not edgy — this is
  child-safety tooling. No dark humor, no "hacker" cosplay. Confidence through
  clarity and working code, not bravado.
- **Accent palette** distinct from digitalharm.org's; a small visual "by The
  Digital Harm Project" tie-back in the footer for trust lineage.
- Accessibility: WCAG AA, respects reduced-motion, dark/light toggle.

(A focused design pass / mockups can follow once IA is approved — the structure
above is the gate; visual polish is a later step.)

---

## 7. Tech & repo placement

- **Framework:** Fumadocs (Next.js App Router + MDX). Chosen for: native
  `llms.txt`/Markdown-export support, MDX authoring, full control over the
  agent-facing routes (raw-md, manifest, MCP handler), Vercel-native, and stack
  continuity with digitalharm.org (Next.js) without sharing its design.
- **Placement:** a new workspace app at **`apps/fightsam-site/`** in this repo
  (monorepo with the packages it documents — so docs can import real types/
  versions from the packages and never drift). Add a root workspace config
  (pnpm workspace) covering `apps/*` + `packages/*`.
- **Content source of truth:** MDX in `apps/fightsam-site/content/`, with the
  per-tool overview pages able to pull each package's real `version` + README so
  install strings can't go stale (ties into the publish runbook).
- **Deploy:** its own Vercel project on **fightcsam.org** (separate from the
  addiction/digitalharm.org project).
- **CI:** a build-green gate + a check that every package in `packages/` has a
  `/docs/<tool>` page and a manifest entry (mirrors the website's
  search-registry guard discipline — no tool ships undocumented).

---

## 8. Build plan to v1

| Phase | Deliverable | Gate |
|---|---|---|
| **0. Scaffold** | `apps/fightsam-site` Fumadocs app builds + deploys a placeholder to fightcsam.org; pnpm workspace wired | site loads; CI green |
| **1. Agent baseline** | `/llms.txt`, `/llms-full.txt`, per-page raw-md, `/.well-known/fightsam.json` manifest, `/agents` page, content-negotiation | an agent can fetch the manifest + any page as md; no-JS content verified via curl |
| **2. Docs** | `/docs/<tool>` for all 11 packages (overview/install/quickstart/API/gotchas), pulling real versions | every package documented; manifest auto-covers all 11 (CI-enforced) |
| **3. Golden path** | `/golden-path` branching wizard + `/start` + downloadable compliance checklist; golden-path spec as structured data | a dev completes a profile → correct ordered plan; spec served to manifest/MCP |
| **4. CLI** | `create-fightcsam` scaffolder (interactive + `--json` agent mode) generating a wired starter + CI | `npx create-fightcsam` produces a building, test-passing sample |
| **5. MCP** | docs MCP server (`search_docs`/`get_tool`/`get_golden_path`/`get_compliance`) + `/mcp` connect docs | Claude/Cursor can connect and answer a "how do I add CSAM scanning" query from it |
| **6. Brand polish** | the developer visual identity applied; landing page hero with live snippet; a11y pass | WCAG AA; design reviewed |

v1 = phases 0–5 functional + phase 6 polish. Each phase ships independently
(the site is useful at phase 2; the golden path and CLI compound from there).

---

## 9. Open questions for the owner

1. **fightcsam.org DNS/Vercel** — owner provisions the domain + a new Vercel
   project (same gate class as the package-registry credentials; I can't buy a
   domain). Confirm the registrar/Vercel account to use.
2. **MCP hosting** — host the MCP server on the same Vercel project (route
   handler) vs a tiny separate service? (Recommend: same project, a Next route,
   to start.)
3. **CLI package name** — `create-fightcsam` is the npm convention; confirm we
   want the *brand* (FightCSAM) on the CLI even though the libraries are
   `@digitalharm/*`. (Recommend yes — the CLI is the FightCSAM-branded front door;
   it *installs* the digitalharm packages.)
4. **Externals in the golden path** — are we comfortable recommending best-in-
   class non-FightCSAM tools at steps we don't cover (e.g. Osprey for rules,
   Presidio for PII, Llama Guard for text)? (Recommend yes — it makes the path
   genuinely complete; the landscape analysis informs the picks.)
5. **Scope confirm** — phases 0–2 (agent-ready docs) are the minimum lovable
   product; golden-path + CLI + MCP (3–5) are the differentiation. Ship 0–2
   first and iterate, or hold v1 until 0–5 are all done?

---

*Companion docs: `docs/gtm/adoption-strategy.md` (why developers adopt),
`docs/gtm/ideal-customer-profile.md` (who), `docs/gtm/landscape-analysis-2026-06.md`
(what externals to recommend — in progress). This is a design/planning doc; no
site code written yet. The packages keep the digitalharm naming; FightCSAM is the
site brand only.*
