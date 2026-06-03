Now I'll produce the decision record. My verification settles the one real split (Go tags) decisively: there is no root `go.mod`, so a bare `v0.1.0` tag physically cannot publish either submodule — the single-shared-tag option (brand, eng) is not just suboptimal, it is **broken** for this layout. Per-module tags (adoption, pmo) win on a correctness basis, not a preference one.

---

## Decision: package naming

**Scheme: `scope-where-possible`** — use each registry's native namespace where one exists (npm scope, Go module path), and apply a `digitalharm-` prefix **only on the two flat registries (crates.io, PyPI) and only where a name collides.** All four PMs converged on this independently; it is ratified. The two existing collisions are renamed; the nine clean names ship as-is.

Why not the alternatives: `namespace-all-consistently` (prefix all 11) would rename nine already-dry-run-green, already-cross-referenced packages for zero collision benefit, lengthen the install string that is the GTM conversion surface, and still not produce real cross-ecosystem uniformity (`@digitalharm/x` vs `digitalharm-x`). `fix-only-collisions` produces the same two renames today but states no durable rule, so the *next* crates.io/PyPI package re-litigates it. `scope-where-possible` is the principled form of "fix the two collisions": same minimal diff now, plus a written policy (below) for every future package.

**Policy of record (put in CONTRIBUTING + runbook):** every new **crates.io** and **PyPI** publish uses the `digitalharm-` prefix on the *published/dist name* by default (keeping the Rust `[lib] name` / Python import package short); every new **npm** package uses the `@digitalharm` scope; every **Go** module uses the `github.com/digitalharm/...` path. New names get an availability check before tagging.

### Final published names — all 11 packages

| # | Package (on-disk dir) | Registry | Current name | **Final published name** | Change? |
|---|---|---|---|---|---|
| 1 | `packages/hashkit` | crates.io | `hashkit` | **`digitalharm-hashkit`** | ✅ RENAME (collision) |
| 2 | `packages/hashkit-match` | crates.io | `hashkit-match` | `hashkit-match` | — (but dep pin repoints, see below) |
| 3 | `packages/c2pa-lite` | crates.io | `c2pa-lite` | `c2pa-lite` | — |
| 4 | `packages/safemod` | crates.io | `safemod` | `safemod` | — |
| 5 | `packages/detectkit-test` | PyPI | `detectkit-test` | `detectkit-test` | — |
| 6 | `packages/promptshield` | PyPI | `promptshield` | **`digitalharm-promptshield`** (dist name only) | ✅ RENAME (collision) |
| 7 | `packages/trainguard` | PyPI | `trainguard` | `trainguard` | — |
| 8 | `packages/csam-shield/python` | PyPI | `csam-shield` | `csam-shield` | — |
| 9 | `packages/cybertip-cli/python` | PyPI | `cybertip-cli` | `cybertip-cli` | — |
| 10a | `packages/csam-shield/node` | npm | `@digitalharm/csam-shield` | `@digitalharm/csam-shield` | — |
| 10b | `packages/cybertip-cli/node` | npm | `@digitalharm/cybertip-cli` | `@digitalharm/cybertip-cli` | — |
| 10c | `packages/hashstream/sdk-ts` | npm | `@digitalharm/hashstream-sdk` | `@digitalharm/hashstream-sdk` | — |
| 11a | `packages/hashstream` | Go | `github.com/digitalharm/fight-csam/packages/hashstream` | *(unchanged path)* | — |
| 11b | `packages/evidencevault` | Go | `github.com/digitalharm/fight-csam/packages/evidencevault` | *(unchanged path)* | — |

*(11 packages; npm and Go each surface multiple modules, hence 14 registry rows.)*

**Collision resolution — concrete and permanent:**

- **`hashkit` → `digitalharm-hashkit` (crates.io).** The bare `hashkit` is a **real namesake**, not a squat: user `santhsecurity`, v0.1.0, ~14k downloads, repo `github.com/santhsecurity/hashkit`, updated 2026-04-09. It is **in use**, so crates.io will not let us take it and a CSAM-safety org will not RTC-dispute a common-noun crate. The rename is **permanent and non-negotiable**; do not bet the launch on acquiring the bare name. **Import path is preserved** (zero `.rs` edits) by setting `[lib] name = "hashkit"` and aliasing the dep via `package = "digitalharm-hashkit"` — `use hashkit::pdq::PdqHash;` in `hashkit-match/src/lib.rs:29` stays as-is. Adopters type `cargo add digitalharm-hashkit`; never document `cargo add hashkit` (it resolves to the unrelated crate).

