# Adoption Strategy — getting people to use digitalharm-oss

**The question:** what's the best path to getting people to actually *use* the 11
OSS tools, and who is the Ideal Customer Profile?

**The short answer:**
1. **Your ICP instinct is right but needs sharpening** — "developers + AI startups"
   is two of three core personas; the third (self-hosted/Fediverse + small-platform
   T&S engineers) is the *warmest* near-term adopter. See §1.
2. **There is a hard blocker in front of every adoption tactic: nothing is
   published.** All 11 packages are `v0.0.1` and live only in this git repo — not on
   crates.io, PyPI, npm, or tagged for `go get`. **A developer cannot install them
   today.** Fixing that is step zero. See §2.
3. **The best path, once installable, is a specific sequence** anchored on a
   discovery that changes the whole plan — **ROOST**, a $27M open-source Trust &
   Safety org (Google/OpenAI/Discord/Roblox/Mozilla, launched Feb 2025) whose
   explicit first focus is CSAM and whose `awesome-safety-tools` directory is where
   T&S engineers look for exactly these tools. See §3–§5.

This doc is the *path*; the companion `ideal-customer-profile.md` is the *who*
(named targets, firmographics, competitive wedge, monetization).

---

## 1. The ICP — confirming & sharpening "developers, AI startups"

Your assumption is directionally correct. Refined into the **three personas who
actually adopt**, in priority order for *near-term traction*:

