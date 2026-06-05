# Contributor funnel — FightCSAM

**The question this doc answers:** a solo, self-funded maintainer cannot run a
community program, so how do we make *one good contribution cheap to make and
cheap to review*, keep the dangerous surfaces fenced, and convert the best early
contributors into named co-maintainers (the top enterprise objection **and** a
funder discount)?

**The strategy in one line:** keep the **safe surfaces wide open** (conformance
reproduction, synthetic fixtures, docs, language bindings, thin adapters) and the
**gated surfaces fenced** (anything touching real lists, statutory submit, or
retention enforcement) *inside the contribution flow itself* — then recruit
narrowly and high-signal from self-selecting Trust & Safety venues, not generic
drive-bys.

This is the *operations* companion to the contributor-acquisition kit
([`CONTRIBUTING.md`](../../CONTRIBUTING.md), the issue/PR templates). It is internal
planning, not contributor-facing copy. It covers: the **label taxonomy**, a worked
set of **starter issues**, the **recognition model**, and **funnel metrics**.

Related: [`adoption-strategy.md`](adoption-strategy.md) (the user/adoption funnel —
this is the *contributor* funnel that feeds off it), [`docs/roadmap.md`](../roadmap.md)
(tool statuses + acceptance criteria, the source of most starter issues),
[`docs/safety-policy.md`](../safety-policy.md), and `GOVERNANCE.md` (the
never-PR-able invariants).

> **Hard gate carried into this funnel:** contributor enthusiasm never pulls a gated
> surface forward. The CSAM-intent red-team pack stays a v0.4 item; the legal tier
> (`cybertip-cli` real submit, `evidencevault` enforced retention) stays v2.0 and
> stays contributor-**closed**. No good-first-issue ever touches a real list, real
> imagery, a credential, or a statutory-submit path.

---

## 1. Label taxonomy

GitHub's 9 default labels stay; we add three axes so that (a) a newcomer can find a
safe, scoped task in one click, and (b) the legal/credentialed tier is *visibly*
fenced off from drive-by PRs. Every issue should carry **one `type:`**, usually
**one `area:`**, optionally **one `difficulty`/onboarding** label, and a
**`lang:`** label where the work is language-specific.

### Onboarding / difficulty (the on-ramp)

| Label | Color | Meaning |
|---|---|---|
| `good-first-issue` | `#7057ff` | Small, scoped, credential-free; has an acceptance test + a "why this is safe to work on" note. The funnel's front door. |
| `help-wanted` | `#008672` | Larger but still safe-by-construction; maintainer would welcome a contributor taking it. |
| `needs-triage` | `#ededed` | Auto-applied by templates; not yet reviewed by a maintainer. |

### `type:` (what kind of work)

| Label | Meaning |
|---|---|
| `type:bug` | Incorrect behavior in a buildable/published package. |
| `type:enhancement` | New behavior or an API addition within the 11-tool scope. |
| `type:conformance` | A hashkit PDQ / cross-binding discrepancy, or conformance-suite work. **(Flagship safe surface.)** |
| `type:docs` | READMEs, quickstarts, the agent-native surfaces, examples. |
| `type:design-proposal` | A scope/architecture change that needs alignment before code. |

### `area:` (which tool/surface)

One per tool plus the cross-cutting surfaces. These let a contributor from, say,
the AT-Proto community filter straight to relevant work.

`area:hashkit` · `area:hashkit-match` · `area:detectkit-test` · `area:csam-shield`
· `area:promptshield` · `area:hashstream` · `area:trainguard` · `area:cybertip-cli`
· `area:evidencevault` · `area:c2pa-lite` · `area:safemod`

Cross-cutting: `area:conformance` · `area:docs` · `area:connectors` (thin
adapters: atproto/hepa→Ozone, Osprey/Coop, python-threatexchange) ·
`area:agent-native` (`/llms.txt`, manifest, csam-safety Skill, docs-MCP) ·
`area:ci` (the build matrices + safety guard).

### `lang:` (toolchain) — task-scoping for the polyglot monorepo

| Label | Packages |
|---|---|
| `lang:rust` | hashkit, hashkit-match, c2pa-lite, safemod |
| `lang:python` | detectkit-test, promptshield, trainguard, csam-shield (python), cybertip-cli (python) |
| `lang:go` | hashstream, evidencevault |
| `lang:ts` | csam-shield (node), cybertip-cli (node), hashstream/sdk-ts |

