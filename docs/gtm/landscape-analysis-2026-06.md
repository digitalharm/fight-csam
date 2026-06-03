# awesome-safety-tools landscape analysis — vs the digitalharm-oss / FightSAM portfolio

**Source:** roostorg/awesome-safety-tools (14 categories, ~90 projects; fetched 2026-06, saved /tmp/awesome-safety-tools.md).
**Method:** read-only fan-out workflow (5 analysts deep-diving real repos → chair synthesis). 79 projects profiled, 37 candidate gaps.
**Subject:** our 11 OSS tools (hashkit, hashkit-match, detectkit-test, csam-shield, promptshield, hashstream, trainguard, cybertip-cli, evidencevault, c2pa-lite, safemod) — packages keep the digitalharm naming; FightSAM is the developer-site brand.
**Status:** research/planning. No code changed.

---

I now have a complete picture of the existing plan: the "20-person platform" framing (recently reframed to "any platform"), the 5-wave structure, the credential/counsel gates, and the defense-in-depth thesis. I have everything needed to write the definitive analysis. Let me synthesize.

I have enough context. Producing the definitive analysis now.

---

## Executive summary

The roostorg/awesome-safety-tools landscape is wide but lopsided: it is rich in **algorithms** (Meta PDQ/TMK/vPDQ, Thorn Perception), **open-weight classifiers** (Llama Guard, ShieldGemma, Granite Guardian, CoPE, gpt-oss-safeguard, Roblox Sentinel), and **general-purpose decisioning/orchestration** (ROOST Osprey/Coop, Guardrails AI, OpenGuardrails, Meta HMA), but conspicuously thin in two places FightSAM occupies: an **un-gated, self-hostable CSAM detection path that runs without PhotoDNA vetting or NCMEC/GIFCT exchange credentials**, and **statutory reporting + tamper-evident evidence preservation** (the only other NCMEC filing client, ello, is dead and unlicensed; HMA and MediaModeration stop at "notify a human"). That is our genuine, defensible wedge — reinforced by the March 2025 IFTAS/FediCheck/CCS shutdowns, which proved centralized hosted CSAM services are economically fragile and left a live Fediverse vacuum that maps exactly to our zero-per-seat thesis. We are **redundant and behind** on three axes we should stop pretending to lead: raw perceptual hashing (Meta is upstream of hashkit and is the conformance source), end-to-end copy-detection-as-a-service (HMA out-features csam-shield+hashstream for any platform that *can* get exchange access), and ML classification of any kind (we ship zero models while the field ships dozens). The single biggest strategic choice: **we are an engine vendor, not a platform vendor** — so the answer to "one mega-tool vs. guided path" is neither a monolith nor 11 loose libraries, but a thin **opinionated installer/meta-CLI that scaffolds a golden-path pipeline wiring our CSAM-specific engines (hashkit, csam-shield, cybertip-cli, evidencevault) into the best-in-class externals we should *not* rebuild (Osprey for rules, Presidio for PII, a Llama-Guard/CoPE-class model for text, Ozone/Automod for Bluesky).** Build the CSAM-and-reporting core deep; wrap everything else.

---

## The landscape, categorized

Collapsing the 14 list-categories into nine functional buckets, with the best-in-class pick and why:

