# SEO & GEO strategy — digitalharm.org + fightcsam.org

> **What this is.** The search + generative-engine visibility strategy for The Digital Harm Project's two properties. Companion to [marketing-acquisition-plan.md](marketing-acquisition-plan.md); same guardrails apply (never "compliant"; never "beats Meta"; nothing that trades safety for traffic).
> **Grounded in a live audit, 2026-06-07.** SEO = ranking in Google/Bing. GEO = being *cited/recommended* by AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Claude, Gemini) and by coding agents.

## Thesis

Two properties, one entity, complementary jobs:
- **digitalharm.org** — the *authority/research* surface (YMYL: pornography harm, CSAM, CSBD, law). Its job is **citations** — from journalists, courts, clinicians, and AI answer engines. Its moat is E-E-A-T (peer-reviewed synthesis + citations + a named review board).
- **fightcsam.org** — the *developer/tool* surface. Its job is to be **the tool a developer — or their AI coding agent — reaches for** when told "add CSAM safety." Its moat is the agent-native surface (llms.txt + the `csam-safety` skill) — which is *already* a GEO play no incumbent has.

The strategic insight from the audit: **each site already has what the other lacks.** digitalharm.org has the full SEO technical stack but no machine-readable AI surface; fightcsam.org has the AI surface but is missing the SEO basics. Closing both gaps + cross-linking the two under one Organization entity compounds authority for both.

---

## Current-state audit (2026-06-07)