### SAFETY-CRITICAL gate labels (the fence — these are *warnings*, not invitations)

These mark the legal/credentialed tier so that no one mistakes it for available
work. **An issue carrying any of these is NOT a `good-first-issue` and is, by
default, contributor-closed.**

| Label | Color | Meaning |
|---|---|---|
| `safety-sensitive` | `#b60205` | Touches a detection-correctness or safety-guard surface; maintainer review is mandatory, extra scrutiny applies. |
| `gated:credentialed` | `#b60205` | Blocked on a credential (NCMEC ESP / IWF / Arachnid). Cannot be completed by an external contributor; do not "finish" it. |
| `needs-counsel` | `#b60205` | Blocked on outside-counsel sign-off (the `cybertip-cli` / `evidencevault` production paths). Contributor-closed. |

> Rule of thumb for triage: if an issue would require a real list, a real
> credential, real imagery, or a live statutory endpoint to *complete*, it gets a
> red gate label and never gets `good-first-issue`. If it can be completed entirely
> with synthetic fixtures and public references, it is a candidate for the on-ramp.

---

## 2. Starter issues (hand-authored, credential-free)

The plan calls for **10–15 hand-authored good-first-issues** before any promotion,
each scoped to a credential-free surface, each with an **acceptance test** and a
**"why this is safe to work on"** note. Below is the worked backlog, derived
directly from the 11 tools + the roadmap's acceptance criteria. Each is safe by
construction (synthetic fixtures / public references only) and small enough for a
first contribution. The maintainer files these as real issues with the labels shown.

> Every issue below is explicitly **not** `gated:credentialed` / `needs-counsel`.
> None require a real list, real imagery, a credential, or a production endpoint.

### Conformance & fixtures (the flagship safe surface)

