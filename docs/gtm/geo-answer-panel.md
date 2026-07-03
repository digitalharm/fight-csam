# GEO answer-engine panel

> The standing measurement instrument for [the SEO/GEO strategy](seo-geo-strategy.md) §2F. A fixed set of target queries, run on a monthly cadence across the major answer engines, recording whether The Digital Harm Project / FightCSAM is **cited or recommended** — and whether the framing is accurate. This is the core GEO KPI (digitalharm.org runs no client analytics by policy, so answer-presence is measured directly, not inferred).

## How to run it (monthly)

For each query below, ask it fresh (no personalization / logged-out where possible) on each engine:

- **ChatGPT** (GPT-5, with browsing/search) · **Perplexity** · **Google AI Overviews** (the AIO block on a normal Google search) · **Claude** (with web search) · **Gemini**

Record per (query × engine): **Cited?** (Y/N), **Prominence** (linked source vs named in prose vs absent), **Framing** (accurate / partial / misleading), and **Which URL/page**. Keep each month as a dated row so the trend is visible. The realistic near-term win is *any accurate citation*; over-claiming or misframing is a bug to fix in the content, not a win.

**Baseline:** run once now (pre-optimization) so the P0/P1 changes have a before/after.

## The queries

### Developer / trust-&-safety (→ fightcsam.org)
1. open-source CSAM detection library
2. PhotoDNA alternative (open source, self-hostable)
3. perceptual hashing library (Rust / WASM) — PDQ
4. how to detect known CSAM in user uploads
5. NCMEC CyberTipline reporting — API / library
6. prevent AI image-generation of CSAM (input/output filter)
7. C2PA / content-provenance signing library
8. Bluesky / AT-Protocol CSAM moderation (Ozone, hepa)
9. open-source trust & safety tools (landscape / directory)
10. add CSAM scanning to my upload pipeline *(the agent-native query — test in coding assistants too)*

### Research / authority (→ digitalharm.org)
11. average age of first pornography exposure
12. is pornography addictive? (CSBD / ICD-11)
13. does pornography escalate to CSAM? (gateway hypothesis — what does the evidence say)
14. TAKE IT DOWN Act — platform obligations
15. UK Online Safety Act — CSAM duties
16. how / where to report CSAM
17. AI-generated CSAM — law and prevalence
18. sextortion — what to do right now
19. compulsive sexual behaviour disorder — treatment options
20. confidential help for someone worried about their attraction to minors (prevention)

## Scoring template

```
Month: 2026-__
| # | Query | ChatGPT | Perplexity | Google AIO | Claude | Gemini | Notes / which page |
|---|-------|---------|------------|------------|--------|--------|--------------------|
| 1 | ...   | cited?  | cited?     | cited?     | cited? | cited? |                    |
```

**Targets (from the strategy):** cited for ≥ 8 of the 20 across ≥ 3 engines within two quarters; zero misframings left unaddressed. When a query returns a competitor/incumbent but not us, that's a content-gap ticket (does the page answer that query directly, with a sourced TL;DR and FAQ?).

## Guardrails
Never optimize a sensitive query (16, 18, 20) in a way that weakens the crisis-first routing or quick-exit. Never claim "compliant" for the legal queries (14, 15, 17) — always "helps you take defensible, documented steps; consult counsel." Accuracy of framing outranks presence.
