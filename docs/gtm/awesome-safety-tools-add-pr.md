# PREPPED PR — add FightCSAM tools to roostorg/awesome-safety-tools

> **Status: PREPPED — DO NOT SUBMIT YET.** This adds our own tools (an *ask*), so it is hard-gated. Submit only when ALL are true:
>
> 1. ✅ **v0.1 packages published** and every install verified from a clean machine (`pip install` / `cargo add` / `npm i` / `go get` all resolve). — *blocked on the 3 registry tokens; see [publish-tokens.md](../ops/publish-tokens.md).*
> 2. ✅ **The link-fix PR [#65](https://github.com/roostorg/awesome-safety-tools/pull/65) is acknowledged or merged** — lead with the gift, then the ask (sequencing).
> 3. ✅ Re-check the target sections still exist (the README moves).
>
> A broken install on a CSAM tool, or an "add me" that lands before the gift, is exactly the reputational own-goal the GTM plan forbids. This file is the ready-to-fire package for the moment those gates clear.

## Scope of the first add (curated, not all 11)

They list tools granularly by function. A first add should be modest + high-signal — **3 flagship tools in 2 existing categories**, each linking to its docs page (install + usage). The rest of the toolkit is listed at the bottom as optional later additions once we're a known contributor.

## Entries (match their `* [Name by Org](url)` + sub-bullet format; place alphabetically within each section)

### Into `## Hash Matching`
```
* [csam-shield by FightCSAM](https://fightcsam.org/docs/csam-shield)
  * drop-in CSAM-detection middleware for upload pipelines; wraps hash-matchers/classifiers, bring-your-own credentialed hash list
* [hashkit by FightCSAM](https://fightcsam.org/docs/hashkit)
  * Rust/WASM perceptual hashing (PDQ), conformance-tested against Meta's reference vectors; pairs with hashkit-match for matching
```

### Into `## AI for Safety`
```
* [promptshield by FightCSAM](https://fightcsam.org/docs/promptshield)
  * input filter that blocks CSAM-generation intent in AI image pipelines
```

## PR title
`Add FightCSAM tools: hashkit, csam-shield, promptshield`

## PR body

> Hi again — I opened #65 earlier with some link fixes; separately, this proposes adding a few tools.
>
> **FightCSAM** (by The Digital Harm Project) is an open-source toolkit for detecting, reporting, and preventing CSAM, built on the ecosystem this list maps — Meta's PDQ is upstream of our hashing and our conformance source, and we credit ROOST, Thorn, and others throughout. Everything is Apache-2.0, and we ship **no hash lists** (operators bring their own credentialed NCMEC/IWF list).
>
> Proposing three tools that fit existing categories:
>
> **Hash Matching**
> - **hashkit** — Rust/WASM perceptual hashing (PDQ), conformance-tested against Meta's reference vectors
> - **csam-shield** — drop-in CSAM-detection middleware for upload pipelines (wraps hash-matchers/classifiers; bring-your-own hash list)
>
> **AI for Safety**
> - **promptshield** — input filter that blocks CSAM-generation intent in AI image pipelines
>
> Each links to its docs (install + usage). Happy to adjust categories, wording, or trim. There are a few more tools in the toolkit (NCMEC reporting, C2PA provenance, evidence retention, dataset screening) I've deliberately left out of this first PR — glad to add any you think fit. Thanks for the list, and for considering.

## Optional later additions (once established; map to their categories)
| Tool | Their category | One-liner |
|---|---|---|
| hashkit-match | Hash Matching | fast local matching against a hash set (cdylib) |
| detectkit-test | Datasets | synthetic fixtures to test CSAM pipelines without real material |
| hashstream | Investigation | ThreatExchange-style hash signal sharing |
| c2pa-lite | (no exact fit — propose "Provenance" or Core Infrastructure) | lightweight C2PA content-provenance signing |
| trainguard | Privacy Protection | training-data screener (wraps Presidio for PII) |
| safemod | User Safety Tools | privacy-preserving moderation primitives |
| cybertip-cli | Investigation | NCMEC CyberTipline reporting client (credential-gated) |
| evidencevault | Core Infrastructure | defensible evidence retention (counsel-gated) |

## To submit (after the gates clear)
The fork already exists from #65 (`opencolin/awesome-safety-tools`). Then:
```
git -C <fork> fetch upstream && git -C <fork> checkout -b add-fightcsam upstream/main
# apply the entries above to README.md (alphabetical within each section)
git -C <fork> commit -am "Add FightCSAM tools: hashkit, csam-shield, promptshield"
git -C <fork> push -u origin add-fightcsam
gh pr create --repo roostorg/awesome-safety-tools --base main --head opencolin:add-fightcsam --title "<title>" --body-file <body>
```
Or tell me and I'll fork/branch/open it (once the gates are green).
