<!--
  Thank you for contributing to FightCSAM.

  - For anything beyond a small fix, please link an issue you opened first.
  - Security- or abuse-sensitive changes are coordinated PRIVATELY via
    security@digitalharm.org — do not describe an exploit/bypass in a public PR.
  - The safety checklist below is MANDATORY. PRs that leave it blank will be asked
    to complete it before review. The boxes are not a formality — they are the
    project's core invariants.
-->

## What & why

<!-- What does this change and why? Link the issue: "Closes #123". -->

## Affected packages

<!-- e.g. hashkit, csam-shield/node, packages/hashstream. Note the language(s) touched. -->

## How it was tested

<!-- Commands you ran. Reproduce the relevant CI locally before pushing. -->

- [ ] Added/updated tests in the package's test location (regression test for a fix; coverage for new behavior).
- [ ] Ran `make safety-check` (the SCOPE/SAFETY guard) — passes.
- [ ] Ran the relevant language CI locally (Rust `cargo fmt`/`clippy -D warnings`/`test`; Python `ruff` + `pytest`; Go `build`/`vet`/`test`; Node `tsc --noEmit` + `node --test`).

---

## CSAM safety checklist (MANDATORY — all must be true)

- [ ] **No hash lists or credentialed data added.** This PR adds **no** real NCMEC / IWF / Project Arachnid hash data, and no excerpt/sample/"anonymized" subset of one.
- [ ] **No real CSAM imagery or video.** All test media is **synthetic**, non-harmful, and reproducible from a documented seed/prompt (`detectkit-test`) — no opaque binaries.
- [ ] **No credentials or secrets.** No NCMEC ESP tokens, IWF/PhotoDNA/Arachnid keys, AWS keys, or signing keys. Any example values are obvious placeholders; secret *names* are documented in `.env.example`.
- [ ] **No gated path opened or weakened.** I did **not** wire `cybertip-cli` to real CyberTipline submission or remove its `ProductionSubmitBlocked` guard; I did **not** enable `evidencevault` retention enforcement or a live KMS. (Strengthening a stub/refusal is fine — note it below.)
- [ ] **No over-claiming.** This PR introduces no "compliant" / "turnkey compliance" wording and no "beats / outperforms Meta or PDQ" framing. Legal-duty statements are paired with the counsel disclaimer; `hashkit` is described as *conforming to* PDQ, not competing with it.
- [ ] **Demos use synthetic fixtures only.** Any new example, quickstart, Space, or screenshot uses synthetic data — never real material or a real list.

> If any box above cannot be checked, **stop** and contact the maintainers privately
> (`security@digitalharm.org`) before proceeding. Do not work around the safety guard
> silently; if you believe it has a false positive, explain it here and tag a maintainer.

## Anything reviewers should know

<!-- Trade-offs, follow-ups, a deliberate stub-strengthening, or a documented false-positive in the safety guard. -->