| Signal | digitalharm.org | fightcsam.org |
|---|---|---|
| robots.txt | ✅ `Allow: /` (all crawlers incl. AI) + Sitemap + Host | ❌ **404 — none** |
| sitemap.xml | ✅ 200, 38 URLs | ❌ **404 — none** (static export didn't emit one) |
| Structured data | ✅ Organization, WebSite, SearchAction (sitelinks box) | ❌ **0 JSON-LD** |
| llms.txt / llms-full / per-page md | ❌ **404 — none** | ✅ all three |
| Title / meta description | ✅ audience-framed | ⚠️ present but dev-only ("for developers and their coding agents") |
| Canonical / OG / Twitter | ✅ | ✅ |
| Analytics | ⛔ **none, by policy** (privacy posture — measure without surveillance) | none |

**Net:** fightcsam.org has three P0 technical gaps (sitemap, robots, schema); digitalharm.org has one P0 GEO gap (no llms.txt) and a per-page-schema gap. Neither is a rewrite — all are additive.

---

## Part 1 — SEO

### 1A. Technical foundation (fix the audit gaps first)
- **fightcsam.org sitemap.xml** — generate at build. It's a Fumadocs static export; emit `sitemap.xml` (+ `robots.txt` pointing to it) covering `/`, every `/docs/*` tool page, the ecosystem pages, and the skill page. *Without this, Google is crawling the docs blind.* **P0.**
- **fightcsam.org robots.txt** — add one that `Allow: /`, declares the sitemap, and explicitly lists AI crawlers (see GEO §2A). **P0.**
- **fightcsam.org structured data** — add JSON-LD: `Organization` (sameAs digitalharm.org + the GitHub org), `SoftwareSourceCode`/`SoftwareApplication` per tool page, `BreadcrumbList` for docs nav, `FAQPage` on pages with Q&A. **P1.**
- **Both** — keep canonical discipline (done), ship clean Core Web Vitals (both are static/SSG — already fast; verify LCP/CLS on the docs pages and the research long-reads), and maintain descriptive internal-link anchors (the ecosystem directory + guides cross-links are an asset).

### 1B. E-E-A-T / YMYL — the #1 lever for digitalharm.org
CSAM + addiction + legal is maximal **YMYL** ("Your Money or Your Life"); Google and AI engines weight Experience-Expertise-Authoritativeness-Trust above almost everything. Convert the existing trust assets into machine- and rater-legible signals:
- **Author + reviewer bylines** on every research/guide page: named author, credentials, "Reviewed by [DARK review board]," and a visible **"Last reviewed"** date. (The DARK review-board model + editorial-standards already exist — surface them *on the page*, not just in /about.)
- **Citations as first-class** — every statistic links to its primary source (peer-reviewed / government). This is both E-E-A-T and the GEO citation hook (§2C).
- **Methodology + "how we vet"** linked from content (exists at /editorial-standards) — add `Organization.knowsAbout` + `Article.author`/`reviewedBy` schema so raters and LLMs see it.
- **Ethical guardrail:** never chase traffic on exploitative queries; keep the quick-exit + crisis routing above the fold on sensitive pages. Safety > rank, always.

### 1C. Keyword / content strategy (map ICP audiences → query clusters → pages)
Target the query each audience actually types. (Volumes to be validated via Search Console + a live keyword pass — the Tavily research skills — once reconnected; below is the intent map.)

| Audience (from ICP) | Query cluster | Landing surface |
|---|---|---|
| Parents / educators | "is porn addictive", "how porn affects teens", "talk to my kid about…" | digitalharm.org guides + research |
| Lawyers / courts | "CSAM legal definition", "TAKE IT DOWN Act obligations", "CSBD ICD-11" | digitalharm.org /laws + research |
| T&S / platform leads | "open source CSAM detection", "PhotoDNA alternative", "NCMEC reporting API" | fightcsam.org tools + digitalharm.org /tools |
| Developers | "PDQ hashing library", "perceptual hash npm/rust", "detect CSAM upload" | fightcsam.org per-tool docs |
| AI startups | "prevent CSAM image generation", "AI safety input filter", "C2PA sign" | fightcsam.org promptshield / c2pa-lite |
| People seeking help | "how to stop", "confidential help" | digitalharm.org /get-help (crisis-first, never monetized) |

Content moves: a **glossary/definitions** hub (definitions are prime GEO extraction targets), the **Laws & Policy tracker** kept current (evergreen authority), and per-tool "**how to** [task]" pages that match developer intent verbatim.

### 1D. Off-page / authority (this is where the GTM plan feeds SEO)
Backlinks + citations are the same currency as the acquisition plan's outreach — sequence them the same way:
- The **awesome-safety-tools PR** (a high-authority inbound link + a widely-scraped GEO source) — the single highest-leverage link.
- **Research citations** — the synthesis being cited by journalists / orgs / academics = the strongest links digitalharm.org can earn; make pages citable (§2C) and offer a "cite this" snippet (already have one for the review board).
- Partner/ally links (ROOST, NCMEC/IWF directories, Tech Coalition) — value-first, per the outreach guardrails (no spam).
- Package-registry pages (crates.io/PyPI/npm/pkg.go.dev) each backlink to fightcsam.org once published — another reason v0.1 publish gates the whole funnel.

---

## Part 2 — GEO (Generative Engine Optimization)

GEO = getting **surfaced, quoted, and recommended** by AI answer engines and coding agents. Five levers:

### 2A. Crawler access — decide it on purpose
AI answer engines only cite what they can fetch. Add an explicit, intentional allow-list to **both** robots.txt for the retrieval/citation bots, while keeping a considered stance on training bots:
- **Allow (answer/citation + search):** `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`/`Claude-SearchBot`, `Google-Extended` (AI Overviews/Gemini grounding), `Bingbot` (Copilot).
- **Owner's call (model *training*):** `GPTBot`, `CCBot`, `anthropic-ai`. Recommendation: **allow** — for a public-good CSAM-safety project, being in the training corpus means agents *natively* know the tools and the research. (If any page shouldn't train, exclude just that path.)
- fightcsam.org currently sends bots a 404 for robots.txt → they fall back to "crawl everything," but with **no sitemap pointer**. Fixing §1A resolves this.

### 2B. Machine-readable surfaces
- **digitalharm.org: add `/llms.txt`** (+ optionally `/llms-full.txt`) — a curated, linked index of the research chapters, guides, laws tracker, and org info. This is the single biggest GEO gap on the authority site. **P0.**
- **fightcsam.org: keep + extend** llms.txt/llms-full/per-page `.mdx` (already strong). Add the planned `/.well-known/fightcsam.json` manifest + `/agents` conventions page from the site design.
- **Both:** clean semantic HTML + the structured data from §1A — LLMs parse schema.org to extract entities and claims reliably.

### 2C. Structure content for extraction & citation
AI engines lift *discrete, well-attributed* units. Format for that:
- **Direct-answer openings** — lead each page with a 1–2 sentence TL;DR that answers the query outright (then elaborate).
- **Definitions + FAQ blocks** with `FAQPage` schema — the format most often quoted verbatim in AI Overviews / Perplexity.
- **Citable statistics** — each stat as its own sentence with the source inline (LLMs cite the source alongside the claim). digitalharm.org's sourced synthesis is *ideal* GEO fuel; make each claim atomic.
- **Comparison tables** — the ecosystem directory's verdict tables and any "X vs Y" content extract cleanly and get cited for "best/alternative" queries.

