# v2 Release Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the release orchestration, worktree structure, and package-by-package path needed to take digitalharm-oss from current scaffolds through v2.

**Architecture:** Keep package implementation work isolated by release worktree while tracking portfolio decisions in committed docs. Foundation packages unblock adoption, credentialed infrastructure, and legal/ops tracks; v2 hardening integrates all release gates.

**Tech Stack:** Rust/Cargo, Python/pytest, Node/npm, Go/go test, git worktrees, repository safety guard.

---

### Task 1: Preserve Current Main Checkout

**Files:**
- Inspect: `.gitignore`
- Inspect: `git status --short`
- Modify if needed: `.gitignore`

- [ ] **Step 1: Confirm worktree hygiene**

Run:

```bash
git status --short
git check-ignore -q .worktrees && echo ".worktrees ignored"
```

Expected: `.worktrees ignored`. If current package work is untracked, do not delete or overwrite it.

- [ ] **Step 2: Commit only orchestration hygiene when ready**

Run:

```bash
git add .gitignore docs/ops docs/superpowers/plans
git commit -m "docs: add v2 release orchestration"
```

Expected: commit succeeds without staging package implementation files unless intentionally reviewed.

### Task 2: Create Release Worktrees

**Files:**
- Create local dirs: `.worktrees/v0.1-foundation`, `.worktrees/v1-adoption`, `.worktrees/v1-legal-infra`, `.worktrees/v2-hardening`
- Reference: `docs/ops/worktree-map.md`

- [ ] **Step 1: Add foundation worktree**

Run:

```bash
git worktree add .worktrees/v0.1-foundation -b codex/release-v0.1-foundation
```

Expected: worktree created from current `HEAD`.

- [ ] **Step 2: Add adoption worktree**

Run:

```bash
git worktree add .worktrees/v1-adoption -b codex/release-v1-adoption
```

Expected: worktree created from current `HEAD`.

- [ ] **Step 3: Add legal/infra worktree**

Run:

```bash
git worktree add .worktrees/v1-legal-infra -b codex/release-v1-legal-infra
```

Expected: worktree created from current `HEAD`.

- [ ] **Step 4: Add v2 hardening worktree**

Run:

```bash
git worktree add .worktrees/v2-hardening -b codex/release-v2-hardening
```

Expected: worktree created from current `HEAD`.

### Task 3: Foundation Track

**Files:**
- Modify: `packages/hashkit/src/lib.rs`
- Modify: `packages/hashkit-match/src/lib.rs`
- Modify: `packages/detectkit-test/src/detectkit_test/fixtures.py`
- Modify: `packages/detectkit-test/tests/`
- Modify: `packages/hashkit/vectors/v0/corpus.json`
- Modify: `docs/tools/hashkit.md`
- Modify: `docs/tools/detectkit-test.md`

- [ ] **Step 1: Start in foundation worktree**

Run:

```bash
cd .worktrees/v0.1-foundation
git status --short --branch
```

Expected: branch `codex/release-v0.1-foundation`.

- [ ] **Step 2: Run baseline tests**

Run:

```bash
cargo test --workspace --all-features
cd packages/detectkit-test && pip install -e ".[dev]" && pytest -q
```

Expected: existing tests pass or failures are documented before implementation.

- [ ] **Step 3: Implement deterministic synthetic fixtures first**

Add tests that call `generate_image(identifier="gradient-a", seed=7, pattern="gradient-horizontal", width=64, height=64)` twice and assert identical PNG bytes and metadata. Then implement the smallest deterministic generator needed for the test.

- [ ] **Step 4: Implement matcher ground truth**

Add tests comparing `hashkit-match` query results against a naive Hamming-distance scan on small synthetic hash sets. Implement the matcher so threshold and ordering behavior are explicit.

- [ ] **Step 5: Update docs and status**

Update package `STATUS` files and `docs/roadmap.md` only after tests pass.

### Task 4: Adoption Track