**1. Reproduce hashkit PDQ byte-for-byte on your OS/arch (conformance program).**
`area:conformance` · `lang:rust` · `good-first-issue` · `type:conformance`
Run the synthetic `vectors/v0/corpus.json` through `hashkit` on a platform/arch we
haven't recorded yet (Windows, Linux arm64, macOS x86_64, …) and report any drift.
*Acceptance:* a comment (or PR adding a results row) showing byte-identical hashes —
or a documented discrepancy with the vector id + platform. *Why safe:* synthetic
non-CSAM vectors only; you never touch a real list. *Why it matters:* this is the
**pinned tracking issue** and directly satisfies the roadmap's Beta gate
("independent reproduction of the WASM build by ≥1 external contributor on a
different OS"). **Reproducers are credited by name.**

**2. Add N synthetic fixture patterns to detectkit-test.**
`area:detectkit-test` · `lang:python` · `good-first-issue` · `type:enhancement`
The Alpha bar needs ≥5 deterministic patterns (`gradient-horizontal`,
`gradient-vertical`, `gradient-radial`, `checkerboard`, `structured-noise`).
Implement one not yet done, deterministically (same `(identifier, seed, pattern,
width, height)` → same PNG bytes). *Acceptance:* a test asserting byte-stability
across two runs; `verify` reports zero drift. *Why safe:* generates synthetic
non-CSAM images by construction — this package exists precisely so no one needs
real material.

**3. Cross-binding hash-equality test (Rust native vs WASM).**
`area:hashkit` · `lang:rust` · `help-wanted` · `type:conformance`
Add a test that builds `hashkit` for WASM (`wasm-pack`) and asserts byte-identical
output to the native build over the synthetic corpus. *Acceptance:* a CI-runnable
test that fails closed on drift. *Why safe:* synthetic vectors only.

### Algorithm packages (pure, testable, no I/O)

**4. hashkit-match: naive linear-scan ground-truth harness.**
`area:hashkit-match` · `lang:rust` · `good-first-issue` · `type:enhancement`
Before MIH is optimized it must match a naive linear scan. Add a brute-force
reference matcher and a property test comparing `query`/`query_all` against it on
randomized synthetic hash sets. *Acceptance:* the Alpha criterion — agreement with
naive ground truth on ≥100 randomized queries. *Why safe:* operates on random
synthetic 256-bit vectors; no list, no imagery.

**5. hashkit-match: collage / sticker-sheet false-positive guard test.**
`area:hashkit-match` · `lang:rust` · `help-wanted` · `type:enhancement`
The README promises false-positive guards for collages. Add synthetic test cases
(tiled/composited synthetic images via detectkit-test) that should *not* match.
*Acceptance:* tests demonstrating the guard suppresses collage false-positives.
*Why safe:* synthetic composites only.

**6. promptshield: expand the Stage-1 conjunction-principle eval set.**
`area:promptshield` · `lang:python` · `good-first-issue` · `type:enhancement`
Stage 1 flags a prompt only when a `minor-indicator` **and** a `sexual-context`
signal co-occur. Add benign-but-tricky cases (each signal alone → not flagged) and
obvious-intent cases (both → flagged), incl. NFKC/leetspeak variants. *Acceptance:*
new `tests/test_eval_suite.py` cases pass and the conjunction principle holds.
*Why safe:* you write *non-graphic* text fixtures that exercise the matcher; keep
descriptions clinical per the Code of Conduct. **No model, no imagery.**

**7. trainguard: WebDataset / LAION-format reader (against synthetic input).**
`area:trainguard` · `lang:python` · `help-wanted` · `type:enhancement`
The readers are scaffold stubs. Implement one against a tiny **synthetic** dataset
fixture and feed it to `scan_dataset()` with an `InMemoryHashListProvider`.
*Acceptance:* `scan_dataset()` returns a `ComplianceReport` with correct
chain-of-custody fields over the synthetic set. *Why safe:* `InMemoryHashListProvider`
+ synthetic data only; the production credentialed provider stays out of scope
(`gated:credentialed`).

### Services (Go) — pure logic & API ergonomics

**8. hashstream: snapshot-diff edge-case tests.**
`area:hashstream` · `lang:go` · `good-first-issue` · `type:enhancement`
Harden `/diff/{from}/{to}` over the in-memory store: empty snapshots, identical
snapshots, out-of-order ids, newest-first ordering. *Acceptance:* table-driven
`*_test.go` covering the cases; `go test ./...` green. *Why safe:* the store holds
synthetic `Source`/`Snapshot` records; NCMEC sync stays `gated:credentialed`.

**9. hashstream TS SDK: typed-error coverage + README quickstart.**
`area:hashstream` · `lang:ts` · `good-first-issue` · `type:docs`
Add tests for `HashStreamError` paths (4xx/5xx, network) against a mocked server,
and a 5-line "fetch the latest snapshot" quickstart. *Acceptance:* `node --test`
passes; quickstart runs against the example server. *Why safe:* mocked transport;
no real list.

**10. evidencevault: tamper-evidence property test for the custody chain.**
`area:evidencevault` · `lang:go` · `help-wanted` · `type:conformance` ·
`safety-sensitive`
Add a property test mutating an entry in the append-only chain and asserting
`Verify()` detects it. *Acceptance:* tests prove tamper-detection over the
in-memory log. *Why safe:* `safety-sensitive` (correctness matters) but **not**
gated — it touches only the in-memory custody log, **not** retention enforcement or
KMS (which stay `needs-counsel`). Do not wire the HTTP API or KMS.

### Prevention & provenance

**11. c2pa-lite: round-trip test for `ManifestClaim` canonical form.**
`area:c2pa-lite` · `lang:rust` · `good-first-issue` · `type:enhancement`
`to_canonical()` must alphabetize metadata for stable signing. Add tests that
reordering metadata pairs yields an identical canonical form (and a changed field
yields a different one). *Acceptance:* deterministic-canonicalization tests pass.
*Why safe:* pure data transform; the real signing path stays behind the `upstream`
(c2pa-rs) feature and is out of scope here.

**12. safemod: exposure-limit boundary tests (caller-clock).**
`area:safemod` · `lang:rust` · `good-first-issue` · `type:enhancement`
`limits` enforces per-shift caps, continuous-exposure caps, and mandatory breaks,
all driven by a caller-supplied clock. Add boundary tests (exactly-at-cap,
one-over, break-resets-counter). *Acceptance:* deterministic tests green; aligns
with the zero-dep / `forbid(unsafe)` / no-I/O design. *Why safe:* the crate
physically cannot persist or transmit data — only integer counters.

### Drop-in integration & adapters

**13. csam-shield: a published example for an un-covered framework.**
`area:csam-shield` · `lang:ts` / `lang:python` · `help-wanted` · `type:docs`
The Alpha bar wants working examples (e.g. Express + a stub detector; FastAPI +
Hono). Add one runnable example wiring the middleware with a **synthetic** detector
backed by detectkit-test fixtures. *Acceptance:* the example runs and its README
quickstart works end-to-end. *Why safe:* uses the existing stub/synthetic detector;
does **not** wire a real PhotoDNA/NCMEC/Cloudflare credentialed backend
(`gated:credentialed`).

**14. cybertip-cli: golden-file tests for the dry-run wire payload.**
`area:cybertip-cli` · `lang:ts` / `lang:python` · `help-wanted` · `type:conformance`
· `safety-sensitive`
`submit_dry_run` emits the SHOUTY_CASE payload with **no** network I/O. Add
golden-file tests pinning the serialized shape so regressions are caught.
*Acceptance:* golden tests over synthetic `CyberTipReport` inputs; `redactForLog`
covered. *Why safe:* the **dry-run path only** — production submit stays blocked
(`ProductionSubmitBlocked`, labelled `needs-counsel`). The issue body states
explicitly: do not remove the block or add a live endpoint.

### Cross-cutting: docs, agent-native, CI

**15. README first-value rewrite for one tool (verified install + 5-line snippet).**
`area:docs` · `good-first-issue` · `type:docs`
Pick a tool and make its README lead with the **verified** copy-paste install
(exact names — e.g. crate `digitalharm-hashkit` imports as `hashkit`; dist
`digitalharm-promptshield` imports as `promptshield`) and a 5-line first-value
snippet using synthetic fixtures. *Acceptance:* the install + snippet run from a
clean machine. *Why safe:* docs only; no code paths touched. *Note:* only land once
v0.1 publish makes the install actually resolve — until then, scope it to the
from-source path.

**16. Add a `good-first-issue` smoke-test to the safety guard.**
`area:ci` · `type:enhancement` · `safety-sensitive`
Add fixtures + a test that `scripts/safety-check.sh` *catches* a planted
fake-credential / fake-hash-list-filename and *allows* an allowlisted synthetic
fixture. *Acceptance:* a self-test that fails if the guard regresses. *Why safe:*
uses obvious fake/placeholder patterns (`example`, `dummy`, `<token>`), never a
real secret; `safety-sensitive` because it hardens the guard itself.

> **Coverage check:** the list above touches all 11 tools (hashkit, hashkit-match,
> detectkit-test, csam-shield, promptshield, hashstream, trainguard, cybertip-cli,
> evidencevault, c2pa-lite, safemod) plus conformance, docs, agent-native, and CI —
> and every item is completable with synthetic data and public references alone.

### Issues we deliberately do NOT open as contributor work

To keep the fence visible: NCMEC/IWF/Arachnid live sync (`hashstream`,
`trainguard`), real-detector wire-up in `csam-shield`, the `cybertip-cli`
production submit path, `evidencevault` retention enforcement + KMS, and the
CSAM-intent red-team pack (a v0.4, maintainer-led item). These carry
`gated:credentialed` / `needs-counsel` / `safety-sensitive` and are tracked for the
maintainer, not offered as on-ramp tasks.

---

## 3. Recognition model

Recognition is the conversion mechanism from "one PR" to "named co-maintainer,"
and it is cheap for a solo maintainer to run. The ladder:

1. **`CONTRIBUTORS.md` + per-release "thanks to."** Every merged contributor is
   listed; each release's notes name that release's contributors. (Stand these up by
   v0.3–v0.5.)
2. **Named conformance credit.** Reproducing `hashkit` PDQ on a new OS/arch (issue
   #1) is a *roadmap-gating* contribution; reproducers are credited by name in
   `CONFORMANCE.md` and the release notes. This is the single highest-status
   good-first-issue by design — it makes the safe surface also the prestigious one.
3. **First named co-maintainer.** Drawn from the conformance-reproducer or
   connector-contributor pool — the people who have already demonstrated
   safety-awareness on credential-free surfaces. Onboarding a co-maintainer is an
   explicit project goal: it fixes the bus factor (the top enterprise objection and
   a funder discount) and unlocks support commitments the solo maintainer can't make
   alone.
4. **Governance clarity as a *form* of recognition.** A short `GOVERNANCE.md` names
   the never-PR-able CSAM invariants and the stewardship model. Contributors can see
   exactly which surfaces they can own (wide) and which stay maintainer/counsel-
   controlled (the legal tier) — clarity is what makes high-signal people stay.
5. **Advisors, at v1.0.** 2–3 named advisors + a commissioned third-party security
   review (Trail of Bits / Cure53 class), woven into the launch narrative.

**What recognition is *not*:** it is not an SLA. We publish **honest** solo/small-
team triage expectations and never promise same-week support the maintainer can't
keep. Under-promise; over-deliver.

---

## 4. Where we recruit (narrow, high-signal — never drive-bys)

Per the anti-spam guardrails, contributor recruiting mirrors the outreach policy:
value-first, low-frequency, subject-matter-aware. We surface the curated
`good-first-issue` board in venues where safety-literate contributors already are —
we do **not** blast generic "first-timers-welcome" calls or cold-issue projects.

- The pinned **conformance-reproduction** program (self-selecting, safe-by-design).
- Release-note shout-outs (recognition doubles as a recruiting signal).
- Vetted, subject-aware communities: **ROOST** dev community, **Bluesky/AT-Proto**
  (a natural home for the connector adapters), the **All Tech Is Human / TSPA**
  Slacks.
- The few high-signal in-person venues: **TrustCon** and the **Stanford Internet
  Observatory / Trust & Safety Research Conference** — where the handful of
  contributors/advisors who actually matter overlap.

People from those upstream communities are the ideal first authors of the thin
connector packages (`atproto-adapter`, Osprey/Coop adapter, python-threatexchange
plugin) — "first real feature" work that is still credential-free in the code.

---

## 5. Funnel metrics

Lightweight, solo-maintainer-appropriate. The point is a healthy *contributor*
pipeline and a shrinking bus factor — **not** vanity volume (more PRs is not the
goal; one good, safe, well-reviewed PR is). Review against these roughly per
release.

### Top of funnel — is there a door, and is it findable?

- **Curated `good-first-issue` count:** target **10–15 open** before any promotion,
  replenished as they close. (Empty board = closed door.)
- **% of open `good-first-issue` with an acceptance test + "safe to work on" note:**
  target **100%.** This is the cheap-to-make / cheap-to-review lever.
- **Time-to-first-meaningful-action** for a new contributor (clone → green local
  build of the relevant package): target **< 15 min** (the polyglot setup in
  CONTRIBUTING.md is built to hit this).

### Middle — conversion & review hygiene

- **First-PR merge rate** (merged ÷ opened by first-time contributors): a low rate
  means issues are under-scoped or the on-ramp is unclear; investigate, don't
  inflate.
- **Median time-to-first-maintainer-response** on a contributor PR/issue: publish
  the honest number; aim to keep it humane, never promise an SLA.
- **Safety-checklist completion rate** on contributor PRs: target **100%** before
  review (the template enforces it). **Safety-guard violations reaching review:
  target 0** — a single real-list/credential slip is the failure mode that matters.

### Bottom — the outcomes that actually de-risk the project

- **Distinct external conformance reproducers (named):** target **≥ 1** to satisfy
  the roadmap Beta gate; more is better. *This is the most important single metric
  on the page* — it is simultaneously a contributor outcome and a release gate.
- **Named co-maintainers onboarded:** target **≥ 1** by v0.5 (the bus-factor fix).
- **Repeat contributors** (≥ 2 merged PRs): the leading indicator that the funnel is
  producing a *community*, not one-offs.
- **Connector adapters landed by external contributors** (atproto/hepa→Ozone,
  Osprey/Coop, python-threatexchange): each is both an ecosystem win and proof the
  "first real feature" path works.

### Guardrail metrics (these must stay at/near zero — they gate everything)

- **Gated-path PRs merged that opened a fence** (cybertip-cli production submit,
  evidencevault retention/KMS): **0, always.**
- **"Compliant" / "beats Meta" claims that reached a release surface:** **0.**
- **Real CSAM / real hash list / live credential committed:** **0** — the
  detonation case; the safety guard + the immediate full git-history scan exist to
  keep it there.

> If volume metrics rise while the named-reproducer / co-maintainer / repeat-
> contributor metrics stay flat, the funnel is generating noise, not resilience —
> tighten scope and recruiting, don't celebrate the PR count.