- **`promptshield` → `digitalharm-promptshield` (PyPI, dist name only).** Bare `promptshield` is a **confirmed empty squat** ("An empty PyPI package," author "Your Name," one 2024 upload) — but squat or not, on PyPI a taken name is taken, so we rename rather than contest. **Import name and CLI stay `promptshield`** (driven by `src/promptshield/` and `[project.scripts]`), so `from promptshield import guard` and the `promptshield` console script are unchanged (zero `.py` edits). Adopters run `pip install digitalharm-promptshield` then `import promptshield` (the well-trodden bs4 pattern — document both lines).

> **Do NOT** rename `detectkit-test → detectkit` (PyPI `detectkit` is a taken anomaly-detection lib). The `-test` suffix is load-bearing; keep it.

---

## Decision: versioning

**Synchronized single `0.1.0` for the launch, then independent per-package semver.** Ship every package at `0.1.0` once so the launch story ("the fight-csam portfolio at 0.1.0") is coherent and cross-package docs pin one number; **after 0.1.0, each package versions on its own CHANGELOG** because these tools mature at structurally different rates (the hashkit-rooted dependency tree vs. counsel-gated `cybertip-cli`/`evidencevault`), and lockstep would either hold mature packages back or inflate untouched ones. While pre-1.0, treat `0.x` minor bumps as the place breaking changes are allowed. The one hard coupling: `digitalharm-hashkit` must publish/bump **before** `hashkit-match`, whose dep pin tracks it.

---

## Decision: Go tags

**Per-module tags from the very first release: `packages/hashstream/v0.1.0` and `packages/evidencevault/v0.1.0`. NOT a single shared `v0.1.0`.**

This is the one place the council split (brand + eng favored a single shared `v0.1.0` for launch; adoption + pmo favored per-module). **I am ruling per-module, and the basis is correctness, not preference.** I verified there is **no `go.mod` at the repo root** — only `packages/hashstream/go.mod` and `packages/evidencevault/go.mod` exist. For a module whose path ends in `/packages/hashstream`, the Go toolchain **only** recognizes the version tag `packages/hashstream/v0.1.0`. A bare `v0.1.0` at the root resolves to a root module that does not exist, so it will **silently fail to publish either submodule** to `go get`/pkg.go.dev. The "single shared tag is supported" caveat in the runbook (lines 117-120) and the bare-`v0.1.0` commands in the runbook (lines 102-105) and CI (`release.yml` lines 140-146) are **wrong for this layout** and must be fixed. Per-module tags also match the post-0.1.0 independent-versioning decision and avoid a forced misleading bump when the two modules diverge (hashstream on the credentialed-infra track, evidencevault counsel-gated). For the launch, push **both** tags together so 0.1.0 is synchronized.

---

## Implementation steps

Do this on a branch/worktree, in order. Total source impact: **2 line edits in Cargo.toml + 1 in pyproject.toml + 1 lib-name add**, plus CI/runbook/doc fixes. **Zero `.rs` and zero `.py` edits.**

### Step 1 — Rust: rename the crate, preserve the import path

**`packages/hashkit/Cargo.toml`** — change the package name and pin the lib name so `use hashkit::…` keeps working:
```toml
[package]
name = "digitalharm-hashkit"      # was: name = "hashkit"
# ...unchanged...

[lib]
name = "hashkit"                   # ADD this line — keeps the Rust crate identifier `hashkit`
crate-type = ["cdylib", "rlib"]
```

**`packages/hashkit-match/Cargo.toml`** — repoint the dep to the renamed crate while keeping the local alias `hashkit` (so `lib.rs` is untouched):
```toml
[dependencies]
hashkit = { package = "digitalharm-hashkit", path = "../hashkit", version = "0.1.0" }
# was: hashkit = { path = "../hashkit", version = "0.1.0" }
```

> `c2pa-lite`, `safemod` Cargo.toml: **no change** (verified neither depends on hashkit).

### Step 2 — Python: rename the dist name only

