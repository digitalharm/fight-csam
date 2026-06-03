# Ideal Customer Profile & Target Map — digitalharm-oss

**What this is.** A go-to-market analysis identifying who needs the digitalharm-oss
toolkit (11 Apache-2.0 CSAM detection/prevention tools), the Ideal Customer
Profile, a prioritized + named target list, and the realistic monetization read.
Built from four parallel market-research sweeps (AI-generation, UGC platforms,
infrastructure/embedders, and demand-drivers/competitive landscape), 2024–2026.

**A framing note.** Because the tools are Apache-2.0 open source, the primary
"customer" is an **ideal adopter** — a team that integrates the tools and is
protected by them. Revenue is a *secondary* relationship layered on top
(managed hosting, compliance attestation, integration services) for the subset
of adopters who will pay to de-risk. The ICP below is written for adopters
first, with the monetizable subset called out explicitly.

---

## 1. The one-paragraph ICP

> A **small-to-mid platform that hosts or generates user media and was newly
> obligated to detect/report CSAM by the 2024–2026 regulatory wave — but is
> locked out of the incumbent tools.** The obligation isn't one event but a
> cluster of overlapping laws that all took effect within ~24 months (UK Online
> Safety Act in force 2025 — the biggest forcing function; EU DSA Feb 2024; US
> REPORT Act May 2024 + the standing §2258A duty; US TAKE IT DOWN Act 2025/FTC
> enforcement 2026; AU eSafety 2025–26 — full detail in §3). It has an "upload
> button" or a generative model, and it has **no in-house Trust & Safety team**.
> It cannot easily get PhotoDNA (vetting-gated, cloud-only), cannot afford or
> doesn't want Thorn Safer / Hive (paid, sales-gated, contract), and isn't a
> Cloudflare-only shop (the one free option, but vendor-locked). It will adopt a
> self-hostable, no-gate, no-per-scan-fee toolkit **today**, often triggered by
> a payment-processor warning, a lawsuit in its category, a funding round, or a
> compliance deadline.

This is the segment the market structurally underserves: **universal legal duty,
no accessible drop-in tooling.**

---

## 2. ICP firmographics & qualifiers

**Strong fit when MOST of these hold:**

| Dimension | Ideal-fit value |
|---|---|
| **Media surface** | Hosts user-uploaded images/video, OR generates images/video, OR routes/stores media for others |
| **Size** | Small-to-mid: past "hobby" but below Big-Tech in-house-T&S scale (roughly seed → Series C, or any community/platform with real upload volume) |
| **T&S maturity** | No dedicated T&S engineering team; moderation is manual, volunteer, or nonexistent |
| **Regulatory exposure** | US-touching (→ §2258A/REPORT Act reporting), UK users (→ OSA), EU users (→ DSA), or AU users (→ eSafety) |
| **Incumbent access** | Can't pass PhotoDNA/NCMEC vetting, won't pay Thorn/Hive, not Cloudflare-only |
| **Tech posture** | Self-hosts or values data sovereignty / auditability / no vendor lock-in (Apache-2.0 is a *requirement*, not a nice-to-have, for this buyer) |
| **A live trigger** | Recently: funded, sued (or peer sued), warned by a payment processor, rejected by an app store, or facing a compliance deadline |

**Anti-patterns — NOT good adopters** (from the demand/competitive research):
- **Big Tech with in-house T&S** (Meta, Google, Microsoft, Snap, Discord, Reddit) — they consume the open *algorithms*, never the *product*.
- **Existing Thorn / Hive / Cloudflare customers** — already covered; switching cost > benefit unless they specifically want self-host/sovereignty.
- **Pure-Cloudflare shops** — the free CF scanner (now even credential-free) is good-enough for known-CSAM blocking and hard to dislodge.
- **No-media / no-UGC products** — B2B SaaS, internal tools, anything without an upload button or generated media has no obligation surface.
- **Bad-faith operators** (nudify/undress sites) — they will not adopt safety tooling; they are the *threat our tools detect*, not customers. (Their host platforms, app stores, and payment rails are the adopters.)

---

## 3. Why now — the demand drivers (what creates urgency)

The trigger is **live and dated**, not speculative:

| Regime | Obligation | Status / deadline | Penalty | Bites whom |
|---|---|---|---|---|
| **UK Online Safety Act** | Illegal-content + child-safety codes; **legally requires hash-matching** to detect/remove CSAM | **In force since Jul 2025**; Ofcom enforcing | Up to £18M or **10% of global revenue** | **>100,000 services** "down to the smallest community forum" (Ofcom) — *the biggest small-company forcing function* |
| **US TAKE IT DOWN Act** | Remove NCII (incl. AI deepfakes) within **48 hrs** of notice | Signed May 2025; **FTC enforcement began ~May 2026** | FTC §5 action | Explicitly drafted to reach small platforms |
| **US §2258A + REPORT Act** | Mandatory NCMEC CyberTipline reporting; evidence preservation **90 days → 1 year**; +enticement/trafficking | In force (REPORT Act May 2024) | $600K–$1M | Any US-touching ESP, any size |
| **EU DSA** | Notice-and-action, prompt CSAM removal, trusted flaggers | In force (all platforms since Feb 2024) | up to 6% of global turnover | All platforms; risk-assessment tier = VLOPs |
| **AU eSafety codes** | "Proactively detect and remove" known CSAM where feasible | Standards in force Mar 2026 | up to A$49.5M | Designated internet services |
| **EU CSA Regulation ("Chat Control")** | Detection — **mandatory detection DROPPED Nov 2025**, mid-trilogue | Not law; volatile | TBD | *Treat as optional upside, not a demand pillar* |