### 2D. Entity & authority in AI corpora (the strongest GEO signal)
AI engines recommend entities they see corroborated *across* independent sources:
- **One consistent Organization entity** — "The Digital Harm Project," identical name/logo/URL everywhere, with `sameAs` linking digitalharm.org ↔ fightcsam.org ↔ the GitHub org ↔ any social. Cross-link the two sites in-body (digitalharm.org `/tools` → fightcsam.org, and fightcsam.org footer → digitalharm.org — both already exist; keep them).
- **Wikidata** entry for the project + notable tools (feeds knowledge graphs that ground Gemini/Google). Wikipedia only if genuinely notable (don't force it).
- **Be cited elsewhere** — the awesome-safety-tools listing, registry pages, ally links (§1D) are *also* GEO signals: an AI engine seeing FightCSAM on ROOST's list + on PyPI + cited by digitalharm.org treats it as a real, corroborated entity.

### 2E. The agent-native / AEO play (fightcsam.org's superpower)
For the developer/agent audience, "GEO" means **be the answer a coding agent gives** when a dev says "add CSAM scanning to my upload pipeline":
- The **`csam-safety` skill** already encodes the 11 tools, exact installs, and gates — publish/register it where agents discover skills.
- **`create-fightcsam` + the docs-MCP** (planned) let an agent scaffold correctly with the no-hash-list / never-"compliant" rails baked in — so scaling agent reach never scales risk.
- Seed the correct answer where agents retrieve: llms.txt, GitHub READMEs (lead with the verified install), and the awesome-safety-tools entry.

### 2F. Measurement (respecting the no-analytics posture)
digitalharm.org runs **no client analytics by policy** — measure without surveillance:
- **Search Console** (Google + Bing) for both properties — impressions/clicks/queries/coverage. (Not analytics; no visitor tracking.)
- **Server/CDN logs** for AI-crawler hits (GPTBot/PerplexityBot/etc.) and referral traffic from `chat.openai.com`, `perplexity.ai`, `gemini`, etc.
- **A standing AI-answer panel** — a fixed list of ~20 target queries (from §1C) run monthly across ChatGPT, Perplexity, Google AIO, Claude, Gemini; record whether we're cited/recommended and with what framing. This is the core GEO KPI.

---

## Prioritized roadmap

**P0 — this week (technical + highest leverage, no owner-gating):**
1. fightcsam.org: generate `sitemap.xml` + `robots.txt` (with AI-bot allow-list). *Bug fix — the docs are currently un-sitemapped.*
2. digitalharm.org: add `/llms.txt` (curated index of research + guides + laws).
3. Both: verify the AI-crawler allow policy in robots.txt (owner decision on training bots).

**P1 — foundation (weeks 2–4):**
4. fightcsam.org: add JSON-LD (Organization + per-tool SoftwareSourceCode + Breadcrumb + FAQ); broaden the meta description to name the T&S/buyer audience, not just developers.
5. digitalharm.org: per-page `Article`/`FAQPage`/`author`+`reviewedBy` schema + visible bylines, reviewer, and "last reviewed" dates (E-E-A-T).
6. Both: definitions/glossary hub + direct-answer TL;DRs on top pages.
7. Set up Search Console + the AI-answer query panel; start the baseline.

**P2 — authority (tied to the release cadence + GTM plan):**
8. On v0.1 publish → registry backlinks live; open the awesome-safety-tools PR (link + GEO source).
9. Wikidata entity for the project + tools; pursue research citations (journalist/academic outreach per the acquisition plan's guardrails).
10. Publish `create-fightcsam` + docs-MCP; register the skill for agent discovery.

## Targets (first two quarters, directional)
- Both sites fully indexed with 0 coverage errors; fightcsam.org docs in the index within ~2 weeks of the sitemap landing.
- Appear (cited) for ≥ 8 of the 20 panel queries across ≥ 3 AI engines.
- Awesome-safety-tools PR merged; ≥ 5 corroborating third-party references to the FightCSAM entity (registries + directories + allies).
- digitalharm.org research pages cited by ≥ 3 external authoritative sources.

## Guardrails
Everything here inherits the acquisition-plan guardrails: **no "compliant" claims**, **no "beats Meta,"** **no outreach before v0.1 publish resolves installs**, and **safety before ranking** (never optimize sensitive pages in ways that weaken the quick-exit/crisis routing or chase exploitative queries).
