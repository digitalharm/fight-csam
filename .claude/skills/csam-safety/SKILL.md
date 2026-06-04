---
name: csam-safety
description: >-
  Implement CSAM (child sexual abuse material) detection, reporting, and
  prevention in an application using the FightCSAM open-source toolkit (11
  Apache-2.0 packages, published under the `digitalharm` name) plus the right
  best-in-class ecosystem tools. Use this whenever a developer is working on:
  handling or moderating user-uploaded images/video, a trust & safety or
  content-moderation pipeline, NCMEC/CyberTipline reporting or
  §2258A / UK OSA / TAKE IT DOWN / EU DSA compliance, perceptual hashing or
  hash-matching, AI image/video generation safety or prompt screening,
  Fediverse / Bluesky / AT-Proto moderation, content provenance (C2PA), or
  moderator wellbeing — even if they don't say "FightCSAM" or "CSAM" explicitly
  (e.g. "scan uploads for illegal content", "report abuse material to
  authorities", "stop my image model generating harmful content", "add
  moderation to my forum", "match images against a known-bad hash list"). It
  knows what each FightCSAM tool does, the exact verified install commands, which
  external tools to WRAP vs BUILD, and the hard legal/credential gates (ship no
  hash lists; honor the NCMEC-ESP-credential and outside-counsel gates) that
  must never be bypassed.
---

# CSAM safety: detect, report, prevent

This skill helps you wire **child-safety / CSAM protection** into an app using
**FightCSAM** — 11 small, composable, Apache-2.0 OSS tools (published under the
`digitalharm` name; "FightCSAM" is the umbrella brand) — together with the
best-in-class ecosystem tools you should *not* rebuild.

It exists because assembling a *compliance-defensible* CSAM pipeline is
genuinely hard: the law is specific (§2258A, UK OSA, TAKE IT DOWN, EU DSA), the
mistakes are costly (a false negative ships abuse; a false positive routes an
innocent person toward a criminal report), and the ecosystem is wide but
lopsided. The job here is to pick the *right* subset of tools for what the
developer is actually building, wire them correctly, and surface the hard gates
honestly instead of papering over them.

## The one principle that drives every decision

**Build the CSAM-specific detect → report → preserve core deep; wrap everything
else.** FightCSAM's genuine wedge is un-gated, self-hostable CSAM detection plus
statutory reporting/evidence — so reach for FightCSAM tools there. For rules
engines, PII, general classifiers, reviewer UIs, queues, and red-team harnesses,
the field already has better-resourced, well-maintained options — **recommend
those, don't reinvent them.** When you're unsure whether to build or wrap, wrap.

Two non-negotiable rules sit on top of this (full detail in
`references/compliance-and-gates.md` — read it before writing any reporting or
list-matching code):

1. **Ship NO hash lists.** These tools never bundle a CSAM hash list. The
   operator brings their own credentialed list (NCMEC / IWF / Project Arachnid).
   Never hardcode, fetch-and-commit, or "seed" a list. Match against an
   operator-supplied source only.
2. **Honor the credential and counsel gates — stub them visibly, never bypass.**
   Live NCMEC list sync and real CyberTipline submission require an **NCMEC ESP
   credential**; production reporting + evidence retention require **outside
   counsel sign-off**. If those aren't in place, keep the code on the sandbox /
   dry-run / unenforced path and say so in comments and output — do not fake a
   production submission.

## How to use this skill

### Step 1 — Figure out what they're building

Most requests map to one of four shapes. Identify the shape; it tells you which
tools matter.

- **"I host user content"** (forum, social app, marketplace, chat) → the core
  path: **detect** uploads + **report & preserve** matches.
- **"I build AI image/video"** (gen-AI startup, model host) → **prevent**
  (prompt + training screening) + **provenance**, plus detect on any stored
  output.
- **"I run a Fediverse / self-hosted server"** (Mastodon, Bluesky PDS, Matrix)
  → self-host detect + report; integrate with the platform's existing
  moderation (Ozone / hepa / Mjolnir).
- **"I just need one thing"** (e.g. "a PDQ hasher", "an NCMEC filer") → point
  them at the single tool and its quickstart.

If it's ambiguous, ask one clarifying question rather than guessing — the right
tool set differs a lot between these.

### Step 2 — Choose the tools

Walk the **golden path** (`references/golden-path.md`): an ordered
assess → detect → report → prevent → provenance → care → verify pipeline, with a
build-vs-wrap table telling you exactly which FightCSAM tool or external tool
fills each step for each shape above.

- For **FightCSAM tools** (what each does, the *verified* install command, when
  to use it, its current status/gate): read `references/fightsam-tools.md`.
  Always copy install commands from there — do not guess package names (several
  are scoped/renamed, e.g. the crate is `digitalharm-hashkit` but imports as
  `hashkit`; the Python dist is `digitalharm-promptshield` but imports as
  `promptshield`).
- For **external tools** (which to wrap, which are leaders to defer to, when to
  reach for each): read `references/ecosystem.md`. It carries a verdict per
  project — **Use** (integrate it), **Learn from** (a leader/alternative on an
  axis FightCSAM also covers), or **Reference** (a dataset/benchmark).

### Step 3 — Wire it, honoring the gates

Generate the install + integration code for the chosen tools. As you do:

- Use only the install/import strings from `references/fightsam-tools.md`.
- Put credentialed inputs behind `.env` (e.g. `NCMEC_*`, the hash-list source)
  and leave them unset with a clear comment — never inline a credential or list.
- Keep statutory reporting (`cybertip-cli`) on the **sandbox/dry-run** path and
  evidence retention (`evidencevault`) **unenforced** until the user confirms
  the NCMEC ESP credential and counsel sign-off are in place (see the gates ref).
- Note that the FightCSAM packages are **pre-release** (first registry publish
  pending) — if an install won't resolve yet, say so and offer the from-source
  path rather than pretending it's on the registry.

### Step 4 — Prove it works

End with `detectkit-test` — deterministic, synthetic, non-CSAM fixtures so the
developer can test the whole detect/report path in CI **without ever touching
real abuse material**. A CSAM pipeline you can't safely test is a liability;
this is how you make it CI-verifiable.

## House rules (why they matter)

- **Accuracy over enthusiasm.** This is child-safety code; a confidently-wrong
  install string or a bypassed gate has real-world cost. When unsure, check the
  reference file or say you're unsure.
- **Don't oversell.** FightCSAM leads on un-gated CSAM detection + statutory
  report/preserve. It does **not** lead on raw perceptual-hashing quality (Meta
  PDQ is upstream and the conformance source) or general ML classification (it
  ships no model). Recommend the ecosystem leader when it's the better fit —
  that builds trust and ships safer software.
- **Respect the survivor-facing weight.** Frame everything as protecting
  children and supporting the humans who do this work; keep moderator-wellbeing
  (`safemod`) in scope for any flow with manual review.

## Reference files

- `references/golden-path.md` — the ordered pipeline + the build-vs-wrap table (read first).
- `references/fightsam-tools.md` — the 11 FightCSAM tools: purpose, verified install, when to use, status/gate.
- `references/ecosystem.md` — the top ecosystem tools with a Use / Learn-from / Reference verdict.
- `references/compliance-and-gates.md` — laws (§2258A / OSA / TAKE IT DOWN / DSA) mapped to tools, and the hard gates in full.

More on the FightCSAM tools, live: https://fightsam.com/docs · ecosystem analysis: https://fightsam.com/docs/ecosystem
