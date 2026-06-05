# Outreach Templates — FightCSAM

Ready-to-send copy for every external touch in the customer-acquisition plan.
Everything here is tuned for the one currency that converts in this category:
**credibility and restraint.** The copy is humble, value-first, specific, free of
hype, and gives a clean opt-out. Over-claiming is credibility death; spamming is
reputationally fatal. Read the guardrails before sending anything.

> **Status note (read first).** These templates are written for the post-publish
> world. **Do NOT send any of them before the v0.1 publish makes every
> `install → quickstart` resolve from a clean machine.** A broken `cargo add` on
> a CSAM tool is worse than silence. The awesome-safety-tools PR, the ally notes,
> the ROOST/NCMEC/IWF/Tech-Coalition intros, the Show HN, and the dev-community
> post are all gated on real, installable packages. (See `docs/gtm/adoption-strategy.md` §2.)

---

## Non-negotiable language rules (apply to every template below)

These are baked into the drafts already; this list is so you don't reintroduce a
violation when you edit.

- **Never the word "compliant" / "turnkey compliance."** Say *"helps you take
  defensible, documented steps toward the duty; consult your counsel."*
- **Never "beats Meta / beats PDQ"** or any implied endorsement. Meta's PDQ /
  TMK+PDQF / vPDQ are **upstream and our conformance source**; Meta co-founded
  ROOST. Frame hashkit's edge **only** as Rust/WASM portability + NCMEC-verified
  conformance vectors. Lead with **parity** (CONFORMANCE.md), never benchmarks.
- **We ship NO hash list, ever.** Always say the operator brings their own
  credentialed NCMEC / IWF / Project Arachnid list.
- **Pair every legal-duty mention** with the counsel disclaimer **and** the
  "known-hash-matching isn't enough" caveat (self-generated material is most
  removed CSAM). Under-promise relative to the duty.
- **"Inclusion is not an endorsement."** Mirror the directory's own line; never
  imply ROOST / Meta / Bluesky / NCMEC endorsement from a merged PR or a listing.
  Get **written** sign-off before any logo, quote, or the word "partner."
- **Statutory tools stay gated, even in copy.** `cybertip-cli` (real submit) and
  `evidencevault` (enforced retention) are gated behind NCMEC-ESP credentials +
  outside-counsel sign-off. Do not describe them as finished filers/retention
  systems. Describe the un-gated engine + the *documented, stubbed* seam.
- **Privacy framing**, always: auditable, operator-controlled, self-hosted, no
  client-side-scanning mandate. Never "surveillance."

**Canonical facts to keep exact:**
- Brand: **FightCSAM** · site: **https://fightcsam.org** (docs at `/docs`,
  directory at `/docs/ecosystem`).
- Repo: **https://github.com/digitalharm/fight-csam** (public, Apache-2.0).
- Packages publish under the **`digitalharm`** name. Note the renames:
  crate `digitalharm-hashkit` imports as `hashkit`; PyPI `digitalharm-promptshield`
  imports as `promptshield`. Copy install strings from
  `.claude/skills/csam-safety/references/fightsam-tools.md` verbatim.
- The wedge for Tier-1: the **IFTAS CSAM-scanner shutdown (Mar 2025)** left
  Fediverse / self-hosted operators with no vendor.

---

## 1. GitHub Discussion / Issue — notifying a profiled maintainer we listed them

**When to use.** Only for the **24 "use"-verdict allies** (plus a curated
"learn-from" subset where there is genuine value to send). **Prefer email or an
existing thread / DM over a GitHub issue.** If you must use GitHub, open a
**Discussion** (not an Issue) so it doesn't read as a bug report or a task on
their tracker. Batched **≤5/week**, individually edited, logged in the gitignored
outreach ledger, opt-out honored permanently.

**Do-not-contact, ever:** all 13 out-of-scope + all 41 reference-only projects +
Big-Tech in-house T&S teams. (See Guardrails.)

> **Hard rule:** this is the ONE place a single careless scripted blast would be
> fatal. No automation. No templated bulk send. If it isn't individually true and
> individually useful, don't send it.

