# What I need from you to publish the packages

The 11 tools are release-ready (0.1.0, metadata complete, dry-run passing, CI wired). **2 are already published** — the Go modules (`hashstream`, `evidencevault`) need no credentials and are live. The other **9 are blocked on registry tokens tied to your accounts**, which I can't create for you. This is a ~10-minute, one-time setup.

## Step 1 — create 3 tokens + 1 npm org

### crates.io (Rust: hashkit, hashkit-match, c2pa-lite, safemod)
1. Sign in at <https://crates.io> (with GitHub).
2. <https://crates.io/settings/tokens> → **New Token**.
3. Name `fight-csam release`; scopes: **publish-new** + **publish-update**.
4. Copy it (starts `cio…`). → this is `CARGO_REGISTRY_TOKEN`.

### PyPI (Python: detectkit-test, promptshield, trainguard, csam-shield, cybertip-cli)
1. Sign in at <https://pypi.org>.
2. <https://pypi.org/manage/account/token/> → **Add API token**.
3. Name `fight-csam release`; scope: **Entire account** — a project-scoped token *cannot do the first upload* of a brand-new project. (You can rotate to per-project tokens after the first publish.)
4. Copy it (starts `pypi-…`). → this is `PYPI_API_TOKEN`.

### npm (Node: @digitalharm/csam-shield, @digitalharm/cybertip-cli, @digitalharm/hashstream-sdk)
1. **Create the `@digitalharm` org first** — <https://www.npmjs.com/org/create> (free for public packages). *The scoped publish 404s if the org doesn't exist.*
2. <https://www.npmjs.com/settings/~/tokens> → **Generate New Token** → **Automation** (bypasses 2FA in CI) with publish rights to `@digitalharm`.
3. Copy it (starts `npm_…`). → this is `NPM_TOKEN`.

## Step 2 — hand them off (pick one)

**A. You set them as GitHub secrets** (tokens never touch the chat — most secure):
```bash
gh secret set CARGO_REGISTRY_TOKEN -R digitalharm/fight-csam
gh secret set PYPI_API_TOKEN       -R digitalharm/fight-csam
gh secret set NPM_TOKEN            -R digitalharm/fight-csam
```
Then tell me **"go"** — I push the `v0.1.0` tag, CI publishes crates → PyPI → npm in dependency order, and I watch the run + verify every `cargo add` / `pip install` / `npm i` resolves from a clean machine.

**B. Paste the 3 tokens to me** — I set the secrets and publish immediately. Revoke/rotate them right after the first publish if you like.

## What this unblocks
Publishing resolves the installs, which is the gate on the rest of the go-to-market: the **awesome-safety-tools PR**, registry backlinks (crates.io / PyPI / npm / pkg.go.dev each link back — SEO + GEO authority), and the ally/Meta outreach. Everything downstream in `docs/gtm/marketing-acquisition-plan.md` waits on this one step.

## Not tokens, but also yours (from the SEO/GEO strategy)
- **Google/Bing Search Console** — verify both `digitalharm.org` and `fightcsam.org`, submit the sitemaps (both now exist). This is how we measure + how the sitemaps get crawled fastest.
- **Optional GEO:** create a **Wikidata** item for "The Digital Harm Project" (label + description + `official website` P856 = digitalharm.org, plus the FightCSAM tools) — knowledge-graph presence that grounds Gemini/Google answers. Wikidata is more permissive than Wikipedia; a real project with a live site generally qualifies.
