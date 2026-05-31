# Outreach: Tech Coalition Lantern program

A draft outreach letter for the Tech Coalition's [Lantern](https://www.lantern.global/)
cross-platform signal-sharing program. Lantern is the closest fit because its member
companies — small to mid-stage UGC platforms — are exactly the audience the
portfolio is built for, and Lantern's stated thesis (shared signals raise the
floor) generalizes naturally to shared OSS plumbing.

---

## Cold email

**To:** `program@lantern.global` (verify before sending; this is the address
listed on lantern.global as of writing — confirm by reading the site)

**CC:** `info@technologycoalition.org` for the parent organization's awareness.
Optional: a specific Lantern advisor or member-org contact if one is known.

**Subject:** A buildable layer beneath the CSAM-defense stack — open-source proposal

**Body:**

> Hello,
>
> I run The Digital Harm Report ([digitalharm.org](https://digitalharm.org)), an
> evidence-synthesis publication on pornography exposure, addiction, CSAM, and
> the technologies used to detect and prevent it. Chapter 06 maps the working
> defense — PhotoDNA, NCMEC, IWF, Project Arachnid, Cloudflare's CSAM Scanning
> Tool, Thorn Safer, Hive AI, Meta's open-source PDQ and TMK+PDQF — and the
> audience guides translate that map into role-specific operational guidance for
> founders, compliance teams, and clinicians.
>
> While writing this, a clear pattern emerged. Every Lantern-shaped platform —
> a 20-person UGC company, a mid-stage AI image generator, a growing community
> app — independently reimplements the same plumbing: an unverified PDQ port,
> a from-scratch CyberTipline submitter built from a PDF spec, an ad-hoc
> evidence retention layer in raw S3, an inconsistent hash-list polling
> schedule. The result is silent drift in the layer that needs to be the most
> rigorous, multiplied across hundreds of platforms.
>
> I've designed a ten-tool open-source portfolio that sits one layer below the
> existing detection ecosystem and makes it consumable. None of the tools
> ship a hash list or handle real CSAM — the gated infrastructure stays with
> NCMEC, IWF, and Project Arachnid, where it belongs. The portfolio implements
> the algorithms and clients that consume those resources, with a frozen,
> NCMEC-cross-checked conformance suite as the gating release artifact.
>
> Sketch of the portfolio (full design specs and a five-wave sequencing plan
> at [github.com/opencolin/digitalharm-oss](https://github.com/opencolin/digitalharm-oss)
> — currently private during initial bring-up):
>
> - **Foundation (credential-free, ships first):** HashKit (PDQ + TMK+PDQF
>   in WebAssembly with byte-identical hashes across Rust, Node, Deno, Bun,
>   Python), DetectKit-Test (synthetic non-CSAM fixtures with engineered hash
>   properties — verify your detection plumbing in CI without ever touching
>   real CSAM)
> - **Drop-in adoption:** CSAM-Shield (one-line middleware for
>   Express/Fastify/FastAPI/Hono wiring PhotoDNA, PDQ, NCMEC, and Cloudflare),
>   PromptShield (CSAM-intent detection at the prompt for AI generators)
> - **Credentialed infrastructure:** HashStream (version control and audit
>   trail for NCMEC / IWF / Project Arachnid hash lists), TrainGuard (pre-training
>   dataset screening with compliance reports)
> - **Legal endgame:** CyberTip CLI (NCMEC report submission with proper
>   formatting, retry, evidence packaging), EvidenceVault (defensible
>   records-retention with chain-of-custody metadata)
>
> The ask: fund one maintainer FTE for 12 months and the NCMEC
> ESP / vector-validation relationship that makes the conformance suite
> load-bearing. The total is approximately **$250,000 USD** for the first
> year — see the [funding breakdown](#funding-breakdown) below.
>
> Why Lantern specifically: the member companies are the exact buyers for
> this infrastructure, and the public-goods nature of the work (every
> platform needs the same plumbing; no platform alone should pay for it)
> aligns with Lantern's signal-sharing thesis. The maintainer (me) is a
> solo builder; the OSS portfolio is designed to be sustainable at that
> scale because the deliverable is verified primitives, not a feature
> treadmill.
>
> I'd value a 30-minute conversation to walk through the design, the
> sequencing, and the credentialing relationships I'd need Lantern's help
> to broker. Are you the right contact for this, or could you forward
> internally?
>
> Best,
> Colin Lowenberg
> collin@dabl.club
> [digitalharm.org/tools](https://digitalharm.org/tools)

---

## Funding breakdown

**$250,000 USD over 12 months.** Categories and rationale:

| Line | Annual | Notes |
|---|---|---|
| Maintainer FTE (one full-time engineer) | $160,000 | Senior IC rate at non-Bay-Area cost of living, fully loaded with benefits and self-employment burden. The largest line because every other category needs someone shipping. |
| NCMEC ESP relationship + vector validation | $30,000 | The conformance suite is load-bearing. Funding includes travel for in-person credential verification, attorney review of the ESP agreement, and the validation cycles themselves. |
| Outside counsel retainer | $25,000 | The legal-tier tools (CyberTip CLI, EvidenceVault) need counsel review before public release. Counsel with specific 18 U.S.C. § 2258A experience is not cheap. |
| Infrastructure (CI, hosting, security tooling) | $8,000 | GitHub Enterprise (private bring-up), hosted reference deployment of HashStream for testing, security scanning subscriptions. |
| Conference / community travel | $7,000 | One ATSA, one Tech Coalition annual meeting, one Trust & Safety Professionals Association — the rooms where adoption decisions get made. |
| Contingency | $20,000 | 8% buffer for the inevitable misalignment between estimates and reality. Returned to Lantern if unused. |
| **Total** | **$250,000** | |

For comparison: a single mid-stage platform's in-house re-audit of their PDQ
implementation typically costs $40–80K (one engineer for 3–6 months). The
portfolio amortizes that one-time cost across every Lantern member.

## Deliverables and milestones

**Quarter 1:** HashKit + DetectKit-Test public alpha. The Wave 1 foundation. A
working PDQ port verified against the facebook/ThreatExchange C++ reference on
a synthetic corpus. Available on crates.io, npm, PyPI.

**Quarter 2:** CSAM-Shield + PromptShield public beta. The Wave 2 drop-in
layer. At least three Lantern members running CSAM-Shield in staging by end of
quarter.

**Quarter 3:** HashStream alpha (requires NCMEC ESP credential by mid-Q3 —
the relationship work is the gating dependency). TrainGuard alpha if dataset
screening turns out to be lower-friction than HashStream.

**Quarter 4:** CyberTip CLI + EvidenceVault alphas, both gated by counsel
review. The NCMEC-cross-checked subset of the conformance suite reaches its
first verified milestone (≥50 vectors with `ncmec_verified: true`).

**Always-on:** the safety guard CI, transparent monthly progress reports to
Lantern, and quarterly metrics (adoption, downloads, observed reduction in
per-platform integration time among adopters who consent to share).

## What Lantern gets

- Logo placement on the
  [digitalharm.org/tools](https://digitalharm.org/tools) page (tasteful, not
  noisy)
- Recognition in release notes and the per-package READMEs
- Quarterly impact reports with adoption metrics, CyberTipline reports filed
  by libraries-using platforms (to the extent these can be measured
  ethically), and per-tool maturity ratings
- A standing "introduce a member" channel: Lantern members get prioritized
  onboarding to the OSS tools, and the maintainer commits to a same-week
  response to integration questions from member orgs
- The right to use the work and the data to inform Lantern's signal-sharing
  roadmap (a shared OSS hashing primitive lowers the floor for every Lantern
  signal)

## What Lantern does not get

- Editorial control over digitalharm.org's report content. The OSS portfolio
  and the editorial publication are deliberately separate; sponsorship of the
  former does not buy influence over the latter.
- An exclusive license. The portfolio is Apache 2.0 across the board.
- Per-member feature requests that conflict with the safety policy. The
  policy is published; deviations are not for sale.

## Risks Lantern should know about

- **Relationship gating:** the most load-bearing artifact (the
  NCMEC-cross-checked conformance suite) depends on credentialing that a solo
  maintainer cannot obtain alone. Lantern's introduction to NCMEC ESP is the
  single highest-value form of in-kind support, even apart from the funding.
- **Legal blast radius on Waves 4+:** CyberTip CLI and EvidenceVault touch
  statutory reporting. The counsel-retainer line item is a hard floor, not a
  buffer.
- **Solo-maintainer concentration:** one engineer is the bus factor.
  Year-two planning includes recruiting a second maintainer (likely funded by
  a secondary infrastructure sponsor like Cloudflare or a foundation match).
  This is documented as a known risk, not a hidden one.

## Decision context

A decision by end of Q1 of the calendar year unlocks Wave 1 in time for the
spring Trust & Safety conference cycle. A decision by end of Q2 still works
but pushes public visibility to fall. The maintainer is committed to building
the foundation regardless of funding; what funding unlocks is the
credentialed-tier work that requires the relationships Lantern can broker.

## Follow-up cadence

- Initial email
- Follow-up 10 business days later if no response
- Stop after two follow-ups; revisit with a different sponsor track
  (Cloudflare, Patrick J. McGovern Foundation, EU Internet Forum)

## Alternative sponsors if Lantern declines

In rough priority order:

1. **Safe Online / End Violence Against Children Fund** — same audience,
   different funding mechanism (multilateral)
2. **Patrick J. McGovern Foundation** — funds AI-for-good infrastructure;
   PromptShield and TrainGuard fit their AI-safety lens
3. **Cloudflare** — has a working precedent of giving CSAM-defense
   infrastructure away for free (their scanner); natural secondary
4. **EU Internet Forum / DSA compliance budgets** — the regulatory context
   is European-favorable; complicates the maintainer's tax situation but is
   feasible
5. **Mozilla MOSS** — smaller dollar but tighter alignment with the OSS
   nature of the deliverables

Track outreach status in `docs/outreach/STATUS.md` (gitignored;
maintainer-private).
