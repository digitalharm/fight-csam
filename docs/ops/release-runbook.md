# Release runbook — publishing digitalharm-oss at 0.1.0

**Status as of this writing:** all reversible prep is DONE. Every package is at
`0.1.0`, has complete publish metadata, and has been **dry-run packaged
successfully** (cargo package / npm pack / `python -m build` + `twine check` all
pass). What remains is the **irreversible publish**, which is gated on two
owner decisions/actions (§A). Do NOT run the publish commands until §A is cleared.

> **Why the pause:** publishing to a public registry is a one-way door —
> crates.io versions can only be *yanked*, never deleted; PyPI/npm names are
> permanent; and these are CSAM-tooling packages going out under a real org
> identity. An agent must not invent credentials or pick a permanent package
> name on the owner's behalf.

---

## A. BLOCKERS — must be resolved by the owner before publishing

### A1. Two package names are already taken
Verified live against each registry (404 = available, 200 = taken):

| Package | Registry | Status | Action needed |
|---|---|---|---|
| **hashkit** | crates.io | ❌ **TAKEN** (HTTP 200) | Rename (e.g. `digitalharm-hashkit`, `dh-hashkit`, `pdq-hashkit`) — and update the `hashkit-match` dependency pin to match. |
| **promptshield** | PyPI | ❌ **TAKEN** (HTTP 200) | Rename (e.g. `digitalharm-promptshield`) — PyPI dist name only; the import package can stay `promptshield` if desired. |
| hashkit-match, c2pa-lite, safemod | crates.io | ✅ available | — |
| detectkit-test, trainguard, csam-shield, cybertip-cli | PyPI | ✅ available | — |
| @digitalharm/csam-shield, /cybertip-cli, /hashstream-sdk | npm | ✅ available (scope is the safeguard) | Ensure the `@digitalharm` **npm org/scope exists** and the publishing account owns it. |

> **Recommendation:** the cleanest fix that avoids *all* future collisions is to
> scope/prefix the two clashing names with `digitalharm-` (Rust) and
> `digitalharm-` (PyPI dist name), matching the npm `@digitalharm` convention.
> This is an owner call because the published name is permanent and is what
> adopters will type. Once decided, it's a ~3-line change (the crate `name`, the
> dep pin, the pyproject `name`) + re-run the dry-run.

### A2. No publishing credentials are configured
None of these exist on the release machine (presence-checked; values never read):
`~/.cargo/credentials*`, `CARGO_REGISTRY_TOKEN`, `~/.pypirc`, `PYPI_API_TOKEN`,
`npm whoami` (not logged in), `NPM_TOKEN`.

The owner must provision, for whichever path is chosen:

- **crates.io:** create an account, generate an API token (scopes:
  `publish-new`, `publish-update`), then `export CARGO_REGISTRY_TOKEN=...` (local)
  or add it as the `CARGO_REGISTRY_TOKEN` **GitHub repo secret** (CI).
- **PyPI:** create an account + project, generate an API token. Prefer **Trusted
  Publishing** (OIDC, no long-lived secret) for the GitHub Actions path; otherwise
  add `PYPI_API_TOKEN` as a repo secret. Local: `~/.pypirc` or `TWINE_PASSWORD`.
- **npm:** the `@digitalharm` org must exist; generate an **automation token** with
  publish rights; add as `NPM_TOKEN` repo secret (CI) or `npm login` (local).
- **Go:** nothing — Go "publishes" by pushing a semver git tag (§D). No token.

---

## B. What's already done (the reversible 95%)

- ✅ All 11 packages bumped `0.0.1 → 0.1.0` (Rust workspace, 5 pyproject, 3 package.json), and the `hashkit-match → hashkit` dep pin bumped to `0.1.0`.
- ✅ Metadata complete: Rust crates have description/license/repository (workspace-inherited) + per-crate `readme`; Python has license/classifiers/urls/readme; npm has `publishConfig.access = public` (required for scoped packages), repository, files, license.
- ✅ **Dry-run proven publishable** (no upload): `cargo package` (4/4), `npm pack` (3/3, tsc clean), `python -m build` + `twine check` (5/5 PASSED).
- ✅ CI release workflow added: `.github/workflows/release.yml` — builds on every run, publishes only on a `v*` tag, in dependency order; `workflow_dispatch` runs build-only as a safe dry-run.

