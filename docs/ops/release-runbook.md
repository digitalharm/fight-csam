# Release runbook — publishing fight-csam at 0.1.0

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

### A1. Name collisions — ✅ RESOLVED (council decision 2026-06; owner-approved)
The two collisions are renamed and implemented on branch `release/rename-0.1.0`
(post-rename dry-run green; both new names verified free, HTTP 404). Decision
record: `docs/ops/release-decision-2026-06.md`.

| Package | Registry | Final published name | Status |
|---|---|---|---|
| ~~hashkit~~ → **`digitalharm-hashkit`** | crates.io | `digitalharm-hashkit` (with `[lib] name = "hashkit"`, so `use hashkit::…` is unchanged; dep pin in hashkit-match aliases it) | ✅ done |
| ~~promptshield~~ → **`digitalharm-promptshield`** | PyPI | `digitalharm-promptshield` (dist name only; import stays `promptshield`) | ✅ done |
| hashkit-match, c2pa-lite, safemod | crates.io | unchanged | ✅ available |
| detectkit-test, trainguard, csam-shield, cybertip-cli | PyPI | unchanged | ✅ available |
| @digitalharm/csam-shield, /cybertip-cli, /hashstream-sdk | npm | unchanged | ✅ available — but owner must **own the `@digitalharm` npm org** (A2) |

**Policy of record (CONTRIBUTING):** every new crates.io / PyPI publish uses the
`digitalharm-` prefix on the *published/dist* name by default; npm uses the
`@digitalharm` scope; Go uses the `github.com/digitalharm/...` path. Check
availability before tagging.

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
- **Go:** no *token*, BUT the **repository must be public.** The per-module tags
  `packages/hashstream/v0.1.0` and `packages/evidencevault/v0.1.0` are **already
  pushed** (done). However, `github.com/digitalharm/fight-csam` is currently
  **private** (anonymous fetch → 404/401), so `proxy.golang.org` and any
  `go get` from a third party cannot resolve the modules. **Action: make the
  repo public** (or set `GOPRIVATE` for internal-only use, which defeats the
  point of an OSS launch). The moment the repo is public, the already-pushed
  tags make both modules installable with no further step — verify with:
  `GOPROXY=https://proxy.golang.org go list -m github.com/digitalharm/fight-csam/packages/hashstream@v0.1.0`.

### A3. Repository visibility (NEW finding — gates Go *and* the whole OSS launch)
`digitalharm/fight-csam` is **private**. Beyond blocking Go module
resolution (above), an OSS portfolio whose source can't be read undercuts the
entire adoption thesis (auditability is a core selling point). Making the repo
public is an owner decision (confirm no secrets/CSAM/hash-lists are in history
first — the safety-guard CI already enforces this on new commits, but do a
history scan before flipping visibility).

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
3. Tag and push — the coordinated `v0.1.0` (drives Rust/Python/npm) PLUS the two
   per-module Go tags (a bare `v0.1.0` does NOT publish the Go modules — no root
   go.mod; see §D):
   ```
   git tag v0.1.0
   git tag packages/hashstream/v0.1.0
   git tag packages/evidencevault/v0.1.0
   git push origin v0.1.0 packages/hashstream/v0.1.0 packages/evidencevault/v0.1.0
   ```
4. The tagged run publishes Rust (in dependency order, digitalharm-hashkit first)
   → Python → npm, and warms the Go proxy for both modules.

### Option 2 — locally (if you must)
Order matters; **Rust dependency order is the only hard constraint** (hashkit before hashkit-match):
```
# Rust — digitalharm-hashkit FIRST (others depend on it being on the index)
cargo publish -p digitalharm-hashkit   # the renamed crate; -p keys off the package name
sleep 30                               # let the index update so the dep resolves
cargo publish -p hashkit-match
cargo publish -p c2pa-lite
cargo publish -p safemod

# Python — order-independent (no inter-package deps). Note promptshield's dir is
# still `packages/promptshield`; its PUBLISHED dist name is digitalharm-promptshield.
for p in detectkit-test promptshield trainguard csam-shield/python cybertip-cli/python; do
  ( cd packages/$p && rm -rf dist && python -m build && twine upload dist/* )
done

# npm — order-independent
for p in csam-shield/node cybertip-cli/node hashstream/sdk-ts; do
  ( cd packages/$p && npm install && npx tsc && npm publish --access public )
done

# Go — publish = push the PER-MODULE tags (a bare v0.1.0 publishes neither; see §D)
git tag packages/hashstream/v0.1.0
git tag packages/evidencevault/v0.1.0
git push origin packages/hashstream/v0.1.0 packages/evidencevault/v0.1.0
# then nudge the proxy so pkg.go.dev indexes promptly:
GOPROXY=https://proxy.golang.org go list -m \
  github.com/digitalharm/fight-csam/packages/hashstream@packages/hashstream/v0.1.0
GOPROXY=https://proxy.golang.org go list -m \
  github.com/digitalharm/fight-csam/packages/evidencevault@packages/evidencevault/v0.1.0
```

---

## D. Go module note — per-module tags are MANDATORY (corrected)
The two Go modules declare module paths ending in `/packages/hashstream` and
`/packages/evidencevault`, and **there is no `go.mod` at the repo root.** For a
module whose path ends in `/packages/<m>`, the Go toolchain ONLY recognizes the
version tag **`packages/<m>/vX.Y.Z`**. A bare `v0.1.0` tag resolves to a root
module that does not exist, so it **silently publishes neither module** to
`go get` / pkg.go.dev.

Therefore, publish with per-module tags:
```
git tag packages/hashstream/v0.1.0
git tag packages/evidencevault/v0.1.0
git push origin packages/hashstream/v0.1.0 packages/evidencevault/v0.1.0
```
Then `go get github.com/digitalharm/fight-csam/packages/hashstream@packages/hashstream/v0.1.0`
works. For the launch, push both module tags together so 0.1.0 stays
synchronized; post-0.1.0 they version independently (per the council decision).

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
go list -m github.com/digitalharm/fight-csam/packages/hashstream@v0.1.0
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