**Subject / title:** `We list <Tool> in the FightCSAM ecosystem directory — did we describe it right?`

**Body:**

```
Hi <maintainer name / team>,

I maintain FightCSAM (https://fightcsam.org), a set of small, Apache-2.0,
self-hostable libraries that help platforms detect, report, and prevent CSAM —
we ship the engine and the plumbing; the operator brings their own credentialed
hash list. We deliberately ship no hash list and don't claim to make anyone
"compliant."

While mapping the landscape we built a public directory of safety tools at
https://fightcsam.org/docs/ecosystem (it credits and builds on ROOST's
awesome-safety-tools). We list <Tool> under "<section>" with a "<verdict>"
note, and we recommend it as <the specific role — e.g. "the output-image
classifier to pair with our prompt-intent screening" / "the rules engine our
adapter feeds, rather than something we'd rebuild">:

  <paste the exact 1–2 sentence "take" from ecosystem.projects.json>

Two reasons I'm reaching out, both value-first:

1. I want to make sure we characterized <Tool> accurately and fairly. If
   anything is wrong, stale, or you'd word it differently, tell me and I'll fix
   it — or send a PR to <repo>/apps/fightsam-site/ecosystem.projects.json and
   I'll merge it.
2. Where we point developers at <Tool>, we send them real traffic. If there's a
   canonical install/docs link or a "recommended for X" framing you'd prefer we
   use, I'll use yours.

No ask beyond that. Inclusion in the directory isn't an endorsement in either
direction — it's an attempt to map the field honestly, in the same spirit as the
awesome-safety-tools list.

If you'd rather not be listed at all, just say so and I'll remove the entry — no
hard feelings, and I won't follow up.

Thanks for building <Tool>,
<name> · <contact> · github.com/digitalharm/fight-csam
```

**Notes for the sender:**
- Fill `<verdict>` / `<section>` / `<take>` from `apps/fightsam-site/ecosystem.projects.json`.
  Never paraphrase the take into something more flattering than what's published.
- If the project is "learn-from" (not "use"), drop the "we send you traffic" line —
  it isn't true; say instead "we cite it as a leading reference on <axis>."
- One opt-out line, near the end, unmissable. Honor it forever.

---

## 2. PR description — add FightCSAM to `roostorg/awesome-safety-tools`

**This is the single highest-ROI, lowest-reputational-risk discovery move — and
we do it exactly once, by hand.** Follow the list's real conventions (verified
against the live README):

- Entries are `* [Name by Author](url)` with a **2-space-indented** sub-bullet:
  `  * lowercase description, no trailing period`.
- Entries are **alphabetical within each section.**
- The real sections are `## Hash Matching` and `## Review` (there is **no**
  "Reporting" section — reporting tools live under Review, next to
  "NCMEC Reporting by ello").
- The README's own header says *"This list is not an endorsement."* Mirror that
  tone: factual, no superlatives.

**What to add (conservative — only the installable, un-gated, conformance-tested
primitives; do NOT list the gated statutory-submit tool as a finished filer):**

Under `## Hash Matching`, inserted in alphabetical position:

```
* [hashkit by FightCSAM](https://github.com/digitalharm/fight-csam/tree/main/packages/hashkit)
  * Rust/WASM PDQ and TMK+PDQF, conformance-tested byte-for-byte against Meta's PDQ reference, with NCMEC-verified test vectors; ships no hash list
* [hashkit-match by FightCSAM](https://github.com/digitalharm/fight-csam/tree/main/packages/hashkit-match)
  * in-memory Hamming/MIH matcher over a caller-supplied hash set, with collage false-positive guards; ships no hash list
```

