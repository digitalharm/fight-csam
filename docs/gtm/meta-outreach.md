# Meta open-source safety outreach — plan + drafts

**Status:** planning. No outreach has been sent. This document is the playbook + draft library for the Pillar-C ("Meta outreach — deference + conformance + interop; never competition") workstream.
**Owner:** maintainer (solo). **Gated on:** v0.1 publish + v0.3 `CONFORMANCE.md` live (see §4). **Do not send anything before those land.**

---

## 0. The posture in one paragraph

Meta is **upstream**, our **conformance source**, and a **ROOST co-founder**. We build *on* PDQ / TMK+PDQF / vPDQ, on the Hasher-Matcher-Actioner (HMA) shapes, and on `python-threatexchange`; `hashkit` is conformance-tested byte-identical to the `facebook/ThreatExchange` PDQ C++ reference, with CI failing closed on drift. The entire goal of contacting Meta's OSS safety people is **technical acknowledgement** — a maintainer reads our conformance work, links it, corrects it, or merges a small interop PR. It is **not** an endorsement, a co-marketing ask, a press moment, or a "we built a better PDQ" claim. We never say "beats Meta," never imply endorsement from adjacency, and we accept silence gracefully. The realistic, good outcome is one of: a reply on a Discussion thread, a "looks right" on the methodology, a merged interop PR, or being referenced as a conformant downstream implementation. Anything beyond that is upside we do not plan around.

This is consistent with the ICP truth that **Big Tech with in-house T&S consumes the open algorithms, never our product** — so we are not selling Meta anything. We are earning standing in the open-PDQ implementer community that Meta stewards, because that standing is procurement-grade trust for *our* ICP and the warm-up for the eventual ROOST/Lantern/NCMEC sequence.

---

## 1. Channels, in strict priority order

Ranked by reputational safety × likelihood of a substantive technical response × how much it advances the plan. **Every channel below is value-first and human-written. None is cold GitHub issue/PR spam — that is a hard guardrail and a single scripted blast could get the `awesome-safety-tools` PR rejected and poison the ROOST/Meta/NCMEC relationships the whole plan depends on.**

