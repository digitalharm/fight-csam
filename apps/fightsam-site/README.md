# FightCSAM — developer site (`apps/fightsam-site`)

The developer- and coding-agent-facing website for the **FightCSAM** open-source
CSAM-safety toolkit (the 11 packages in this monorepo). Built with
[Fumadocs](https://fumadocs.dev) (Next.js App Router + MDX) and configured for
**static export** (`output: 'export'`), so every page — and every agent
endpoint — is present in the initial HTML without running JS.

> Design doc: `../../docs/gtm/fightsam-site-design.md`.
> Release plan: `../../docs/ops/v2-release-plan.md`.
> Packages keep the `digitalharm` naming; **FightCSAM is the site brand only.**

## Develop

```bash
pnpm install   # pnpm 11 build-script allowlist is in pnpm-workspace.yaml (allowBuilds)
pnpm dev       # http://localhost:3000
pnpm build     # static export to ./out
```

If `pnpm install` reports `ERR_PNPM_IGNORED_BUILDS`, the `allowBuilds:` block in
`pnpm-workspace.yaml` is what permits `esbuild` / `sharp` / `unrs-resolver` to
run their (prebuilt-binary) install scripts.

## What's here (Phase 0–1)

| Path | Purpose |
| --- | --- |
| `content/docs/` | MDX docs — the 11 tools, categorized (detect / report / prevent / provenance / verify). |
| `src/app/(home)/` | Landing page. |
| `src/app/docs/` | Docs layout. |
| `src/app/llms.txt/`, `llms-full.txt/`, `llms.mdx/` | Coding-agent endpoints (curated index, full corpus, per-page raw Markdown). |
| `src/app/api/search/` | Static search (Orama). |
| `src/lib/shared.ts` | Site identity (`appName`, repo). |

## Roadmap

Phases per `docs/gtm/fightsam-site-design.md` and `docs/ops/v2-release-plan.md`:
**0** scaffold (done) · **1** agent baseline + manifest · **2** per-tool docs with
verified install strings · **3** golden path · **4** `create-fightcsam` CLI ·
**5** docs MCP server · **6** brand polish. Deploys to its own Vercel project on
**fightsam.org** (owner-provisioned).