| Function | Best-in-class pick | Why it wins | Our relationship |
|---|---|---|---|
| **Perceptual hashing (algorithm)** | **Meta PDQ / TMK+PDQF / vPDQ** (BSD-3) | The canonical implementations *and* the conformance source; built-in quality metric; documented MIH index design. | They are upstream of hashkit. We re-port. |
| **Multi-hash library + dedup** | **Thorn Perception** (Apache-2.0, v0.9.1 May 2026) | 8 algorithms behind one API + robustness benchmarking + FAISS/clique dedup. More featureful than hashkit+hashkit-match for Python shops. | Direct competitor to our hashing pair. |
| **End-to-end copy-detection service** | **Meta HMA / Open Media Match** (BSD-3) | Hasher→Matcher→Actioner + declarative ActionRule + Banks/Exchanges (NCMEC/GIFCT/StopNCII). Proven; third-party Helm chart + hma-matrix prove demand. | Head-to-head with csam-shield+hashstream combined. |
| **Hash-list exchange / distribution** | **python-threatexchange `SignalExchangeAPI`** (BSD-3) | Pluggable fetchers (NCMEC/StopNCII/TCAP), checkpointed resumable fetch, auto-index rebuild. The real bar for hashstream. | Direct competitor to hashstream's core. |
| **Novel/unseen CSAM + image/text classifiers** | **Google Content Safety API** (novel CSAM, gated/closed); **IBM Granite Guardian** (best-licensed open guard, Apache-2.0); **ShieldGemma 2** (image); **CoPE-A-9B / gpt-oss-safeguard** (policy + reasoning traces); **Roblox Sentinel** (grooming/behavioral, Apache-2.0) | Granite is Apache-2.0 + active + adds RAG/agentic detection; Sentinel is a genuinely novel cross-message grooming detector credited with 1,000+ NCMEC reports. | **Pure gap.** We ship no model of any kind. |
| **Rules / decisioning engine** | **ROOST Osprey** (Apache-2.0; Bluesky/Discord/Matrix in prod) + **Bluesky Automod/hepa** (Go, AT-Proto) | Production-adopted T&S decisioning hub with SML rules, entity labeling, investigation UI. | Complement + integration target. We have nothing here. |
| **Orchestration / detector-plumbing framework** | **Guardrails AI** (Hub of swappable validators) + **OpenGuardrails** (proxy+model) + **ROOST Coop** (neutral signal bus) | The pluggable-validator-registry pattern is the architectural lesson csam-shield must absorb. | Architectural competitors to csam-shield's thesis. |
| **Red-team / eval harness** | **Garak** (Apache-2.0, breadth) + **PyRIT** (MIT, multi-turn) + **Promptfoo** (MIT, DX + OWASP/NIST) | Purpose-built to break exactly the kind of guard promptshield is. CSAM-intent probes are deliberately absent everywhere. | Complement; exposes that we ship a guard with no adversarial test suite. |
| **Reviewer surface + wellness + case mgmt + PII** | **Ozone** (AT-Proto review console, MIT/Apache); **Meta Content Review Filters** (Apache-2.0 reviewer wellness React kit); **Marble** (Elastic Lic, best case-manager); **Microsoft Presidio** (MIT, PII) | Ozone is the AT-Proto front-end seam; Content Review Filters is a richer safemod render layer we can adopt; Presidio is uncontested for PII. | Complements; case-management is our biggest *non-CSAM* hole. |
| **Reporting + evidence (statutory)** | **(no live winner)** — ello/ncmec_reporting documents the real flow but is dead + unlicensed | Nobody maintains an open CyberTipline filer; HMA/MediaModeration stop at "notify." | **Our genuine whitespace** — cybertip-cli + evidencevault. |

The rest of the list is **infrastructure to depend on, not rebuild** (BullMQ, RabbitMQ, Druid, scikit-learn), **adjacent-domain** (Detoxify/Perspective toxicity, fraud/AML Marble, OSINT Owlculus), or **out-of-scope disinformation/influence-ops** (CIB Mango Tree, Crossover, OpenMeasures, TikTok Observatory, Interference, DAU) — a deliberate boundary, not a gap.

---

## Overlap matrix — their tools vs our 11