---

## C. The publish sequence (run ONLY after §A is clear)

Two ways to execute. **CI is recommended** (clean room, no creds on a laptop).

### Option 1 — via CI (recommended)
1. Land the rename (§A1) + add the three repo secrets (§A2) on `main`.
2. Dry-run first: Actions → **Release** → *Run workflow* → `dry_run: true`. Confirm all build jobs green.
3. Tag and push:
   ```
   git tag v0.1.0
   git push origin v0.1.0
   ```
4. The tagged run publishes Rust (in order) → Python → npm, and warms the Go proxy.

### Option 2 — locally (if you must)
Order matters; **Rust dependency order is the only hard constraint** (hashkit before hashkit-match):
```
# Rust — hashkit FIRST (others depend on it being on the index)
cargo publish -p hashkit            # or the renamed crate
sleep 30                            # let the index update
cargo publish -p hashkit-match
cargo publish -p c2pa-lite
cargo publish -p safemod

# Python — order-independent (no inter-package deps)
for p in detectkit-test promptshield trainguard csam-shield/python cybertip-cli/python; do
  ( cd packages/$p && rm -rf dist && python -m build && twine upload dist/* )
done

# npm — order-independent
for p in csam-shield/node cybertip-cli/node hashstream/sdk-ts; do
  ( cd packages/$p && npm install && npx tsc && npm publish --access public )
done

# Go — publish = push the tag (already done if you tagged in Option 1)
git tag v0.1.0 && git push origin v0.1.0
# then nudge the proxy so pkg.go.dev indexes promptly:
GOPROXY=https://proxy.golang.org go list -m \
  github.com/digitalharm/digitalharm-oss/packages/hashstream@v0.1.0
GOPROXY=https://proxy.golang.org go list -m \
  github.com/digitalharm/digitalharm-oss/packages/evidencevault@v0.1.0
```

---

## D. Go module note
The two Go modules already declare correct module paths
(`github.com/digitalharm/digitalharm-oss/packages/{hashstream,evidencevault}`).
They become installable the moment a `v0.1.0` **git tag** exists on the default
branch — there is no separate registry. `go get <module>@v0.1.0` works once the
tag is pushed; the proxy warm-up above just makes pkg.go.dev show docs sooner.

> Caveat: a multi-module monorepo with a single shared tag is supported by Go,
> but if the modules ever need *independent* versions, switch to per-module tags
> like `packages/hashstream/v0.1.0`. For a synchronized 0.1.0 the single `v0.1.0`
> tag is fine.

---

## E. Post-publish verification (do immediately after)
```
# Rust
cargo search hashkit-match           # appears on crates.io
# Python
pip index versions detectkit-test    # or: pip install detectkit-test==0.1.0
# npm
npm view @digitalharm/csam-shield version
# Go
go list -m github.com/digitalharm/digitalharm-oss/packages/hashstream@v0.1.0
```
Then update `docs/roadmap.md` + the website `/tools` page to link the published
package pages, and announce per `docs/gtm/adoption-strategy.md` (ROOST
`awesome-safety-tools` PR first).

---

## F. Honest scope reminder
Some packages have intentional integration seams that require a credential or
counsel sign-off to use in production (NCMEC/IWF hash access, CyberTip production
submit). Publishing 0.1.0 is still correct — they ship as "engine + documented
seam," and each README states what the adopter must bring. Do not let the gated
bits hold back the un-gated majority. (See `docs/ops/test-baseline-2026-05-31.md`
§"What finished means here.")

---
_Last updated at the 0.1.0 release-prep. All dry-runs green; blockers in §A are
the only thing between here and published._
