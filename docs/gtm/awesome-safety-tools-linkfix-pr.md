# PREPPED PR — link fixes for roostorg/awesome-safety-tools

> **Status: ready to submit — not yet opened.** This is a value-first contribution to ROOST's `awesome-safety-tools` (our directory is derived from it). Opening it is our first contact with ROOST, so it's staged for review first. It is a **pure gift** — it does **not** add FightCSAM to the list (that's a separate PR, gated on v0.1 publish per the GTM plan).
>
> Found via a link check of all 117 project URLs in their README (2026-06): **7 moved + 4 dead**.

## PR title
`Fix stale links: 7 moved repos + flag 4 dead`

## PR body

> Hi — thanks for maintaining `awesome-safety-tools`; it's the reference map for this space, and I maintain an opinionated directory built on top of it. Running a link check across the list, I found 11 entries that have gone stale. This PR fixes the 7 that moved to new canonical URLs (all verified 200); I've listed 4 dead/gated ones separately for your call rather than guessing at replacements.
>
> **Moved — fixed in this PR:**
>
> | Entry | New URL |
> |---|---|
> | RocketChat CSAM | `https://github.com/c4osl/rocketchatcsam` |
> | RoGuard | `https://github.com/Roblox/RobloxGuard-1.0` |
> | Risk Atlas Nexus | `https://github.com/IBM/ai-atlas-nexus` |
> | Presidio | `https://github.com/data-privacy-stack/presidio` (spun out of Microsoft — you may want to drop "by Microsoft") |
> | Aya Red-teaming | `https://huggingface.co/datasets/CohereLabs/aya_redteaming` |
> | XSTest | `https://github.com/paul-rottger/xstest` |
> | FediCheck | `https://about.iftas.org/trust-safety-services/iftas-community-library/` (IFTAS wound down its T&S services in 2025; the FediCheck page is archived — you may want to mark it discontinued) |
>
> **Dead / gated — flagging for your decision (not changed here):**
> - **HiroKachi Jailbreak Dataset** → `sizu.me/love` returns 404, no replacement found (suggest removing).
> - **Red Team Resistance Leaderboard** → the HaizeLabs HF space returns 401/gone (suggest removing, or pointing to the HaizeLabs org).
> - **HackAPrompt Jailbreak Dataset** → the deep `.../viewer/default/train?p=1&row=137` link 401s; the dataset root works: `https://huggingface.co/datasets/hackaprompt/hackaprompt-dataset`.
> - **Google Content Safety API (via Coop)** → `roostorg.github.io/coop/SIGNALS.html#content-safety-api-by-google` 404s (anchor renamed?) — internal to your Coop docs.
>
> Happy to split, adjust, or drop any of these. Thanks for the list.

## Exact README edits (7 find → replace)

| Line | Find | Replace |
|---|---|---|
| 28 | `https://github.com/prostasia/rocketchatcsam` | `https://github.com/c4osl/rocketchatcsam` |
| 82 | `https://github.com/Roblox/RoGuard-1.0` | `https://github.com/Roblox/RobloxGuard-1.0` |
| 86 | `https://github.com/IBM/risk-atlas-nexus` | `https://github.com/IBM/ai-atlas-nexus` |
| 96 | `https://github.com/microsoft/presidio` | `https://github.com/data-privacy-stack/presidio` |
| 222 | `https://huggingface.co/datasets/CohereForAI/aya_redteaming` | `https://huggingface.co/datasets/CohereLabs/aya_redteaming` |
| 266 | `https://github.com/paul-rottger/exaggerated-safety` | `https://github.com/paul-rottger/xstest` |
| 274 | `https://connect.iftas.org/library/iftas-documentation/fedicheck/` | `https://about.iftas.org/trust-safety-services/iftas-community-library/` |

(The 4 dead links are left for the maintainers — flagged in the PR body, not auto-edited.)

## To open it
Either: fork `roostorg/awesome-safety-tools`, apply the 7 edits to `README.md`, and open the PR with the body above — or say the word and I'll fork, branch, and open it for your review before it's public.