### Priority 1 — Through the ROOST relationship (warm intermediary)
**Why first.** Meta **co-founded ROOST**; ROOST is already our highest-ROI ecosystem channel (the single `roostorg/awesome-safety-tools` PR, `community@roost.tools`, the Discord). A warm, low-frequency note routed through people who already know the work is the single most credible way to reach a Meta integrity/OSS-safety engineer, and it costs Meta nothing to ignore politely. It also keeps us out of cold-pinging Meta T&S directly (which reads as a vendor pitch from someone Big Tech doesn't buy from).
**Mechanic.** Only *after* the `awesome-safety-tools` PR is merged and `CONFORMANCE.md` is live, mention to our ROOST contact — in the existing thread, as an aside, not a campaign — that hashkit publishes machine-checkable PDQ conformance vectors against the ThreatExchange reference, and ask whether there's an appropriate person on the Meta side who'd want to sanity-check the methodology. Let ROOST decide whether to make an introduction. **Never ask ROOST to vouch for quality**; ask only for a routing pointer.
**Frequency.** Once. If no pointer comes, drop it.

### Priority 2 — A thoughtful GitHub Discussion on the relevant Meta repo
**Why second.** A **Discussion** (not an Issue, not a PR) on `facebook/ThreatExchange` is the correct venue for "here is a conformant open implementation + reproducible vectors; is our methodology sound, and would you want a conformance fixture upstreamed?" It is public, opt-in to answer, durable, and reads as a contribution to the open-PDQ commons rather than a demand on a maintainer's queue. It references our *published* vectors and CI drift-gate, so the maintainer can verify everything in one command without trusting us.
**Mechanic.** Open one well-scoped Discussion in the ThreatExchange repo's PDQ area (Q&A / Show-and-tell category, whichever the repo uses). Lead with deference and conformance; ask one concrete, answerable question (is the corpus-construction + parity methodology the right shape; is there interest in a contributed conformance fixture). **Do not** open it in `meta-llama/PurpleLlama` for hashing matters — that's the wrong repo (Purple Llama is the model/guard ecosystem and is a `reference` for us, relevant only later for the red-team probe-pack contribution at v0.4).
**Escalation to a PR — only on a genuine, reproducible discrepancy.** If, in building the corpus, we find a real, reproducible drift between our output and the C++ reference, *that* is a high-signal upstream Issue/PR — file it, with a minimal repro, asking nothing. Finding and reporting a real discrepancy earns more standing than any introduction. Signal, never noise: no "drive-by" issues, no feature requests, no self-promotion in unrelated threads.

### Priority 3 — Tech Coalition
**Why third.** Tech Coalition is an ally in the GROUND-TRUTH list and the institutional home where child-safety engineering practice (including Lantern, the cross-platform signal-sharing program) is discussed. It is a **slower, relationship channel**, not a place to drop a repo link. The realistic role here is: as the Lantern outreach (separate doc, `docs/outreach/lantern.md`) and the legal/credential clock progress, Tech Coalition member engineers become people who *encounter* the conformance work in context, and some of them are Meta integrity engineers. Treat it as ambient credibility-building tied to the Lantern track, **not** a direct Meta-outreach lever to pull on its own schedule.
**Mechanic.** No standalone Tech Coalition "please look at Meta-conformance" action. Fold any mention into the existing Lantern/Tech-Coalition relationship work, value-first, and only once there's a live proof point.

### Priority 4 — Trust & Safety research venues (in person)
**Why fourth / lowest-frequency.** TrustCon and the Stanford Internet Observatory / **Trust & Safety Research Conference** are where Meta integrity engineers and the OSS-safety world overlap face-to-face. A two-minute hallway "we ship reproducible PDQ conformance vectors, would value your read" is the highest-trust, lowest-pressure version of this entire effort — but it is **opportunistic and calendar-bound**, not a channel you can fire on demand, and it presumes the conformance artifact already exists to point at. Use it if/when the maintainer is at the venue; never build the plan's critical path on it.
**Mechanic.** If attending, have the one-line conformance pitch + the `fightcsam.org/docs` (CONFORMANCE) link ready; follow up by email, logged in the ledger, ≤5/week cap respected.

**Explicitly NOT channels (do-not-do):**
- ❌ Cold GitHub **Issues** or **PRs** on any Meta repo as an opener. (Discussions and genuine-discrepancy PRs only.)
- ❌ Cold-pinging **Meta T&S / integrity staff** on social or email as a vendor pitch.
- ❌ Any ask framed as endorsement, partnership, logo, or quote. (Written sign-off required before the word "partner" is ever used; we will not seek it from Meta at all in the near term.)
- ❌ Posting the repo link into unrelated Meta-repo threads, or anything that looks like driving traffic.

---

## 2. The credibility hook (what we lead with, and why it lands)

Meta's safety engineers are flooded with low-quality "we use your stuff" pings. The only thing that earns a read is a **verifiable, machine-checkable artifact that respects their work and asks nothing.** We have exactly that. Lead with these four, in this order:

1. **Published `CONFORMANCE.md` + a machine-checkable vector corpus.** `hashkit`'s PDQ is byte-tested against the `facebook/ThreatExchange` PDQ C++ reference; the frozen, versioned corpus lives at `packages/hashkit/vectors/` (`corpus.json` + deterministic generation scripts under `sources/`), and **CI fails closed on any drift** across every binding (Rust, WASM, Node, Deno, Bun, Python). The reproduction method is documented and points *at their reference* as the source of truth (`packages/hashkit/vectors/README.md`). A maintainer can verify our central claim in one command — no trust required. **This is a credibility artifact no incumbent offers**, and it is framed as *conformance to* Meta, never superiority over Meta.

2. **Correct, generous attribution everywhere.** Every README and the site state plainly: *"PDQ / TMK+PDQF / vPDQ are Meta's; hashkit conforms to them and does not compete."* We profiled their projects honestly in our public ecosystem directory (`fightcsam.org/docs/ecosystem`) — PDQ, TMK+PDQF, vPDQ, HMA, and `python-threatexchange` are all credited as **`learn-from`/upstream**, not competitors. The residual "raw-hashing-superiority" claim has been stripped (v0.2 repositioning: hashkit's edge is **Rust/WASM portability + NCMEC conformance vectors**, full stop). We mirror the directory's own *"inclusion is not an endorsement"* line and will never imply Meta endorsement from adjacency or a merged PR.

3. **The analysis we published.** Our read-only landscape analysis (`docs/gtm/landscape-analysis-2026-06.md`) explicitly concludes Meta is upstream and the conformance source, that HMA out-features our service path for any platform that *can* get exchange access, and that we should **adopt HMA's declarative ActionRule shape** and **build on Meta's proven shapes rather than reimplement** them. Pointing a Meta engineer at our own published "Meta leads here, we conform / we build on you" analysis is disarming proof we're not positioning against them — the opposite of the usual pitch.

4. **The concrete, deferential interop bridges (the "we extend your reach, by config not migration" gifts).** These are the asks-shaped-as-gifts that make a maintainer *want* to engage, sequenced later in the release ladder:
   - a **`python-threatexchange` `SignalExchangeAPI` plugin** so the existing pytx installed base can point at `hashstream` **by configuration, not migration** (v0.5);
   - the **CSAM-intent red-team probe pack** contributed to the Purple Llama / Garak / PyRIT / Promptfoo ecosystem — the generalist harnesses deliberately omit CSAM probes, and our NCMEC-aware, counsel-conscious posture uniquely qualifies us to author them responsibly (v0.4), paired with **wrap-and-credit** of Llama Guard / Prompt Guard 2 / ShieldGemma 2 as recommended companions, never reimplementations;
   - adopting **HMA's ActionRule shape** in `csam-shield`, cited.

**One-line hook (reusable):** *"hashkit is an Apache-2.0 Rust/WASM PDQ implementation that's conformance-tested byte-identical to the ThreatExchange C++ reference, with public machine-checkable vectors and a CI drift-gate — built on your work, not against it. Would a quick read of the methodology be welcome?"*

---

## 3. Message drafts

Three drafts. All are **send-ready skeletons** to be personalized per recipient; none should be sent verbatim or in bulk. Fill every `[bracket]`. Keep them short. The ask is always small and the value always comes first.

> **Language guardrails baked in (do not edit out):** never the word "compliant"/"turnkey"; never "beats Meta / beats PDQ" or any superiority/endorsement framing; pair claims with restraint; "conformance to," never "parity-as-superiority." Mirror "inclusion is not an endorsement." No logos/quotes/"partner" without written sign-off (and we are not seeking that from Meta now).

### Draft A — ROOST warm-intro request (Priority 1; email/DM in the existing ROOST thread)

> Subject: quick pointer question — PDQ conformance vectors
>
> Hi [name],
>
> Thanks again for [the awesome-safety-tools merge / the earlier note] — much appreciated.
>
> Small thing, no urgency. As part of FightCSAM (the Apache-2.0 CSAM detect/report/prevent libraries we listed), `hashkit` now publishes machine-checkable PDQ conformance vectors tested byte-identical against the `facebook/ThreatExchange` C++ reference, with a CI drift-gate. It's built *on* Meta's PDQ — we're an implementer/conformer, not competing with it — and I'd value a sanity-check of the conformance methodology from someone who knows PDQ deeply.
>
> Is there an appropriate person on the Meta open-source safety side you'd suggest I share it with (or who'd want it routed through you)? Totally fine if not — I know everyone's slammed. I'm not after an endorsement, just a technical read.
>
> Vectors + method: [fightcsam.org/docs CONFORMANCE link] · repo: github.com/digitalharm/fight-csam
>
> Thanks,
> [name]

### Draft B — GitHub Discussion on `facebook/ThreatExchange` (Priority 2; PDQ area, Q&A/Show-and-tell)

> **Title:** Conformant open PDQ implementation + machine-checkable vectors — methodology check + offer to upstream a conformance fixture
>
> Hi PDQ maintainers — opening a Discussion (not an issue) because this is a question, not a bug.
>
> I maintain `hashkit`, an Apache-2.0 Rust/WASM PDQ implementation that's part of an open-source CSAM-safety toolkit. It's built **on** PDQ and treats this repo's C++ implementation as the source of truth — I'm not claiming any improvement over PDQ, only a different footprint (Rust/WASM) and a set of conformance test vectors.
>
> What I'd value your eyes on:
> 1. **Methodology.** I publish a frozen, versioned corpus of `(deterministically-generated benign input → expected PDQ hash + quality)` and fail CI closed if any binding (Rust/WASM/Node/Deno/Bun/Python) drifts from the recorded value. Expected hashes are computed against this repo's C++ reference. Corpus + generation scripts: [link]. Does this corpus-construction and parity approach look like the right shape to you, or are there inputs/edge cases (e.g. quality-metric boundaries, dihedral variants) you'd want covered to call an implementation "conformant"?
> 2. **Offer.** If useful to the ecosystem, I'd be glad to contribute a small, license-clean conformance fixture upstream (benign inputs only — no CSAM, no real hash lists) so other PDQ ports can self-check. Happy to shape it to whatever you'd accept; equally happy to just keep it on our side if you'd rather not take on the surface.
>
> No ask beyond your read. Everything is reproducible from the links. Thanks for PDQ — it's the foundation here.

### Draft C — Discrepancy-driven upstream Issue/PR (Priority 2 escalation; ONLY if we find a real, reproducible drift)

> **Title:** [pdq] Reproducible discrepancy: [one-line description] on [input class]
>
> While building conformance vectors for an independent PDQ port, I hit a reproducible difference between [our output] and this repo's C++ reference on [specific, minimal input]. Filing in case it's useful — no urgency, and it may well be on my side.
>
> **Repro (benign synthetic input, no CSAM / no real lists):**
> - Input: [deterministic generator / attached benign file]
> - C++ reference output: [hash/quality]
> - Independent port output: [hash/quality]
> - Steps: [minimal commands]
>
> **Question:** is the reference behavior here the intended/specified one? If so I'll conform to it; if it's an edge case worth pinning, I'm happy to contribute a regression vector. Either way, thanks — flagging signal, not asking for a fix on any timeline.

---

## 4. What must be READY first (and what's owner-gated)

**Hard precondition — nothing ships before both of these are true** (Guardrail: *do not promote anything before v0.1 publish makes every install→quickstart resolve; do not send any Meta/ROOST ask before v0.1 publish + v0.3 conformance give it a live, verifiable proof point*):

| Must be ready | Why | Rung | Owner-gated? |
|---|---|---|---|
| **v0.1 published** — all packages resolve; `cargo add digitalharm-hashkit` etc. actually work from a clean machine | A Meta engineer who clicks through to a broken install is a permanently lost reader; a broken `cargo add` on a CSAM tool is worse than silence | v0.1 | **YES** — owner registry tokens (crates/PyPI/npm `@digitalharm` org/Go tags) + the overdue full git-history secrets/CSAM/hash-list scan |
| **`CONFORMANCE.md` + machine-checkable vectors live** and reproducible in one command, CI drift-gate green | This *is* the credibility hook; without it there is nothing to ask Meta to look at | v0.3 (publishing folds into v0.2–v0.3 on the site) | **YES** — synthetic-corpus distribution sign-off gates vector publication |
| **`awesome-safety-tools` PR merged** + `fightcsam.org/docs/ecosystem` published | Establishes ROOST standing first, so the Priority-1 warm intro has a basis; proves correct attribution | v0.2 | No (but sequence after install strings are true) |
| **Attribution clean** — "PDQ/TMK/vPDQ are Meta's; hashkit conforms, does not compete" in every README + site; raw-hashing-superiority claim stripped | A single "we beat PDQ" anywhere detonates the whole posture | v0.2 | No |
| **The published analysis is public** (`landscape-analysis-2026-06.md` → site form) | It's draft-A/B's disarming proof; lets us point Meta at our own "you lead, we conform" conclusion | v0.2–v0.3 | No |
| **Outreach ledger created** (gitignored): who / when / response / opt-out | Required by the anti-spam guardrail before any send; honor every "no," never re-contact, never automate | before first send | No |

**Interop gifts that unlock the *later*, warmer asks (not preconditions for first contact):**
- `python-threatexchange` `SignalExchangeAPI` plugin — **v0.5** (owner-confirm: we recommend best-in-class externals at steps we don't cover).
- CSAM-intent red-team probe pack for Purple Llama/Garak/PyRIT/Promptfoo — **v0.4** (do **not** pull forward; release-gate is firm).
- The single low-key ROOST-bridged ask (be listed as a conformant open PDQ implementation, or have a Meta engineer sanity-check the methodology) — **v1.0+**, and only after conformance **and** a named reference adopter both exist.

**Owner-gated, explicitly:** the v0.1 registry publish (credentials), the synthetic-corpus sign-off (gates the vectors), and — far downstream, never on this critical path — the NCMEC ESP credentials that let the `ncmec_verified` corpus subset land (the strongest possible "conformant downstream" proof, but a v2.0 unlock, not needed to start the conversation).

**Stays gated / never bypassed even here:** ship **no hash list, ever**; every example/fixture/Space is `detectkit-test` synthetic only; `cybertip-cli` stays `ProductionSubmitBlocked` and `evidencevault` retention unenforced until NCMEC ESP + outside-counsel + a consented filing partner; never the word "compliant," even in anything a Meta reader sees.

---

## 5. What counts as success (and what doesn't)

**Success = a maintainer acknowledgement, link, or piece of feedback. Not an endorsement.** Concretely, in rough ascending order — any one of these is a win:

- a substantive reply on the ThreatExchange Discussion (even "yes, that methodology is reasonable");
- a "looks right" / correction on the conformance methodology from a Meta engineer;
- a **merged interop PR** (the conformance fixture upstream, or — separately — the pytx `SignalExchangeAPI` plugin / a red-team probe accepted in the Purple Llama-adjacent ecosystem);
- being **referenced/linked as a conformant open PDQ implementation** anywhere on their side;
- a ROOST-routed introduction that results in any of the above.

**Explicit non-goals (do not chase, do not imply):**
- ❌ A public endorsement, quote, logo, or the word "partner" from Meta.
- ❌ Any "Meta-approved / Meta-recommended" framing — forbidden, including in agent-generated copy, `/llms.txt`, the manifest, the Skill, and READMEs.
- ❌ A press moment or co-marketing.
- ❌ Treating silence as failure. **Silence is the expected default and is accepted gracefully** — the conformance artifact stands on its own as ICP-facing trust whether or not Meta ever replies. Most value here is the *artifact existing and being correct*, not the reply.

**Disqualifying outcomes to avoid at all costs** (these are worse than no response): being perceived as a spammer (cold issues/PRs, bulk pings), being perceived as an over-claimer ("beats PDQ"), or implying endorsement that wasn't given. Any of these can get the `awesome-safety-tools` PR rejected and poison ROOST/Meta/NCMEC for the whole plan. When in doubt, **send less, claim less, ask less.**

---

## 6. Sequenced checklist

1. ☐ **(gate)** v0.1 published; clean-machine install verified; git-history scan done. *(owner)*
2. ☐ **(gate)** `CONFORMANCE.md` + vectors live, CI drift-gate green, one-command repro confirmed. *(owner sign-off on corpus)*
3. ☐ Attribution swept clean across READMEs + site; superiority claim gone.
4. ☐ `awesome-safety-tools` PR merged; `/docs/ecosystem` published; analysis public.
5. ☐ Gitignored outreach ledger created.
6. ☐ **Priority 1:** send Draft A to the ROOST contact (once). Log it. Honor the response.
7. ☐ **Priority 2:** open Draft B as a ThreatExchange **Discussion** (once). Only file Draft C if a *real, reproducible* discrepancy surfaces.
8. ☐ **Priority 3/4:** fold Tech-Coalition mention into the Lantern track; carry the one-line hook to TrustCon / TS Research Conference if attending. ≤5/week cap, ledger every touch.
9. ☐ **v0.4/v0.5 gifts:** ship the red-team probe pack (v0.4) and the pytx `SignalExchangeAPI` plugin (v0.5) — *these PRs are the outreach.*
10. ☐ **v1.0+ only:** the single low-key ROOST-bridged ask, after conformance **and** a named reference logo both exist. Accept silence gracefully.

---

### Source grounding
- `packages/hashkit/vectors/README.md`, `packages/hashkit/vectors/v0/corpus.json` — the conformance corpus, the reproduction method (against `facebook/ThreatExchange/tree/main/pdq`), the `ncmec_verified` subset, the "no CSAM imagery / no raw reference hashes" guarantees.
- `docs/gtm/landscape-analysis-2026-06.md` — the published "Meta is upstream + conformance source; build on / adopt their shapes; don't claim superiority" analysis.
- `docs/gtm/adoption-strategy.md` — ROOST as the warm intermediary; conformance vectors as the trust moat to market; `community@roost.tools` + Discord.
- `docs/ops/v2-release-plan.md` — rung timing: `CONFORMANCE.md` (v0.2–v0.3), SignalExchangeAPI plugin (v0.5), red-team pack (v0.4), `ncmec_verified` vectors + counsel gates (v2.0); the BUILD-vs-WRAP table (Meta is upstream).
- `docs/safety-policy.md` — no hash list, no CSAM, "we do not provide compliance attestation by default," conformance-against-canonical-reference as a stated practice.
- `.claude/skills/csam-safety/references/fightsam-tools.md` — exact install strings + the standing "don't claim it beats Meta PDQ" note on hashkit.
- `apps/fightsam-site/ecosystem.projects.json` — Meta repo verdicts: PDQ / TMK+PDQF / vPDQ / HMA / `python-threatexchange` = `learn-from`; Purple Llama = `reference`; Llama Guard / Prompt Guard 2 = `use`; Osprey / Automod(hepa) = `use`.