**Files:**
- Modify: `packages/csam-shield/node/src/`
- Modify: `packages/csam-shield/python/src/`
- Modify: `packages/promptshield/src/promptshield/`
- Modify: `packages/promptshield/tests/`
- Modify: `docs/tools/csam-shield.md`
- Modify: `docs/tools/promptshield.md`

- [ ] **Step 1: Start in adoption worktree**

Run:

```bash
cd .worktrees/v1-adoption
git status --short --branch
```

Expected: branch `codex/release-v1-adoption`.

- [ ] **Step 2: Run baseline tests**

Run:

```bash
cd packages/csam-shield/node && npm install && npm test
cd ../../python && pip install -e ".[dev]" && pytest -q
cd ../../promptshield && pip install -e ".[dev]" && pytest -q
```

Expected: existing tests pass or failures are documented before implementation.

- [ ] **Step 3: Build fake detector examples**

Add safe fake detector fixtures that return allow/block/review decisions without real hashes or media. Use these in Express/Hono/Fastify and Python middleware tests.

- [ ] **Step 4: Harden PromptShield rule decisions**

Add tests for explicit allow, review, and block outcomes. Keep rules textual and non-graphic; do not add harmful sample prompts.

- [ ] **Step 5: Update docs and status**

Update examples, package `STATUS`, and `docs/roadmap.md` after test verification.

### Task 5: Legal + Infra Track

**Files:**
- Modify: `packages/hashstream/internal/`
- Modify: `packages/hashstream/sdk-ts/src/`
- Modify: `packages/trainguard/src/trainguard/`
- Modify: `packages/cybertip-cli/node/src/`
- Modify: `packages/cybertip-cli/python/src/`
- Modify: `packages/evidencevault/internal/`
- Modify: `docs/tools/hashstream.md`
- Modify: `docs/tools/trainguard.md`
- Modify: `docs/tools/cybertip-cli.md`
- Modify: `docs/tools/evidencevault.md`

- [ ] **Step 1: Start in legal/infra worktree**

Run:

```bash
cd .worktrees/v1-legal-infra
git status --short --branch
```

Expected: branch `codex/release-v1-legal-infra`.

- [ ] **Step 2: Run baseline tests**

Run:

```bash
cd packages/hashstream && go test ./...
cd sdk-ts && npm install && npm test
cd ../../trainguard && pip install -e ".[dev]" && pytest -q
cd ../cybertip-cli/node && npm install && npm test
cd ../python && pip install -e ".[dev]" && pytest -q
cd ../../evidencevault && go test ./...
```

Expected: existing tests pass or failures are documented before implementation.

- [ ] **Step 3: Keep providers fake by default**

Add fake-provider fixtures for HashStream and TrainGuard. Credentialed provider tests must skip unless explicit environment variables are set.

- [ ] **Step 4: Keep reporting dry-run by default**

Verify CyberTip CLI cannot submit production reports without explicit credentials and counsel-reviewed configuration.

- [ ] **Step 5: Connect custody and reporting metadata**

Add tests proving EvidenceVault can store custody events referenced by a dry-run CyberTip package without storing raw content.

### Task 6: v2 Hardening Track

**Files:**
- Modify: `.github/workflows/`
- Modify: `scripts/safety-check.sh`
- Modify: `docs/safety-policy.md`
- Modify: `docs/roadmap.md`
- Modify: package READMEs and changelogs

- [ ] **Step 1: Start in v2 hardening worktree**

Run:

```bash
cd .worktrees/v2-hardening
git status --short --branch
```

Expected: branch `codex/release-v2-hardening`.

- [ ] **Step 2: Add complete CI matrix**

Ensure CI runs active Rust, Python, Go, and Node package tests without network credentials.

- [ ] **Step 3: Add release checklist**

Document signing, security review, counsel review, and credentialed validation gates.

- [ ] **Step 4: Run full verification**

Run:

```bash
bash scripts/safety-check.sh
cargo test --workspace --all-features
```

Then run package-specific test commands listed in `docs/ops/worktree-map.md`.

Expected: safety guard and tests pass before v2 release claims.