### Persona A — The self-hosted / small-platform T&S engineer  *(warmest)*
The lone engineer (or volunteer admin) at a Fediverse instance, forum, dating app,
creator platform, or mid-size UGC site who was swept into the **2024–2026
regulatory wave** (see §1.1) and has **no vendor and no budget**. The org that
served them — **IFTAS** — ran out of money and shut its Fediverse CSAM scanner in
March 2025,
leaving a documented vacuum (their 2024 needs assessment: 183 services, 4.3M
accounts, CSAM detection ranked their #1 need). They self-host by ideology, so
Apache-2.0 + self-hostable is a *requirement*, not a preference. **This is the
fastest first "yes" and the best source of nameable reference adopters.**

### Persona B — The AI-startup engineer  *(your instinct — high-pressure)*
A backend/ML engineer at an image/video-generation company, model hub, inference
host, or companion app. Exposed by the TAKE IT DOWN Act (AI deepfakes, 48-hr
removal), the LAION-5B "trained on CSAM" precedent, and the Thorn/All-Tech-Is-Human
Safety-by-Design pledge (which 11 major labs signed — a public commitment smaller
AI startups are now measured against). Triggered by funding rounds, payment-processor
warnings (the Civitai pattern), and app-store removals. Needs TrainGuard /
PromptShield / CSAM-Shield / C2PA-Lite.

### Persona C — The infrastructure / embedder engineer  *(highest leverage)*
A platform engineer at a media-SaaS (Cloudinary, Uploadcare), BaaS (Supabase),
or CPaaS (Sendbird, GetStream) who could embed our matching engine as a feature
their *own* customers consume. One adopter → many downstream platforms protected.
Slower to land, but each win is a force-multiplier. Needs hashkit-match (cdylib).

> **The unifying ICP in one line:** a developer or T&S engineer at a
> **small-to-mid platform or AI startup that was newly obligated to detect/report
> CSAM by the 2024–2026 regulatory wave (§1.1) but is locked out of the
> incumbents** (PhotoDNA is vetting-gated, Thorn/Hive are paid), who will adopt a
> self-hostable, no-gate, no-per-scan-fee, Apache-2.0 toolkit today.

**Who is NOT the ICP** (don't spend effort here): Big Tech with in-house T&S
(they consume the open *algorithms*, never the product); existing Thorn/Hive/
Cloudflare customers; no-media products; and bad-faith operators (they're the
threat our tools detect, not adopters).

### 1.1 Why now — the 2024–2026 regulatory wave

"Newly obligated" is not one event; it's a **cluster of overlapping laws that all
took effect within ~24 months**, which is what turned CSAM detection/reporting
from voluntary best-practice into a legal duty for small and mid-size platforms.
In rough order of how hard each one bites *our* ICP:

| Law | What changed | In force | Why it bites the ICP |
|---|---|---|---|
| **UK Online Safety Act** | Illegal-content + child-safety codes; **legally requires hash-matching** to detect CSAM | Duties enforceable from **Mar 2025**; children's risk assessments due **Jul 2025** | Ofcom scopes **100,000+ services — explicitly "down to the smallest community forum"**; penalty up to **£18M or 10% of global revenue**. The single biggest forcing function for small platforms. |
| **EU Digital Services Act** | Notice-and-action, prompt CSAM removal for *all* platforms | Fully applicable **17 Feb 2024** | Reaches every platform serving EU users; fines up to **6% of global turnover**. |
| **US REPORT Act** | Expanded mandatory NCMEC reporting (adds enticement + trafficking); evidence preservation **90 days → 1 year**; "becomes aware" standard | Signed **7 May 2024** | Sharpens §2258A and scales penalties ($600K–$1M) to hit **sub-100M-MAU** providers. |
| **US TAKE IT DOWN Act** | 48-hour notice-and-removal of non-consensual intimate imagery incl. AI deepfakes | Signed **19 May 2025**; **FTC enforcement began ~May 2026** | The "remove known identical copies" duty is literally a hash-matching problem — our product. Drafted to reach small platforms. |
| **AU Online Safety Act / eSafety** | "Proactively detect and remove" known CSAM; under-16 social-media rule | Age rule live **Dec 2025**; CSAM standards **Mar 2026** | Civil penalties up to **A$49.5M**. |
| **US 18 U.S.C. §2258A** | Report apparent CSAM to NCMEC on awareness *(standing law, not new)* | Long-standing | The baseline duty the REPORT Act tightened — applies to any US-touching ESP, any size. |

**The one-line version:** *no single trigger — a wall of laws (UK OSA, EU DSA,
US REPORT + TAKE IT DOWN Acts, AU eSafety) landed 2024–2026, and the UK Online
Safety Act coming into force in 2025 is the one that most directly made detection
legally mandatory for the small/mid platforms that are our ICP.* (Full
status/penalty detail and primary sources live in `ideal-customer-profile.md §3`.)

---

## 2. STEP ZERO — the blocker that gates everything

Audited 2026-06 (node-verified against every manifest): **none of the 11 packages
are published.** Every one is `version 0.0.1`, present only in this repository.

| Ecosystem | Packages | Published? | What a dev would run |
|---|---|---|---|
| crates.io | hashkit, hashkit-match, c2pa-lite, safemod | ❌ no | `cargo add hashkit` → **fails** |
| PyPI | detectkit-test, promptshield, trainguard, csam-shield, cybertip-cli | ❌ no | `pip install csam-shield` → **fails** |
| npm | @digitalharm/csam-shield, /cybertip-cli, /hashstream-sdk | ❌ no (not private, just unpublished) | `npm i @digitalharm/csam-shield` → **fails** |
| Go | hashstream, evidencevault | ⚠️ `go get`-able by repo path, but no version tag / not on pkg.go.dev | works only if you know the path |

**Implication:** every downstream tactic — registry discovery, READMEs, HN launch,
ROOST listing — assumes a developer can `install` and run in 60 seconds. Right now
they can't. **This is the single highest-leverage thing to fix, and it's mechanical,
not strategic.**

**Step-zero checklist (do before any promotion):**
- [ ] Decide a real first version (suggest `0.1.0` — signals "usable preview," not the placeholder `0.0.1`).
- [ ] **Publish the Rust crates to crates.io** (`cargo publish`; note hashkit-match depends on hashkit → publish hashkit first). These are the most self-contained and the easiest first win.
- [ ] **Publish the Python packages to PyPI** (build + `twine upload`; reserve the names before someone squats them).
- [ ] **Publish the npm SDKs** under the `@digitalharm` scope.
- [ ] **Tag a Go release** (`vX.Y.Z` git tag) so pkg.go.dev indexes hashstream/evidencevault.
- [ ] Add a CI release workflow so versions publish on tag (removes future friction).
- [ ] Verify each "install → run the quickstart" path end-to-end from a clean machine.

**Honest caveat:** several tools have *intentional* integration seams that need a
credential or counsel sign-off (NCMEC/IWF hash access, CyberTip production submit).
Publishing is still correct — ship them as "engine + documented seam," with the
README stating plainly what the adopter must bring. Don't let the gated bits hold
back the un-gated 80%.

---

## 3. The strategic discovery — ROOST changes the plan

**ROOST (Robust Open Online Safety Tools)** launched Feb 2025 at the Paris AI
Action Summit with **$27M** from Google, OpenAI, Discord, Roblox, Mozilla, and the
Knight Foundation. Its explicitly stated *first* focus area is CSAM ("identify,
remove, and report CSAM"). This is the center of gravity for our exact category, and
it's a **partner, not a competitor** — its shipped tools are a rules engine (Osprey,
used by Bluesky/Discord/Matrix) and a review console (Coop), **not** a hash-matching
+ §2258A-reporting library. That's our wedge: be the open hash-matching/reporting
layer that complements ROOST's stack.

Three concrete surfaces ROOST gives us:
- **`roostorg/awesome-safety-tools`** — the canonical OSS-safety directory T&S
  engineers consult, with Hash-Matching / Classification / Reporting sections that
  already list Meta PDQ, Wikimedia's matcher, etc. **Getting our libraries in via
  PR is the highest-ROI, lowest-effort distribution move available** — once they're
  installable (step zero).
- **`roostorg/model-community`** — distribution path if/when we ship an inspectable
  classifier.
- **ROOST community** (`community@roost.tools`, Discord) — partnership + design-
  partner sourcing.

---

## 4. The trust problem — unique to this category, and our biggest moat

A developer must trust a CSAM tool enough to put it in their pipeline handling
legally radioactive material. What builds that trust (and what we should
deliberately invest in):

1. **"We ship no hash list, ever."** We provide the matching *engine* + reporting
   *plumbing*; the operator brings the licensed NCMEC/IWF/Arachnid list. This both
   limits our liability and signals we understand the threat model — say it loudly,
   everywhere. (It's also *why* a hosted model like IFTAS's died and a self-hosted
   OSS one is sustainable.)
2. **Public conformance test vectors** — perceptual hashing has *no* standardized
   benchmark, so a public suite proving our PDQ output matches Meta's reference,
   reproducibly, on synthetic/non-CSAM images, is a credibility moat **no paid
   incumbent offers.** We already have `detectkit-test` (deterministic fixtures) and
   hashkit's conformance vectors — this is a strength to *market*, not just ship.
3. **Named maintainer / neutral governance** — even a named advisory board or a
   stated stewardship model materially changes enterprise adoption. ROOST's whole
   value prop is "named, funded, neutral nonprofit ships the tools."
4. **Legal-obligation mapping** — docs that show exactly how each tool helps satisfy
   §2258A / REPORT Act (report-on-awareness, 1-yr preservation) and the TAKE IT DOWN
   Act (the 48-hr "remove known identical copies" requirement is *literally* a
   hash-matching problem — our product).
5. **Reference-adopter logos** — even 2–3 named operators flips the trust equation.
6. **A future third-party security audit** (Trail of Bits / Cure53 class) is the
   enterprise baseline; worth planning once there's adoption to justify it.
7. **Sensitivity guardrails** (non-negotiable): never ship/host/demo with real CSAM
   or hash lists; all demos use synthetic vectors. Frame for the privacy-sensitive
   HN/Reddit audience as *auditable, operator-controlled, no-client-side-scanning-
   mandate* — not surveillance (remember the Apple NeuralHash backlash).

---

## 5. The sequenced adoption path

Ordered so each step unlocks the next. Don't front-load the launch.

### Phase 0 — Make it installable *(blocker; §2)*
Publish to crates.io / PyPI / npm; tag Go; CI-on-tag. Until this is done, nothing
else matters.

### Phase 1 — Make it trivial to start *(the conversion surface)*
- A **60-second, copy-pasteable quickstart per language** in each README ("hash a
  file / scan an upload in 5 lines"). READMEs exist (11/12 packages) — audit each
  for a *runnable* first example against the now-published package.
- One umbrella **"start here"** path in the root README that routes the three
  personas to their entry tool.
- Verify every quickstart from a clean machine.

### Phase 2 — Be discoverable where intent already exists *(low effort, high ROI)*
- **PR into `roostorg/awesome-safety-tools`** (Hash-Matching / Classification /
  Reporting). Single highest-ROI move.
- Precise **GitHub topics** (`csam-detection`, `perceptual-hashing`, `pdq`,
  `trust-and-safety`, `content-moderation`, `ncmec`, `online-safety`).
- crates.io categories/keywords + npm keywords + Go docstrings (the registries that
  actually drive discovery).
- PRs into `awesome-rust` / `awesome-python` / `awesome-go` / AppSec lists.
- Get the first ~100 GitHub stars from the existing network *before* any public push
  (conversion is poor below 100).

### Phase 3 — Build the trust moat *(§4)*
- Publicize the conformance vectors as a first-class feature (a `CONFORMANCE.md`
  showing reproducible PDQ parity).
- Add the §2258A / TAKE IT DOWN obligation-mapping doc.
- State the "no hash list shipped" positioning prominently in the root README.

### Phase 4 — Land 2–3 named design partners *(the trust currency)*
- Target **5–10 design partners, no more.** Best sources, by urgency:
  (1) Fediverse operators orphaned by IFTAS (via FediForum, r/selfhosted),
  (2) a platform racing the TAKE IT DOWN May-2026 deadline,
  (3) an AI startup under Safety-by-Design scrutiny.
- Offer: hands-on integration help + early support. Ask: biweekly feedback +
  **permission to use them as a named reference logo.**
- Run this outbound motion *in parallel* with the inbound funnel.

### Phase 5 — One disciplined launch moment
- **Show HN / Lobste.rs / dev.to**, framed civically: *"Open, auditable CSAM-
  detection libraries so small platforms can comply with the Online Safety Act /
  TAKE IT DOWN Act without a Thorn contract or PhotoDNA approval."* HN over-indexes
  on OSS + privacy-first infra — favorable, *if* the install-and-run story is airtight
  (Phase 0–1) and a reference logo exists (Phase 4).
- Avoid superlatives; lead with the technical/threat-model depth; engage critics.

### Phase 6 — Sustain (the actual growth engine)
- Ship integrations into where developers already are: a **GitHub Action**, a
  **Supabase storage-hook template**, a **Hugging Face Gradio Space demo** (synthetic
  vectors only). The Trivy/Semgrep lesson: growth = embedding into existing workflows
  + consistency, not a launch day.
- Be present in the T&S channels: **TrustCon**, the **All Tech Is Human** / **TSPA**
  Slacks, and the two read newsletters (*Everything in Moderation*, *T&S Insider*).

---

## 6. The five highest-leverage moves, in order

1. **Publish everything** (crates.io / PyPI / npm / Go tag) at `0.1.0`. Nothing
   works until a developer can install. *Mechanical; do first.*
2. **PR into `roostorg/awesome-safety-tools`.** Highest-ROI discovery in the category.
3. **Market the conformance vectors + "no hash list shipped"** as the trust moat no
   incumbent offers.
4. **Land 2–3 named reference adopters** from the IFTAS-orphaned Fediverse + a
   TAKE-IT-DOWN-deadline platform.
5. **One disciplined Show HN / dev.to launch** once 1–4 are real.

---

## 7. Realistic monetization (so "adoption" has a destination)

Adoption is free and should stay that way; revenue comes from removing operational
and legal risk for the subset who'll pay (~74% of OSS-using orgs pay for something):
**compliance attestation / audit-ready evidence packs** (strongest wedge — "hand you
the audit trail when the regulator calls"), **managed/hosted** matching + reporting,
and **integration/support** contracts. Detail in `ideal-customer-profile.md §7`.

---

*Companion docs: `docs/gtm/ideal-customer-profile.md` (named targets, firmographics,
competitive wedge). Adoption-mechanics research sourced from ROOST/Mozilla launch
coverage, IFTAS shutdown post-mortem, a16z design-partner framework, and the Trivy/
Semgrep/Presidio/Ozone adoption case studies (2024–2026). Last compiled 2026-06.*