| Our tool | Strongest overlapping project(s) | Verdict | Action |
|---|---|---|---|
| **hashkit** (PDQ + TMK+PDQF) | Meta PDQ/TMK (BSD-3); Thorn Perception (Apache-2.0) | **They-lead** — Meta is the conformance source and upstream; Perception out-features us on breadth. | **Differentiate narrowly** (Rust/WASM + NCMEC conformance vectors) and **adopt**: PDQ's quality-metric gating (discard quality≤49); Perception's benchmarking harness. Don't claim algorithm superiority. |
| **hashkit-match** (MIH Hamming) | Meta PDQ MIH README (the blueprint we built); Perception FAISS+clique dedup | **At-parity / they-lead on dedup** — our index *is* their design; Perception's clique dedup beats us at corpus-wide near-dup clustering. | **Adopt**: an Adobe-Lattice-Extract-style FP-guard companion; corpus dedup/clustering (lean on scikit-learn/FAISS). |
| **detectkit-test** (synthetic fixtures) | NVIDIA Aegis 2.0 (CC-BY-4.0, has "Sexual (minor)"); Jigsaw Toxicity (CC0); Tattle/Uli methodology | **We-lead** (nobody else ships engineered-property synthetic CSAM-safe fixtures) | **Differentiate + enrich**: publish license-clean benchmark slices; adopt Uli's expert/per-annotator methodology for any CSAM-intent eval set. |
| **csam-shield** (detector orchestration) | Meta HMA (BSD-3); Guardrails AI Hub; OpenGuardrails; ROOST Coop; Feluda operators | **They-lead** as a complete service (HMA); **at-parity** on the orchestration idea. | **Adopt HMA's declarative ActionRule model + Guardrails-Hub pluggable-detector registry + Feluda's swappable cheap-hash-vs-ML operator pattern; integrate** by emitting a Coop-compatible signal. Keep CSAM-specificity + reporting handoff as the wedge. |
| **promptshield** (CSAM-intent prompt gate) | CoPE-A-9B; gpt-oss-safeguard; Llama Prompt Guard 2; ShieldGemma 2; Garak/PyRIT/Promptfoo; NVIDIA Aegis | **They-lead** on classification; **we-lead** on CSAM-specificity. | **Adopt** policy+reasoning-trace output (gpt-oss-safeguard) and Aegis "Sexual (minor)" training data; **wrap** Prompt Guard 2 for injection/jailbreak; **build** a CSAM-intent red-team pack for Garak/PyRIT/Promptfoo. |
| **hashstream** (ingest/version/distribute lists) | python-threatexchange `SignalExchangeAPI` (BSD-3); FIRES (AGPL, Fediverse) | **They-lead** today (more live exchanges, resumable checkpoints). | **Integrate (wrap, don't fight)**: implement a hashstream `SignalExchangeAPI` plugin so the pytx installed base points at our endpoint; **differentiate** with first-class versioning/diffing + **Project Arachnid/C3P** (pytx lacks it) + a FIRES-compatible output adapter. |
| **trainguard** (dataset screening) | python-threatexchange (fetch/match loop); Presidio (PII) | **At-parity on hashing; they-lead on adjacent PII.** | **Integrate Presidio** as a "is this dataset safe to train on" PII bolt-on; **differentiate** with chain-of-custody compliance report. |
| **cybertip-cli** (NCMEC filing) | ello/ncmec_reporting (dead, unlicensed) | **We-lead** (maintained, multi-language, also *generates* reports; honors counsel gate). | **Adopt lessons** (not code): ello's real open→upload+metadata→finish→retract lifecycle and 90-day-media/indefinite-metadata retention model as the spec for the post-counsel production path. |
| **evidencevault** (chain-of-custody) | Marble (immutable audit trail, Elastic Lic); Owlculus (case UI, GPL-3); ello (S3 quarantine) | **We-lead on tamper-evidence; they-lead on review/case UI.** | **Differentiate** (legal-tier custody is unique); **gap**: no searchable audit-log UI / case surface — license-incompatible to vendor, so this is a *build* signal. |
| **c2pa-lite** (provenance) | (no direct competitor in this list; C2PA/c2pa-rs upstream) | **Complementary / we-lead in this corpus.** | **Differentiate** as the prevention-side primitive; keep delegating real signing to c2pa-rs. |
| **safemod** (moderator wellness) | Meta Content Review Filters (Apache-2.0); OSmod; DAU; SquadBox (concept) | **They-lead on front-end; we-lead on policy guarantees** (server-enforced caps + k-anon telemetry). | **Adopt** Content Review Filters as safemod's React render layer; keep our Rust exposure-cap + k-anon engine as the differentiator. Ship an **Ozone reviewer-pane skin**. |

---

## Best features worth adopting into our tools

Concrete, per-tool:

- **hashkit** — (1) Surface and act on PDQ's **built-in quality metric** (discard quality≤49) so junk/featureless images are filtered before matching. (2) Port **Thorn Perception's robustness-benchmarking harness** so a platform can *choose* thresholds/algorithms rather than trust defaults. (3) Add **vPDQ** as a third algorithm (Meta's clip/subsequence primitive) — it's the more useful video primitive than whole-video TMK for real abuse-clip reuse.
- **hashkit-match** — (1) An **Adobe-Lattice-Extract-style FP-guard** companion crate (grid/collage/sticker-sheet detection) to suppress spurious perceptual-hash collisions; FP cost is severe in CSAM. (2) **Corpus dedup/clustering** (FAISS NN + clique/community detection, Perception-style) for the "find all near-dupes in a library" job our pairwise matcher can't do. (3) **Variable-length match support** to accommodate vPDQ's bag-of-frames.
- **csam-shield** — (1) **HMA's declarative ActionRule model** (Match→Actions) replacing fixed "drop-in detector orchestration." (2) A **Guardrails-Hub-style pluggable detector registry** so operators swap PhotoDNA/PDQ/Content-Safety-API/ShieldGemma/CoPE without code changes; (3) **Feluda's operator pattern** (same pipeline, cheap-hash vs expensive-ML chosen by budget/privacy/perf). (4) A **Coop-compatible signal output** so verdicts flow natively into Osprey. (5) MediaModeration's **persisted scan-state ledger** + human-review-before-action posture. (6) OpenGuardrails' **mask-and-restore + audit-log**.
- **promptshield** — (1) **Explainable, policy-referenced verdicts with a reasoning trace** (gpt-oss-safeguard/CoPE), not a bare boolean — critical since our legal-tier tools live on defensibility. (2) Train/eval against **NVIDIA Aegis 2.0's "Sexual (minor)" subset** (CC-BY-4.0) + its synthetic refusals; map docs to **OWASP-LLM-Top-10**. (3) **Wrap** Llama Prompt Guard 2 (injection/jailbreak) and recommend **ShieldGemma 2** for output-image screening — promptshield blocks the prompt, ShieldGemma screens the resulting image.
- **hashstream** — (1) A **`SignalExchangeAPI` plugin** so pytx users adopt us without migrating. (2) **Signed snapshots** (already a Beta blocker — keep it). (3) A **FIRES-compatible advisory feed** output adapter so Fediverse admins consume CSAM-hash transport through the client they already use. (4) Own **Project Arachnid/C3P** ingestion (pytx doesn't ship it).
- **trainguard** — **Bolt on Presidio** for PII scrubbing of training sets; keep the chain-of-custody compliance report as the differentiator.
- **cybertip-cli** — Treat **ello's gem as the protocol/retention reference**: implement the full open→upload+per-file-metadata→finish/retract lifecycle and NCMEC's 90-day-media/indefinite-metadata retention semantics once counsel clears the production path. Borrow its **S3-quarantine-of-evidence** idea (overlaps evidencevault).
- **evidencevault** — Marble's **searchable immutable audit trail** as a first-class queryable feature; ello's **retention-timer/quarantine** model. Pair custody primitives with an admin-facing audit UI.
- **c2pa-lite** — Use **provenance/refusal datasets** and keep the watermark layer deferred until a robust scheme stabilizes; this is the cheapest *prevention* primitive for gen-AI.
- **safemod** — **Adopt Meta's Content Review Filters** (Apache-2.0) as the React render layer (multi-mode blur/grayscale/sepia/WebGL reduced-detail, warning interstitials, video controls); ship an **Ozone reviewer-pane integration**.
- **Cross-cutting (Osprey/Coop)** — Ship a **first-class ROOST Osprey adapter + Coop signal schema** so every detector verdict (csam-shield, hashkit-match, hashstream, promptshield) becomes an Osprey signal/UDF. Position FightSAM as "the CSAM engines that feed your Osprey," not as a rules engine.

---

## Gaps — tools we're missing

Candidate **new** tools the landscape implies, prioritized by **reach × help for our ICP** (small/mid platforms + AI startups + Fediverse):

**Tier 1 — highest reach × help (build/ship next):**
1. **A Bluesky/AT-Proto integration adapter** (Automod/hepa Go blob rule + Ozone label/report emitter). The single highest-leverage adoption wedge in the entire landscape: hepa hands rules raw media bytes (`func(c, blob, data []byte)`) with effect `c.AddRecordFlag()` but ships **zero** perceptual-hash hook (blobs.go checks only size/MIME). A ~150-line drop-in rule wrapping hashkit + hashkit-match against a hashstream-served list turns *every self-hosted hepa into a CSAM matcher*. Pair with a `csam-shield → Ozone` adapter and a safemod skin for Ozone's full-res reviewer pane. **This de-risks the #1 ICP (Fediverse) and is small.**
2. **A declarative actioner/rules integration** — not a rules engine of our own (Osprey owns that), but the **Osprey/Coop adapter** above, packaged as a shippable connector so a FightSAM platform has something wiring verdicts→actions on day one. Today we ship detection with no path to action.
3. **A CSAM-intent red-team pack** (plugins for Garak/PyRIT/Promptfoo) that adversarially tests promptshield + the csam-shield prompt path. We ship a guard with no adversarial suite; the generalist harnesses **deliberately omit CSAM specifics**, so our NCMEC-verified, counsel-aware credibility lets us responsibly author the probes nobody else will — a defensible upstream-contribution wedge.

**Tier 2 — high help, narrower or heavier:**
4. **An open-weight ML classifier path** — the portfolio's single biggest *capability* whitespace. Two sub-paths: (a) **wrap** Granite Guardian / CoPE / ShieldGemma 2 as csam-shield detector backends (cheap, immediate); (b) the ambitious play — a **self-hostable novel-CSAM image classifier**, which would be *unique in OSS* (Google's is gated/closed). Hashing structurally cannot catch new material; this is the gap buyers will probe first.
5. **A video / clip path** — vPDQ-style subsequence matching (Tier 1 within hashkit) plus, longer-term, the live A/V modality (Frankly, Roblox Voice) we don't touch at all.
6. **A behavioral/grooming detector** modeled on Roblox Sentinel (Apache-2.0, cross-message contrastive signals, feeds NCMEC) — the highest-fit *brand-new* tool for our CSAM-centric line, on a fundamentally different axis (conduct, not artifacts) from everything we ship.

**Tier 3 — real gaps, lower ICP urgency or defensibly out-of-scope:**
7. **An Apache-2.0 case-management / triage console over evidencevault** (Marble/Owlculus show the surface; both license-incompatible to vendor → build). 
8. **A PII bolt-on** (wrap Presidio — don't build). 
9. **A domain-reputation/defederation denylist sync** to fill the FediCheck vacuum. 
10. **Explicitly out-of-scope** (state a position, don't build): general toxicity/harassment, LLM-traffic security gateway, RAG/agentic tool-call safety, disinformation/influence-ops, end-user self-protection extensions, multilingual coverage (note as a known limitation).

---

## The super-solution decision

**The user's question — one monorepo/meta-tool that does everything vs. a guided implementation path — has a clear answer: neither extreme. Build a thin, opinionated meta-CLI/installer that scaffolds a golden-path pipeline, wiring our deep CSAM-and-reporting engines into best-in-class externals we wrap rather than rebuild.**

**Why not a monolith ("FightSAM does everything").** It loses on every axis that matters. (1) It contradicts our own positioning: we are the *un-gated, self-hostable engine + plumbing*, and a mega-app re-introduces the "assemble or adopt a heavy thing" friction we sell against — it would become a worse HMA. (2) "Self-hostable" is already **table stakes** in this landscape (Garak, PyRIT, Presidio, Granite, Guardrails are all permissive + self-hostable); a monolith competes on completeness, exactly where HMA, Osprey, and the open-weight guards out-resource a solo/small maintainer. (3) It forces us to rebuild things the field does better (rules → Osprey, PII → Presidio, classifiers → Granite/Sentinel, reviewer UI → Ozone/Content Review Filters), diluting the two areas where we genuinely lead (un-gated CSAM detection, statutory report+preserve). (4) The March 2025 IFTAS/CCS shutdown is the cautionary tale: the *centralized, staffed, do-everything* CSAM service is the thing that dies.

**Why not bare libraries + a doc.** 11 loose packages with a "wire it yourself" guide is what we have, and the landscape shows the winners ship *opinionated integration*: hma-matrix's Synapse connector, RocketChat CSAM's app, Guardrails' Hub, Promptfoo's DX. Our overview already concedes the core value prop is letting a small platform "actually wire that defense up under §2258A without a multi-week per-provider integration." A pile of libraries doesn't deliver that; an opinionated scaffold does.

**Recommended form: `fightsam init` — a meta-CLI/installer that scaffolds a compliant, opinionated pipeline.** It generates a working "golden path" deployment (Docker-compose + config + adapters) for a small platform or AI startup to reach **OSA / TAKE-IT-DOWN / §2258A** posture, wiring:

| Layer | What we BUILD (own deep) | What we WRAP (don't rebuild) |
|---|---|---|
| Ingest/queue | — | BullMQ or RabbitMQ |
| Hashing | hashkit (PDQ/TMK/+vPDQ), hashkit-match (+FP-guard) | Optionally Meta PDQ reference for conformance cross-check |
| List transport | hashstream (+versioning, +Arachnid, +SignalExchangeAPI plugin) | NCMEC/IWF/Arachnid feeds (credential-gated — honored) |
| Detection orchestration | csam-shield (ActionRule + plugin registry) | PhotoDNA / Cloudflare / Content Safety API / ShieldGemma / Granite as swappable detectors |
| Prompt/gen-AI safety | promptshield (CSAM-intent, +reasoning trace) | Llama Prompt Guard 2 (injection), ShieldGemma 2 (output image) |
| Text/general harm | — (out of scope; BYO seam) | Granite / Llama Guard / Detoxify (documented) |
| Decisioning/rules | **Osprey/Coop adapter** (we ship the connector) | ROOST Osprey (rules), Coop (signal bus) |
| Review surface | safemod (caps + k-anon) + Ozone skin | Ozone, Meta Content Review Filters |
| PII | — (wrap, don't build) | Microsoft Presidio |
| Reporting | cybertip-cli (counsel-gated production) | NCMEC CyberTipline (sandbox now) |
| Evidence | evidencevault (tamper-evident custody) | KMS for encryption |
| Red-team/validation | **CSAM-intent probe pack** | Garak / PyRIT / Promptfoo |

The CLI ships **profiles** for our ICP segments — `--profile bluesky` (wires the hepa blob rule + Ozone), `--profile ai-startup` (promptshield + ShieldGemma + c2pa-lite), `--profile small-platform` (csam-shield + hashstream + cybertip-cli + evidencevault) — each producing a runnable scaffold with the credential/counsel gates clearly stubbed and documented, never silently bypassed. **We build the CSAM detection + report + preserve core and the *glue/scaffold*; we wrap rules, PII, text-classification, reviewer UI, queues, and red-team harnesses.** This keeps us un-gated and self-hostable, leans on the ecosystem's strengths instead of fighting them, and is the realistic surface a small team can actually maintain.

---

## Recommended roadmap deltas (to v2)

Against the current state (all 11 tools "In Progress," cores still `todo!()`, gated on NCMEC ESP + counsel; 5-wave sequencing):

**ADD (new line items):**
- **A new "Wave 6: Integration & Adoption" line** — the meta-CLI `fightsam init` (golden-path scaffold) + the **Bluesky/AT-Proto adapter** (hepa blob rule + Ozone emitter + safemod Ozone skin). The hepa rule is small, credential-free for the *code* (lists stay gated), and directly de-risks the #1 ICP. **This is the highest-ROI addition and should not wait behind Wave 3 credentialing.**
- **A `SignalExchangeAPI` plugin + Coop/Osprey adapter** under hashstream/csam-shield respectively — reframes us as "engines that feed Osprey" and prevents being bypassed as the ecosystem standardizes on Coop+Osprey.
- **A CSAM-intent red-team pack** (Garak/PyRIT/Promptfoo plugins) as a promptshield deliverable — closes the "guard with no adversarial suite" gap and is an upstream-contribution credibility play.
- **vPDQ** to hashkit's Alpha scope and an **FP-guard companion** to hashkit-match's scope.
- **Presidio integration** as a trainguard (and safemod-text) bolt-on; **Content Review Filters** adoption as safemod's render layer.

**RE-PRIORITIZE:**
- **Pull csam-shield's architecture rework forward**: refactor from "fixed detector orchestration" to **ActionRule + pluggable registry + operator pattern** *before* wiring more detectors — otherwise we hard-code a model HMA already proved is the wrong shape.
- **Elevate promptshield's eval set**: the roadmap already flags "a model is not a defense." Anchor Stage 2 to **NVIDIA Aegis 2.0 (CC-BY-4.0)** training/eval + Uli's annotation methodology, and ship reasoning-trace output. This unblocks the 90%-recall Alpha bar with a license-clean corpus.
- **hashkit Alpha**: add PDQ quality-gating and a Perception-style benchmark as explicit acceptance criteria (currently only conformance-vector parity is specified).

**CUT / EXPLICITLY SCOPE OUT (state the position so buyers stop asking):**
- Do **not** build a rules engine, a PII engine, a general toxicity classifier, an LLM-traffic gateway, a case-management platform from scratch, or any disinformation/influence-ops tooling. Document each as "wrap X / out of scope" in the overview's "What this is not."
- **Drop any implicit claim of raw-hashing superiority.** Reposition hashkit's differentiation honestly to Rust/WASM footprint + NCMEC conformance vectors + integration coherence — Meta is upstream and the conformance source.

**Sequencing/gate notes (unchanged constraints honored):** we still ship **no hash lists**; the meta-CLI stubs every credential/counsel gate visibly (NCMEC ESP for Wave 3+, outside counsel for cybertip-cli/evidencevault production paths) rather than bypassing them; the Wave 5 watermark layer of c2pa-lite stays deferred until a robust scheme stabilizes. The net shift: **less effort on deepening every detector, more on the integration/adoption surface (meta-CLI + Bluesky adapter + Osprey/Coop) that converts our engines into something an ICP platform actually deploys.**

---

Relevant files reviewed: `/Users/colin/Code/digitalharm-oss/docs/roadmap.md` (current 11-tool status — all "In Progress," cores `todo!()`, gated on NCMEC ESP + counsel), `/Users/colin/Code/digitalharm-oss/docs/sequencing.md` (5-wave rationale), `/Users/colin/Code/digitalharm-oss/docs/overview.md` (defense-in-depth thesis + "what this is not" scope boundaries).