**`packages/promptshield/pyproject.toml`**:
```toml
[project]
name = "digitalharm-promptshield"   # was: name = "promptshield"
```
Leave **unchanged**: `[tool.hatch.build.targets.wheel] packages = ["src/promptshield"]`, the `src/promptshield/` directory, and `[project.scripts] promptshield = "promptshield.cli:main"`. (Verified imports `from promptshield import …` in tests/src are dir-driven and unaffected.)

> Other four Python pyproject.toml: **no change**.

### Step 3 — CI release workflow (`.github/workflows/release.yml`)

1. **Rust publish order (line 48):** change `ORDER="hashkit hashkit-match c2pa-lite safemod"` →
   `ORDER="digitalharm-hashkit hashkit-match c2pa-lite safemod"` (the `cargo package/publish -p "$c"` selector keys off the *package* name, which is now `digitalharm-hashkit`).
2. **Python matrix (lines 70-75):** change `- promptshield` → `- promptshield` stays as the **directory** path is what `working-directory: packages/${{ matrix.package }}` uses — and the dir is still `packages/promptshield`. **No change needed here** (the matrix value is the on-disk path, not the dist name). Leave it.
3. **Go warm-up (lines 140-146):** replace the bare-tag loop with per-module tags. Change the body to request each module at its **own** prefixed tag, e.g.:
   ```bash
   for m in hashstream evidencevault; do
     GOPROXY=https://proxy.golang.org go list -m \
       "github.com/digitalharm/fight-csam/packages/$m@packages/$m/v0.1.0" || true
   done
   ```
   (Or drive it off the pushed tag names directly. The point: the version suffix must be `packages/<m>/vX.Y.Z`, never bare `vX.Y.Z`.)

### Step 4 — Runbook (`docs/ops/release-runbook.md`)

- §C Option 2 (lines 82-83): `cargo publish -p hashkit` → `cargo publish -p digitalharm-hashkit`.
- §C Python loop (line 90): the dir `promptshield` is correct; add a note that the **published name** is `digitalharm-promptshield`.
- §C/§D Go (lines 99-106, 113-120): replace every bare `…/hashstream@v0.1.0` / `…/evidencevault@v0.1.0` with the per-module tag form `…/hashstream@packages/hashstream/v0.1.0` etc., and replace the "single shared tag is fine" caveat with the **per-module-tag mandate** (no root go.mod ⇒ bare tag does not resolve).
- §C Option 1 step 3 (lines 73-76): replace `git tag v0.1.0 && git push origin v0.1.0` with pushing **both** module tags:
  ```
  git tag packages/hashstream/v0.1.0
  git tag packages/evidencevault/v0.1.0
  git push origin packages/hashstream/v0.1.0 packages/evidencevault/v0.1.0
  ```
  *(Note: this changes what triggers the workflow — see "Owner" item below; the `on: push: tags: ["v*"]` filter must also match these tags.)*
- §A1 table: record the final names `digitalharm-hashkit` / `digitalharm-promptshield` as **decided** (no longer "e.g.").

### Step 5 — CI tag trigger (`.github/workflows/release.yml` lines 17-20)

The current trigger is `tags: ["v*"]`. The per-module tags `packages/hashstream/v0.1.0` do **not** match `v*`. Add them:
```yaml
on:
  push:
    tags:
      - "v*"                       # Rust/Python/npm coordinated release tag
      - "packages/*/v*"            # Go per-module tags
```
**Decision:** keep a coordinated **`v0.1.0`** tag as the trigger for the Rust/Python/npm jobs (those registries want one atomic release event), AND push the two **`packages/<m>/v0.1.0`** tags for Go. Gate the Go warm-up job on the `packages/*/v*` tags; gate Rust/Python/npm on `v*`. (Simplest: push all three tags in the same `git push`.)

### Step 6 — Doc/site install strings (gate on these matching published names)

- **`docs/tools/promptshield.md:25`** and **`packages/promptshield/README.md:25`**: `pip install promptshield` → show **both** lines: `pip install digitalharm-promptshield` then `import promptshield`.
- **`docs/gtm/adoption-strategy.md`** lines 98-99: these are illustrating the *pre-publish failure* state, but update the post-publish guidance/checklist to use `cargo add digitalharm-hashkit` and the dist name `digitalharm-promptshield`; never present a bare `cargo add hashkit` as the success path.
- **Website (separate repo `digitalharm/addiction-research`, `/Users/colin/Code/addiction/app/tools/page.tsx`)** — three wrong strings, all must be fixed before/at launch:
  - line 47: `npm install @digitalharm/hashkit` → **`cargo add digitalharm-hashkit`** (wrong ecosystem *and* name — hashkit is a Rust crate).
  - line 100: `pip install promptshield` → **`pip install digitalharm-promptshield`**.
  - line 130: `go install github.com/digitalharm/fight-csam/hashstream` → **`go get github.com/digitalharm/fight-csam/packages/hashstream`** (missing `/packages/`; `go get` not `go install` for a library).