**Market-size signals:** NCMEC CyberTipline took **20.5M reports in 2024**;
**GenAI-involved reports rose +1,325%** (4,700 → 67,000) in one year; the UK OSA
puts **>100,000 services** in scope; the Thorn "Safety by Design for GenAI"
pledge has **11 signatories** (the model-lab who's-who). The legally-obligated
universe is enormous; the *OSS-adoptable* slice is the long tail of the obligated
who are unserved by incumbents.

**Adoption triggers, ranked by observed power:**
1. **Payment-processor cutoff / warning** (the Civitai pattern — Visa/Mastercard forced an overhaul; card processor terminated service). Highest-conviction.
2. **A lawsuit / AG action / MDL in your category** (Roblox $12.5M Nevada settlement; Discord & Roblox MDLs Dec 2025; Passes sued Mar 2025) — the *next tier* scrambles.
3. **App-store rejection/removal** — forces auditable input/output filtering to get reinstated.
4. **A funding round** — diligence → safety line item (Black Forest Labs $300M; Fal.ai $140M, both Dec 2025).
5. **A compliance deadline** — UK OSA, TAKE IT DOWN 48-hr (May 2026), EU AI Act provenance (Aug 2026).
6. **A press/research incident** — the LAION-5B "trained on CSAM" pattern forces training-data screening.

---

## 4. The competitive wedge — why adopt OSS over the incumbents

| Incumbent | Model | Access barrier | Gap we fill |
|---|---|---|---|
| **Microsoft PhotoDNA** | Free cloud | **Vetting-gated, cloud-only**, revocable, known-hash only | No self-host/sovereignty; gatekept; misses novel/AI content |
| **Thorn Safer** | Paid SaaS (~$27K–$118K/yr) | Commercial contract, sales-gated, opaque pricing | Cost; not inspectable; boutique customer base |
| **Hive AI** | Paid API (licenses Thorn hashes) | Per-call pricing, cloud | Cost; no self-host |
| **Cloudflare CSAM tool** | Free | **Cloudflare customers only** | Hard vendor lock-in; useless off-Cloudflare; no reporting/custody |
| **Meta PDQ/TMK + HMA** | Open algorithms (BSD) | **Not a product**; HMA 1.0 archived, "Open Media Match" still under construction; AWS/Terraform-heavy | No turnkey ingest→match→**report**→**custody** flow |
| **NCMEC Hash API / Arachnid Shield** | Free hashes/API | **ESP registration / request-access required** | Access friction; raw API, no surrounding tooling |
| **IFTAS CCS** (Fediverse) | Was free/hosted | **Shut down Mar 2025** (cost) | The one open option for the underserved *died* — nothing replaced it |

**The five-point wedge:**
1. **No eligibility gate / no vendor lock** — `git clone` and run today; no Microsoft vetting, no Cloudflare routing, no Thorn contract.
2. **Self-hostable / data-sovereign** — content never leaves the perimeter (matters for EU/privacy-sensitive/regulated operators).
3. **Ships NO hash list → no liability transfer** — we provide the *engine* (PDQ via hashkit) + API clients; the operator holds the credentialed NCMEC/IWF/Arachnid relationship. This is the structural reason IFTAS's hosted model died and ours doesn't.
4. **Integration glue Meta never shipped** — turns open algorithms + open hash sources into an actual ingest → match → **NCMEC report** → **evidence custody** pipeline.
5. **Coverage no single incumbent bundles** — the law is now *process- and reporting-centric* (preservation, Safety-by-Design data hygiene, DSA/OSA process evidence); incumbents are detection-centric. Our reporting (CyberTip CLI), custody (EvidenceVault), AI guards (TrainGuard/PromptShield), provenance (C2PA-Lite), and **moderator wellness (SafeMod — no competitor ships this at all)** span the whole obligation.

> **Honest framing for all outreach:** *"We're the free, Apache-2.0, self-hostable engine — you bring (or graduate into) the credentialed hash list."* Hash-*matching* the gated lists still needs the customer's own NCMEC/IWF access; we remove every *other* barrier.

---

## 5. Product → buyer fit

| Product | Primary buyer | The need it meets |
|---|---|---|
| **hashkit / hashkit-match** (Rust) | Everyone; embedders especially | Un-gated, self-hostable PDQ hashing + matching — the engine PhotoDNA gates and Meta ships only as raw algorithms |
| **CSAM-Shield** (TS/Python) | UGC platforms, AI inference/output, BaaS apps | Drop-in upload/output-pipeline middleware that orchestrates the gated detectors teams can't wire up themselves |
| **HashStream** (Go) | Self-hosted platforms, hotlines, embedders | Ingest/distribute NCMEC/IWF/Arachnid hash lists into a self-hosted matcher — the dead-IFTAS-CCS replacement; matches the INHOPE "Global Standard" exchange need |
| **CyberTip CLI** (TS/Python) | Any US-touching ESP | The legally-mandated NCMEC reporting step no free scanner does |
| **EvidenceVault** (Go) | Regulated platforms, LE/NGO tooling vendors | Chain-of-custody preservation — maps directly to the REPORT Act 1-year rule |
| **TrainGuard** (Python) | AI model labs + fine-tuning platforms | Screen training / fine-tuning datasets (the LAION-5B lesson; Safety-by-Design pledge) |
| **PromptShield** (Python) | AI generators, companion/avatar apps | Block CSAM-seeking generation prompts (input guardrail) |
| **CSAM-Shield (output mode)** | AI image/video APIs, inference hosts | Catch CSAM in *generated outputs* before serving |
| **C2PA-Lite** (Rust) | AI generators | Content provenance — now *legally required* (CA Mar 2025, EU AI Act Aug 2026); no dominant lightweight OSS C2PA signer exists |
| **SafeMod** (Rust) | Any team doing manual review, esp. volunteer-run | Moderator-wellness layer (blur-by-default, exposure caps, aggregate wellbeing) — **zero competitors offer this** |
| **detectkit-test** (Python) | Adopters + academics | Deterministic conformance fixtures to validate any binding |

---

## 6. Prioritized target tiers (named)

### Tier 1 — Warmest beachhead: self-hosted / federated (no vendor, documented vacuum)
The clearest unmet need: **IFTAS's CSAM scanner shut down Mar 2025**, leaving Fediverse/self-hosted operators with *no vendor at all* — and they self-host by ideology, so Apache-2.0 is a perfect cultural fit.
- **Fediverse operators** — large Mastodon/Bluesky/Lemmy/Matrix instances; **Bluesky Ozone** (OSS labeler, self-hostable) as an embed point; **fedi-safety / Fediseer** community tools.
- **Self-hosted forums** — Discourse/NodeBB/phpBB/Lemmy deployments with image upload + volunteer mods.
- **Lead with:** hashkit + HashStream + CyberTip CLI + SafeMod (the open IFTAS-CCS replacement).
- **Why first:** fastest adoption, OSS-native, becomes the reference customer that de-risks everything else.

### Tier 2 — Highest leverage: infrastructure & embedders (one adopter → many protected)
- **Media SaaS / upload widgets:** Cloudinary, Uploadcare, Filestack, Transloadit, Bunny, imgix, Mux — already sell *NSFW* moderation add-ons; **none offer known-CSAM hash-match** (the white space).
- **BaaS / dev tooling:** **Supabase** (OSS, self-hostable, huge storage long-tail — top dev-tooling target), Appwrite, Firebase; **Sharetribe** / Bubble (marketplace & no-code builders).
- **CPaaS:** Sendbird & GetStream already *embed Hive* (proves the bundling pattern; pitch on margin — zero per-scan cost), Agora ($1.50/1k — undercut), Twilio (underinvested gap).
- **Lead with:** hashkit-match (cdylib, embeddable) + CSAM-Shield + CyberTip CLI. Pitch: *"Offer Cloudflare-grade CSAM scanning without being Cloudflare."*

### Tier 3 — Urgent triggers, budget exists: media-heavy UGC
- **Creator/fan platforms:** Passes (sued Mar 2025), Fansly, Patreon, Fanvue, OF-clones.
- **Dating apps:** Grindr (NCMEC-credited 2026), Bumble, Feeld, niche apps (UK OSA deadline-driven).
- **Mid-tier gaming/UGC:** indie game platforms, modding communities, virtual worlds watching the Roblox/Discord MDLs.
- **File-sharing/hosting:** mid-tier cloud-storage, transfer/paste sites (Ofcom launched a dedicated file-sharing enforcement programme Mar 2025).
- **Lead with:** CSAM-Shield + CyberTip CLI, emphasizing *known-hash-isn't-enough* (self-generated content is 90%+ of removed CSAM; perceptual + classifier orchestration).

### Tier 4 — Highest-pressure AI generation
- **Model hubs:** **Civitai** (warmest — payment-processor casualty, OSS-friendly, already buying point moderation) and **Hugging Face**.
- **Inference/serving:** **Fal.ai** ($4.5B val), **Replicate**, **Together**, **RunPod**, **Modal** — generative-media at scale; CSAM-Shield as inline middleware is a native fit.
- **Open-weight labs without a moderation org:** **Black Forest Labs** (FLUX — most-downloaded HF model, freshly funded, *not* a pledge signatory), Mistral, Invoke, Metaphysic.
- **Companion/avatar apps:** Character.AI, Replika (legally motivated, well-resourced, reputationally cautious).
- **Lead with:** TrainGuard (datasets) + PromptShield (input) + CSAM-Shield (output) + C2PA-Lite (provenance).

### Tier 5 — Mission-aligned non-commercial (reach + credibility)
- **INHOPE network** — 54 hotlines/50 countries; building an interoperable "Global Standard" hash set; **HashStream** is nearly a spec-match; smaller national hotlines need EvidenceVault + hashkit.
- **Academic/research** — open PDQ/TMK + frozen conformance vectors = citable artifacts (hashkit, detectkit-test).
- **Government / LE-adjacent tooling vendors** — EvidenceVault chain-of-custody + CyberTip CLI.

---

## 7. Monetization read (the commercial subset)

Open-source benchmark: ~74% of orgs using OSS are willing to pay for security,
maintenance, and compliance. The free tier will dominate adoption; revenue comes
from **removing operational and legal risk**, not from the bits. Ranked by likelihood:

1. **Compliance attestation / audit-ready evidence packs** — strongest wedge. A small platform facing the FTC or Ofcom wants a *defensible record* of "reasonable steps," with controls mapped to TAKE IT DOWN / OSA / §2258A. Risk-transfer commands real money.
2. **Managed / hosted version** — SMBs prefer OpEx-as-a-service over self-operating legally-radioactive CSAM infra; hosted matching + report routing + custody storage. (This is where Thorn/Hive already extract money → proven willingness-to-pay.)
3. **Integration / onboarding services** — getting NCMEC ESP credentials + Arachnid access + wiring the pipeline is non-trivial; paid setup + SLA.
4. **Support contracts** — false-positive tuning, hash-list freshness SLAs, uptime — for platforms where a miss is a six-figure penalty.

**One-line commercial wedge:** *"Apache-2.0 and free to run yourself; pay us to host it, keep it compliant, and hand you the audit trail when the regulator calls."*

---

## 8. The single best first moves

1. **Land the Fediverse reference adopter** (Tier 1) — fastest yes, fills the IFTAS vacuum, de-risks the rest.
2. **Sign one infrastructure embedder** (Tier 2 — Supabase template or a media-SaaS add-on) — one integration protects a long tail of downstream platforms.
3. **Convert one acute-trigger AI/UGC name** (Civitai, or a freshly-funded inference host) into a design partner — turns a high-pressure incident into a public proof point.
4. **Position SafeMod everywhere** — it has *no competitor* and opens doors with any team doing manual review.

---

*Sources: NCMEC CyberTipline data; IWF 2024–2025 reports; Stanford Internet
Observatory (LAION-5B; CyberTipline-data caveats); Thorn / All Tech Is Human
Safety by Design pledge; Ofcom OSA guidance; FTC TAKE IT DOWN enforcement;
Cornell §2258A; EU DSA; IFTAS shutdown post-mortem; Prostasia CSAM-filtering
comparison; Cloudflare CSAM-tool updates; Microsoft PhotoDNA terms; Thorn Safer /
Hive pricing; named funding/litigation reporting (TechCrunch, 404 Media, Sacra,
court filings), 2024–2026. Full inline citations in the research appendix
(docs/gtm/research-appendix-2026-06.md, to follow if needed). Figures are
directional where drawn from secondary summaries; verify against primary sources
before external/fundraising use.*

Last compiled: 2026-06.