(If maintainers prefer a single umbrella entry over two, fall back to one line
pointing at the repo root. Ask in the PR; don't assume.)

**PR title:** `Add FightCSAM hash-matching libraries (hashkit, hashkit-match)`

**PR description:**

```
## What this adds

Two entries under Hash Matching:

- **hashkit** — Rust/WASM perceptual hashing (PDQ, TMK+PDQF). It implements and
  is conformance-tested byte-for-byte against Meta's PDQ reference in
  facebook/ThreatExchange, with NCMEC-verified test vectors and a CI drift-gate.
  It does not compete with PDQ — PDQ is upstream and our source of truth; the
  point of hashkit is portable, identical output across runtimes.
- **hashkit-match** — an in-memory Hamming/MIH matcher over a caller-supplied
  hash set, with guards against the collage/grid false-positive failure mode.

Both are Apache-2.0 and **ship no hash list** — the operator brings their own
credentialed NCMEC / IWF / Project Arachnid relationship. That's deliberate: it's
the same reason the hosted Fediverse scanner model wasn't sustainable, and it
keeps the credentialed-list relationship where it belongs.

These are part of FightCSAM (https://fightcsam.org), a small set of composable
CSAM detect/report/prevent libraries. The rest of the toolkit isn't in this PR —
some pieces (statutory NCMEC reporting, evidence retention) are intentionally
gated behind credentials and counsel sign-off, and I'm not going to list them
here as if they're finished. These two are the clean, installable, un-gated
primitives that fit Hash Matching today.

## Why it fits the list

The list already covers PDQ, HMA, Perception, and platform-specific matchers.
hashkit/hashkit-match sit alongside those as a cross-runtime, conformance-verified
implementation of the same upstream algorithms — useful to the self-hosted and
small-platform operators this directory serves, especially after the IFTAS
scanner shutdown.

## Conventions

- Alphabetical placement within Hash Matching.
- `* [Name by Author](url)` + 2-space-indented lowercase sub-bullet, matching the
  existing entries.
- I've kept descriptions factual and non-promotional, in line with the README's
  "not an endorsement" framing.

Happy to adjust wording, collapse to a single umbrella entry, or split differently
— whatever fits how you'd like the section to read. Thanks for maintaining this.
```

**Sender notes:**
- Verify the two `packages/<tool>` paths resolve on `main` at PR time.
- Do **not** also bulk-submit to awesome-rust/-python/-go in the same breath —
  those are separate, single, manual, no-superlative PRs each.
- If a reviewer pushes back on "conformance-tested byte-for-byte," link
  CONFORMANCE.md rather than arguing; the artifact is the answer.

---

## 3. Short intro emails to institutions (ROOST, NCMEC, IWF, Tech Coalition)

All four are **low-frequency, high-substance, value-first.** None asks for money,
a logo, or an endorsement up front. Each leads with a concrete artifact they can
verify. Send only after v0.1 publish (and, for the ones leaning on conformance,
after v0.3 CONFORMANCE.md is live).

### 3a. ROOST (`community@roost.tools`)

**Subject:** `FightCSAM — open hash-matching/reporting libraries that build on awesome-safety-tools`

```
Hi ROOST team,

I maintain FightCSAM (https://fightcsam.org) — a set of small, Apache-2.0,
self-hostable libraries for CSAM detect / report / prevent. They're meant to be
the open hash-matching and statutory-reporting layer that complements a
decisioning stack like Osprey, not a competing rules engine: we ship an
Osprey/Coop adapter so our detection signals become events Osprey can decision
on.

A few things I thought you'd want to know, all value-first:

- Our public ecosystem directory (https://fightcsam.org/docs/ecosystem) credits
  and builds directly on awesome-safety-tools. I've opened one PR to add our two
  un-gated hash-matching libraries (hashkit, hashkit-match) under Hash Matching,
  following the list's conventions.
- hashkit is conformance-tested byte-for-byte against Meta's PDQ reference, with
  a CI drift-gate and NCMEC-verified vectors. We treat Meta's algorithms as
  upstream and never claim to beat them.
- We ship no hash list and never use the word "compliant" — operators bring their
  own credentialed list, and we point them to counsel for the legal duty.

The reason I'm writing rather than just opening the PR: the warmest near-term
adopters we see are the self-hosted / Fediverse operators left without a vendor
after the IFTAS scanner shut down in March 2025. If that overlaps with where
ROOST wants the open-safety ecosystem to grow, I'd value a short conversation —
and I'd welcome a sanity-check of our conformance methodology from anyone on your
side who knows this domain.

No ask beyond that for now. If this isn't a fit, no worries at all.

Thanks for standing ROOST up — it changed how I think about this whole space,
<name> · github.com/digitalharm/fight-csam
```

### 3b. NCMEC

> **Posture:** NCMEC is the statutory reporting body and an ESP-credentialing
> path — **not** a marketing channel. This note is purely about doing the gated
> tier responsibly, and it should go out only when there's a live proof point
> (post-conformance) and ideally via a warm ROOST introduction. Never imply
> endorsement; never describe `cybertip-cli` as a live filer.

**Subject:** `Open-source CyberTipline tooling — building it to your spec, gated correctly`

```
Dear NCMEC team,

I maintain FightCSAM (https://fightcsam.org), a set of open-source libraries that
help platforms detect, report, and preserve CSAM. I'm writing to do one part of
this the right way rather than the fast way.

We've built a CyberTipline reporting client (cybertip-cli) and an evidence-
preservation library with chain-of-custody. Both are deliberately kept on a
sandbox / dry-run path: real CyberTipline submission and enforced retention stay
blocked in code until an ESP credential and outside-counsel sign-off are in place,
with a consented filing partner. We do not want anything we ship to produce a
malformed or premature report, or to let an operator believe matching a list is
the same as meeting their legal duty.

Two reasons to reach out:

1. I'd like to make sure our report formatting, retry, and evidence-packaging
   conform to the current CyberTipline API and ESP expectations before any of it
   leaves the sandbox. If there's documentation or a contact for getting that
   right, I'd be grateful.
2. We ship no hash list and never claim to make anyone "compliant" — we send
   operators to counsel and to you for the credentialed relationship. If there's
   anything in how we're positioning the reporting step that you'd want corrected,
   please tell me.

I'm not asking for endorsement or a public association — just guidance so the
tooling is correct and safe when an obligated, credentialed operator uses it.

With respect for the work you do,
<name> · github.com/digitalharm/fight-csam
```

### 3c. IWF (Internet Watch Foundation)

**Subject:** `Open self-hostable hash-matching engine — operators bring their own IWF list`

```
Hello IWF team,

I maintain FightCSAM (https://fightcsam.org), a set of small, Apache-2.0,
self-hostable libraries for CSAM detection, reporting, and prevention. The model
is deliberate: we provide the matching engine and the plumbing, and the operator
brings their own credentialed hash list — including the IWF list, for IWF members.
We ship no hash list ourselves, and we never claim to make anyone "compliant."

I'm reaching out for two reasons, both about getting it right:

1. Where our docs describe how a UK-facing operator would meet their Online
   Safety Act duties, we want to point members to the IWF relationship accurately
   — not overstate what hash-matching alone achieves (we're explicit that known-
   hash matching doesn't cover self-generated or novel material) and not imply any
   endorsement. If there's wording you'd prefer we use, I'll use it.
2. If it's ever useful for IWF members to have a free, auditable, self-hosted way
   to consume the IWF list behind their own perimeter, I'd value your view on
   whether our approach fits how you'd want your data handled.

No ask for money, a logo, or a partnership. Just making sure the engine and the
docs respect how your list and your members work.

Thank you for the work,
<name> · github.com/digitalharm/fight-csam
```

### 3d. Tech Coalition

> **Posture:** Tech Coalition runs **Lantern** (signal-sharing) and is a potential
> funder. This first note is interop + credibility, **not** a grant ask. The
> Lantern grant/funder conversation comes later and only with a live, verifiable
> proof point (post v0.1 publish + v0.3 conformance) — keep them separate.

**Subject:** `FightCSAM — open CSAM libraries; interop with Lantern, built on Meta's open algorithms`

```
Hi Tech Coalition team,

I maintain FightCSAM (https://fightcsam.org) — small, Apache-2.0, self-hostable
libraries that help platforms detect, report, and prevent CSAM. We build on the
open ecosystem rather than around it: hashkit conforms byte-for-byte to Meta's
PDQ reference, our hash-distribution tool is built to the bar set by Meta's
python-threatexchange SignalExchangeAPI, and we credit the upstreams throughout
our ecosystem directory (https://fightcsam.org/docs/ecosystem).

Two value-first notes:

- We're designing our signal-distribution layer to interoperate via a
  SignalExchangeAPI-style plugin, so existing participants can adopt it by
  configuration rather than migration. If Lantern's signal-exchange model has
  conventions we should conform to, I'd like to get that right early.
- We ship no hash list and never use the word "compliant"; operators bring their
  own credentialed relationships and we point them to counsel. If anything in how
  we describe the reporting/sharing steps would concern you, I'd welcome the
  correction.

I know the Coalition also supports open child-safety tooling through Lantern and
related programs. I'm not raising that here — I'd rather first show you working,
conformance-verified code than lead with an ask. If a short conversation about
interop is useful, I'd value it.

Thanks for the work you do across the industry,
<name> · github.com/digitalharm/fight-csam
```

---

## 4. Show HN post

**Hard gate:** post this **only** when all three are simultaneously true —
airtight install, complete golden path, and ≥1 named reference-adopter logo (with
written sign-off). Civic framing without a named adopter reads as vaporware. Lead
with threat-model depth and conformance; be present in the thread to engage
critics; no superlatives.

**Title (pick one; keep it factual, no hype):**

```
Show HN: FightCSAM – open, auditable CSAM-detection libraries (ships no hash list)
```

Alternates:
- `Show HN: Apache-2.0 CSAM detect/report/prevent libraries you can self-host`
- `Show HN: Conformance-tested open PDQ hashing + CSAM-reporting plumbing`

**Body:**

```
Hi HN — I maintain FightCSAM (https://fightcsam.org), a set of small, Apache-2.0,
self-hostable libraries that help an online platform detect, report, and prevent
CSAM (child sexual abuse material).

Why this exists: a wall of laws landed in 2024–2026 (UK Online Safety Act, EU DSA,
US REPORT Act + the standing §2258A duty, US TAKE IT DOWN Act, AU eSafety) that
turned CSAM detection and reporting into a legal duty for small and mid-size
platforms. But the existing tools are gated or paid: PhotoDNA is vetting-gated and
cloud-only, Thorn/Hive are paid and sales-gated, and the one free open option for
self-hosters (IFTAS's Fediverse scanner) shut down in March 2025. So the platforms
newly on the hook are the ones least able to get tooling.

What FightCSAM is:
- hashkit (Rust/WASM): PDQ + TMK+PDQF perceptual hashing.
- hashkit-match (Rust): match hashes against a list you supply.
- csam-shield (TS/Python): drop-in middleware for an upload pipeline that
  orchestrates detectors with retry/timeout/policy.
- promptshield (Python): screen generation prompts for CSAM intent before compute
  is spent.
- plus tools for hash-list distribution, training-set screening, provenance, and
  moderator wellbeing.

Three things I want to be precise about, because this is child-safety code and
over-claiming here is harmful:

1. It ships NO hash list, ever. We provide the engine and the plumbing; the
   operator brings their own credentialed NCMEC / IWF / Project Arachnid list.
   That's not a limitation we're apologizing for — it's the correct threat model,
   and it's why a self-hosted approach is sustainable where a hosted one wasn't.

2. It is conformance-tested, not "better than Meta." Meta's PDQ/TMK are upstream
   and our source of truth; hashkit is tested byte-for-byte against Meta's PDQ
   reference, with a CI drift-gate and NCMEC-verified vectors. The only edge I
   claim is Rust/WASM portability and reproducible conformance — you can verify
   our hashing matches Meta's in one command. Meta co-founded ROOST, whose
   awesome-safety-tools directory this work builds on.

3. It does NOT make you "compliant," and I won't use that word. These tools help
   you take defensible, documented steps toward the duty — consult your counsel.
   And known-hash matching is not enough on its own: self-generated material is
   most of what actually gets removed, so this is one layer, not a solution.

On privacy: everything is auditable, operator-controlled, and self-hosted. There
is no client-side-scanning mandate. The statutory-reporting and evidence-retention
pieces stay gated behind credentials and counsel sign-off — the stubs are visible
and never bypassed, including in any code an AI agent generates from our docs.

It's used in production by <reference adopter> — <one factual sentence about what
they run>.

Everything's at https://github.com/digitalharm/fight-csam (Apache-2.0). Every
demo and test uses synthetic, non-CSAM fixtures by construction — there is no real
abuse material or real hash list anywhere in the repo.

I'm the maintainer and I'll be here all day. I'd genuinely value scrutiny of the
threat model, the conformance methodology, and the gating — tell me where it's
wrong.
```

**Sender notes:**
- Replace `<reference adopter>` with the real, signed-off logo/name. If you don't
  have one, **do not post** — pick a different week.
- Keep the title under ~80 chars and free of marketing words.
- Pre-write honest answers to the three predictable critiques: (a) "isn't this
  surveillance?" → auditable/operator-controlled/no CSS mandate; (b) "you can't
  beat PhotoDNA/Meta" → correct, we conform, here's CONFORMANCE.md; (c) "scanning
  causes false positives that ruin lives" → yes, which is why matching routes to
  human review, never auto-reports, and why the statutory step is gated.

---

## 5. Dev-community post (dev.to / Lobste.rs / Fediverse variants)

Same launch gate as Show HN. Three length/format variants below for three
audiences.

### 5a. dev.to (long-form, technical, how-to lean)

**Title:** `Adding CSAM safety to an upload pipeline without a Thorn contract or PhotoDNA approval`

**Tags:** `opensource`, `security`, `rust`, `trustandsafety`

**Body:**

```
If you run a platform that lets people upload images or video — or one that
generates them — a stack of 2024–2026 laws (UK Online Safety Act, EU DSA, US
REPORT Act and §2258A, US TAKE IT DOWN Act, AU eSafety) now puts you under a legal
duty to detect and report CSAM. The catch: the established tools are gated (PhotoDNA
vetting) or paid (Thorn, Hive), and the one free option for self-hosters shut down
in 2025.

FightCSAM (https://fightcsam.org) is a set of small, Apache-2.0, self-hostable
libraries built for exactly that gap. This post walks through wiring the detect
path on a synthetic test corpus — no real CSAM, no real hash list, nothing
credential-gated.

## The shape of it

A defensible detect path is: fingerprint media → match against a list you supply
→ route matches to human review → (when credentialed) report and preserve. Here's
the un-gated front half you can run today:

  # Rust: perceptual hashing
  cargo add digitalharm-hashkit   # crate is digitalharm-hashkit, imports as `hashkit`
  cargo add hashkit-match

  # Python: drop-in upload middleware + CI fixtures
  pip install csam-shield
  pip install detectkit-test       # synthetic, non-CSAM fixtures

[code sample: hash a synthetic fixture with hashkit, match it with hashkit-match
against a caller-supplied list, assert with detectkit-test in CI]

## Three things to be honest about

1. **It ships no hash list.** You bring your own credentialed NCMEC / IWF /
   Project Arachnid list. The library is the engine; the list relationship stays
   yours. That's the correct threat model.
2. **The hashing is conformance-tested, not "better."** hashkit conforms
   byte-for-byte to Meta's PDQ reference (Meta's algorithms are upstream). You can
   verify parity yourself — see CONFORMANCE.md.
3. **This does not make you "compliant."** It helps you take documented,
   defensible steps — talk to your counsel. And known-hash matching alone misses
   self-generated and novel material, which is most of the problem. Treat it as
   one layer.

The statutory reporting and evidence-retention pieces exist but stay gated behind
credentials and counsel sign-off — the sandbox stubs are visible and never
bypassed.

Repo (Apache-2.0): https://github.com/digitalharm/fight-csam
Docs + the ecosystem directory we build on: https://fightcsam.org/docs

If you maintain a platform in this position, I'd value your feedback — especially
on the gating and the threat model.
```

### 5b. Lobste.rs (terse; the audience is allergic to marketing)

> Post under a tag like `security` or `privacy`. One short paragraph. No images,
> no superlatives. Lobsters will downvote anything that smells like a pitch.

```
FightCSAM: small, Apache-2.0, self-hostable libraries for CSAM detect/report/
prevent. hashkit is PDQ/TMK perceptual hashing in Rust/WASM, conformance-tested
byte-for-byte against Meta's PDQ reference (Meta's algorithms are upstream — no
"better than" claim). It ships no hash list (you bring your own credentialed
NCMEC/IWF list) and makes no "compliance" claim — it helps you take documented,
defensible steps; consult counsel. Built for the small/self-hosted platforms the
gated/paid incumbents don't reach, especially after the IFTAS scanner shut down.
Statutory reporting/retention stay gated behind credentials + counsel sign-off.
Every demo uses synthetic, non-CSAM fixtures. https://github.com/digitalharm/fight-csam
```

### 5c. Fediverse / Bluesky (short, community-voiced — for the Tier-1 beachhead)

> This is the warmest audience (IFTAS-orphaned operators). Post once, in your own
> voice, in the AT-Proto Discord and one maintainer Bluesky thread — then let the
> 15-minute hepa guide travel on merit. Do **not** repost across instances; that
> reads as spam to exactly the people you most need.

```
If you run a Fediverse instance or a small platform and lost your CSAM scanner
when IFTAS shut theirs down: I've been building FightCSAM — Apache-2.0,
self-hostable libraries for CSAM detection that ship no hash list (you bring your
own credentialed NCMEC/IWF list). There's a ~15-minute copy-paste guide to add
hash-matching to a hepa rule and emit to Ozone, tested on synthetic fixtures only.

It's not a "compliance" button and it won't catch novel/self-generated material on
its own — it's one honest layer. Conformance-tested against Meta's PDQ (their
algorithm, upstream). Feedback from people actually running these instances is what
I most want. https://fightcsam.org/docs
```

---

## 6. Contributor-recruitment blurb

**Where it goes.** A `## Contributing` section snippet for READMEs and the repo's
Discussions, plus a version to drop (sparingly) in vetted, subject-matter-aware
venues — All Tech Is Human / TSPA Slacks, ROOST dev community, AT-Proto channels.
**Recruit narrowly and high-signal**; this is not a generic "PRs welcome." Make
clear what's safe to work on and what is fenced — the safe surfaces are wide open,
the legal/credentialed tier is contributor-closed.

**README / Discussions version:**

```
## Contributing

FightCSAM is maintained by a small team, so the most useful contributions are the
ones that are cheap to make and cheap to review. The safe-to-work-on surfaces are
wide open:

- **Conformance reproduction** — reproduce hashkit's PDQ output byte-for-byte on
  your OS/arch using the synthetic, non-CSAM vectors, and tell us it matched (or
  didn't). This is the single best first contribution: it's safe by construction,
  it's high-status, and it directly satisfies our Beta gate. We credit every
  reproducer by name.
- **Language bindings, docs, and thin adapters** (e.g. the AT-Proto / Ozone
  adapter, the Osprey/Coop adapter) — good "first real feature" work.
- **Synthetic test fixtures** for detectkit-test.

What we are explicitly NOT taking, and why:

- Anything touching a real hash list, real CSAM, or live credentials. Our CI
  fails closed on bundled hash artifacts; every fixture is synthetic by
  construction.
- The statutory-reporting (cybertip-cli) and evidence-retention (evidencevault)
  production paths — these are counsel- and credential-gated, the highest blast
  radius in the project, and contributor-closed. We route that energy to docs,
  test vectors, and jurisdiction research instead.
- A rules engine, a PII detector, a general toxicity classifier, or case
  management — the ecosystem already has better-resourced options and we wrap
  those rather than rebuild them.

Start with a `good-first-issue`, read the PR template's CSAM-safety checklist,
and ask in Discussions if you're unsure whether something is safe to work on —
we'd always rather you ask first.
```

**Slack / community one-liner (for vetted T&S venues only):**

```
FightCSAM (open, Apache-2.0 CSAM detect/report/prevent libraries) has a standing,
safe-by-construction first issue: reproduce our PDQ hashing byte-for-byte on your
platform using synthetic non-CSAM vectors. It satisfies our independent-repro Beta
gate and we credit every reproducer. If you work in T&S/safety eng and want a
high-signal first contribution, that's the one: https://github.com/digitalharm/fight-csam
```

---

## 7. "First reply when a maintainer responds" snippet

For when an ally / institution / maintainer replies to any of the above. Goal:
**be fast, be useful, ask for the smallest correct next step, never push for the
logo/endorsement.** Three variants by response type.

### 7a. They corrected our directory entry / characterization

```
Thank you — fixing it now. I'd rather have it right than flattering. I've updated
the entry to <restate their correction>; here's the diff: <link>. If that still
isn't how you'd put it, send a wording and I'll use yours verbatim. And if you ever
want it removed entirely, the offer stands.
```

### 7b. They're interested / open to talking

```
Appreciate you taking a look. The smallest useful next step is probably a 20-minute
call — I'd want to (a) sanity-check that we're characterizing <their tool/program>
accurately, and (b) hear whether the way we gate the credentialed pieces matches
how you'd expect it done. No deck, no ask; I'll come with working code and
questions. Here's my availability: <link/options>. If async is easier, I'm happy to
just answer questions over email.

(One thing I'll keep off the table until you raise it: I won't use your name, logo,
or the word "partner" anywhere without your explicit written okay.)
```

### 7c. They asked the hard/skeptical question (conformance, false positives, gating)

```
Fair question — this is the part that has to be right. <Direct, specific answer.>

- On conformance: hashkit is tested byte-for-byte against Meta's PDQ reference with
  a CI drift-gate; the vectors are synthetic and reproducible — here's the one
  command to verify it yourself: <link to CONFORMANCE.md>.
- On false positives / harm: a match routes to human review and never auto-reports;
  the statutory submit path stays blocked behind NCMEC-ESP credentials and counsel
  sign-off, by design.
- On "compliance": we don't claim it — it helps an operator take documented,
  defensible steps, and we say plainly that known-hash matching misses self-
  generated and novel material.

If any of that doesn't hold up under your scrutiny, I want to know — tell me where
it's weak and I'll fix it or document the limitation honestly.
```

### 7d. They declined / want out

```
Understood, and thanks for the quick reply — I'll <remove the entry / not follow
up>. I've logged it so we don't reach out again. If anything changes on your end,
you know where to find me; otherwise I'll leave you to it. Appreciate the work you
do.
```

---

## Sender's pre-flight checklist (run before any send)

- [ ] Is v0.1 published and does the relevant `install → quickstart` resolve from
      a clean machine? If not, **stop.**
- [ ] Is the recipient on the allowed list (24 "use" allies + curated "learn-from"),
      and NOT on the do-not-contact list (13 out-of-scope + 41 reference-only +
      Big-Tech in-house T&S)?
- [ ] Is this individually written and individually true — not a templated blast?
- [ ] ≤5 outreach touches this week? Logged in the gitignored outreach ledger
      (who / when / channel / response / opt-out)?
- [ ] Zero instances of "compliant," "beats/better than Meta/PDQ," "turnkey," or
      implied endorsement?
- [ ] Counsel disclaimer + "known-hash-isn't-enough" caveat present wherever a
      legal duty is mentioned?
- [ ] "No hash list, ever" stated wherever matching/lists come up?
- [ ] Opt-out line present and unmissable (for §1 and §6 venue posts)?
- [ ] For Show HN / dev posts: are all three launch-gate conditions true
      (install + golden path + named reference logo with written sign-off)?