### Step 7 — Re-prove the dry-run (before any tag)

```
cargo package -p digitalharm-hashkit      # confirm artifact name = digitalharm-hashkit-0.1.0.crate
cargo package -p hashkit-match            # confirm it resolves the renamed dep
cargo package -p c2pa-lite && cargo package -p safemod
cd packages/promptshield && rm -rf dist && python -m build && twine check dist/*   # artifact = digitalharm_promptshield-0.1.0
# (npm + Go unchanged; re-run npm pack --dry-run for the 3 scoped pkgs as a smoke check)
```
**Gate:** the produced artifact filenames must read `digitalharm-hashkit` and `digitalharm_promptshield` before any publish. crates.io versions only yank (never delete) and PyPI/npm names are permanent — a wrong-name first publish is forever.

---

## Release plan to v2

Synchronized at 0.1.0; **per-package** from 0.2.0 onward. Versions below 1.0.0 are **portfolio themes** (gates a group crosses together); 1.0.0 and 2.0.0 are reached **per package**, not stamped on all 11 at once. A "ladder rung" badge in `docs/roadmap.md` carries the human-facing story while registries carry per-package truth.

| Version | Theme | Gate |
|---|---|---|
| **0.1.0** | Installable everywhere under final permanent names | A1 landed (digitalharm-hashkit + `[lib] name` + dep repoint; digitalharm-promptshield dist name) and **post-rename dry-run green**; A2 credentials provisioned + `@digitalharm` npm org owned; publish in dep order (digitalharm-hashkit → hashkit-match); both Go modules tagged `packages/<m>/v0.1.0`; one clean-machine install+quickstart verified per ecosystem. |
| **0.2.0** | Discoverable where intent already exists + trust moat public | Every package resolves on its index + docs.rs/pkg.go.dev; READMEs lead with the exact copy-paste install line under the final name; **conformance vectors published** (CONFORMANCE.md + machine-checkable file) once synthetic-corpus distribution is signed off; PR merged into `roostorg/awesome-safety-tools`; GitHub topics set (csam-detection, perceptual-hashing, pdq, trust-and-safety). No API promises yet. |
| **0.3.0** | Wave-1 foundation correct (the dependency root works) | `digitalharm-hashkit` PDQ port byte-identical to the facebook/ThreatExchange C++ reference on the corpus, CI fails-closed on corpus drift; `hashkit-match` matches naive linear ground truth and beats it at ≥10k hashes; `detectkit-test` deterministically generates the corpus. Unblocks the tree. |
| **0.4.0** | Drop-in adoption path proven | `csam-shield` wires ≥1 real detector end-to-end (PhotoDNA sandbox / Cloudflare free) with retry + circuit-breaker, shipped in a runnable example (Node+Python parity); `digitalharm-promptshield` Stage-1 ≥50 patterns/category + FP suite, ≥90% recall on a public adversarial set with documented variant-resistance. First deployable tools. |
| **0.5.0** | Credentialed/legal infra online in dev/test (credential-free demo paths) | `hashstream` operator hash-file ingestion + Ed25519 signed, versioned snapshots, self-hostable via Docker; `trainguard` LAION reader + file-backed provider + signed compliance report; `cybertip-cli` sandbox path with production blocked at the CLI; `evidencevault` HTTP API + disk persistence with noop-KMS; `c2pa-lite` real signing via c2pa-rs upstream. Explicitly **not** gated on NCMEC/ESP creds or counsel. Independent per-package versioning is fully in effect. |
| **0.9.0** | Beta hardening / API-freeze candidate | All non-legal-tier packages stable 90+ days, no breaking changes; semver promises begin; native↔WASM byte-identical reproducibility enforced in CI; MatchResponse schema ratified as owned by `hashkit-match`. |
| **1.0.0** *(per package, Foundation + Adoption first)* | Production-ready core (non-legal-tier) | Per package: public API frozen under a documented semver policy; conformance/property tests (not just smoke); ≥1 documented production-shaped example; third-party security review (Trail of Bits / Cure53 class) of the sensitive surfaces complete; reference-adopter logos. `safemod` likely first. **`cybertip-cli` + `evidencevault` remain pre-1.0** until counsel sign-off — they ship 1.0 on their own clock. |
| **2.0.0** | Legal-tier GA + first coordinated breaking-change wave + hardened platform | Outside counsel signs off the production submission/retention paths so `cybertip-cli` + `evidencevault` reach Stable with ≥1 consented real-world filing; Sigstore/cosign-signed artifacts across all packages; `hashkit-match` real MIH beats linear at ≥10k; cross-platform conformance matrix (macOS/Linux/Windows + WASM) with mandatory drift gates; any breaking API changes accumulated across 1.x batched into one coordinated 2.0 with a per-package migration guide. |

---

## Still blocked on the owner

**A2 — credentials (owner-only; this is the actual critical path, not naming):**
- **crates.io:** account + API token (scopes `publish-new`, `publish-update`) → `CARGO_REGISTRY_TOKEN` repo secret.
- **PyPI:** account + project; **prefer Trusted Publishing (OIDC)** so no long-lived secret lives in CI; otherwise `PYPI_API_TOKEN` repo secret.
- **npm:** **create and own the `@digitalharm` org** (the entire npm collision-proofness depends on it; if unclaimed, the three scoped packages cannot publish and a third party could register the scope) + automation token → `NPM_TOKEN`.
- **Go:** nothing — publishing is pushing the per-module tags.

**Publish-window risk (owner should act fast once A2 lands):** availability is not reservation. The still-free flat names (`trainguard`, `csam-shield`, `cybertip-cli` on PyPI; `hashkit-match`, `c2pa-lite`, `safemod`, and `digitalharm-hashkit`/`digitalharm-promptshield` on their registries) are squat-able every day they're unpublished. **Re-verify live availability of `digitalharm-hashkit` and `digitalharm-promptshield` at the publish minute** (the crates.io API was Cloudflare-blocked from the build environment, so the Rust availability rests on the runbook's prior check + the June-2026 re-verification), then publish all ecosystems in close succession.

**Brand judgments the owner may override (defaults are decided above; flagged because they're permanent and partly taste):**
1. **`digitalharm-` as the standing prefix vs. an alternative (`dh-`, `pdq-`).** Decided: `digitalharm-`, because it mirrors the `@digitalharm` npm scope and the Go org path (one coherent identity) and ad-hoc prefixes read as squat-dodging. Owner may pick a different prefix, but it must be chosen **now** — it's permanent.
2. **Whether to defensively reserve `digitalharm-*` placeholder holds for the nine non-colliding crates.io/PyPI names** (the brand PM's fallback). Decided **not** to, to keep the permanent surface minimal and the install strings clean — but if the owner weights typosquat-prevention for CSAM tooling higher, reserving `0.0.0` holds for `digitalharm-{trainguard,csam-shield,cybertip-cli,c2pa-lite,safemod,hashkit-match,detectkit-test}` is a defensible, reversible-direction add. Owner call.
3. **Synthetic-corpus distribution sign-off** gates the 0.2.0 trust-moat (publishing conformance vectors). Low-risk (synthetic only) but it's a content/safety judgment the owner should clear early so 0.2.0 isn't blocked by it.

**Files to edit (all absolute):** `/Users/colin/Code/fight-csam/packages/hashkit/Cargo.toml`, `/Users/colin/Code/fight-csam/packages/hashkit-match/Cargo.toml`, `/Users/colin/Code/fight-csam/packages/promptshield/pyproject.toml`, `/Users/colin/Code/fight-csam/.github/workflows/release.yml`, `/Users/colin/Code/fight-csam/docs/ops/release-runbook.md`, `/Users/colin/Code/fight-csam/docs/tools/promptshield.md`, `/Users/colin/Code/fight-csam/packages/promptshield/README.md`, `/Users/colin/Code/fight-csam/docs/gtm/adoption-strategy.md`, and (separate repo) `/Users/colin/Code/addiction/app/tools/page.tsx` (lines 47, 100, 130).