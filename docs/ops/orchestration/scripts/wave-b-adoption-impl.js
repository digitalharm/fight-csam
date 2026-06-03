// =============================================================================
// Wave B (Adoption) implementation workflow — CORRECTED / repo-safe version.
//
// Supersedes the buggy session-artifact script
//   ~/.claude/projects/-Users-colin-Code-addiction/35598985-.../workflows/scripts/
//     wave-b-adoption-satellites-impl-wf_128873b4-26e.js
// which used `isolation: 'worktree'` and was launched from the /Users/colin/Code/addiction
// session, so every agent got a worktree of the WRONG repo (addiction-research).
//
// WHAT CHANGED (see ../README.md and ../tracks.config.json):
//   1. A phase-0 PREFLIGHT agent asserts we are pointed at fight-csam
//      (origin remote slug + Cargo.toml/packages markers) and ABORTS the whole
//      run if not — instead of silently mis-dispatching.
//   2. The preflight agent PROVISIONS one git worktree per package explicitly
//      via `git -C <repoRoot> worktree add`, idempotently (reuses an already
//      attached branch — handles re-runs and the older worktree naming scheme).
//   3. `isolation: 'worktree'` is REMOVED. Repo-correctness no longer depends on
//      which session launched the Workflow; each impl agent is handed the
//      ABSOLUTE path of its pre-created worktree.
//
// Constants below are copied from ../tracks.config.json (workflow scripts cannot
// read files at runtime). Keep them in sync with that file.
// =============================================================================

export const meta = {
  name: 'wave-b-adoption-impl',
  description: 'Adoption + satellites (csam-shield, promptshield, c2pa-lite): preflight repo guard + explicit worktree provisioning in fight-csam, then three impl agents. Session-CWD-independent.',
  phases: [
    { title: 'Preflight' },
    { title: 'Package implementation' },
    { title: 'Handoff aggregation' },
  ],
}

// ---- Track config (mirror of docs/ops/orchestration/tracks.config.json) ------
const REPO_ROOT_HINT = '/Users/colin/Code/fight-csam' // verified, not trusted blindly
const REMOTE_SLUG = 'digitalharm/fight-csam'          // authoritative identity check
const BASE_BRANCH = 'main'
const WORKTREE_DIR = '.worktrees'
const BRANCH_PREFIX = 'agent/wave-b-'
const PACKAGES = ['csam-shield', 'promptshield', 'c2pa-lite']

// -----------------------------------------------------------------------------

const PREFLIGHT_SCHEMA = {
  type: 'object',
  required: ['ok', 'repo_root', 'origin_url', 'markers_ok', 'base_ref_sha', 'worktrees', 'abort_reason'],
  additionalProperties: false,
  properties: {
    ok: { type: 'boolean' },
    repo_root: { type: 'string' },
    origin_url: { type: 'string' },
    markers_ok: { type: 'boolean' },
    base_ref_sha: { type: 'string' },
    worktrees: {
      type: 'array',
      items: {
        type: 'object',
        required: ['package', 'branch', 'path', 'created', 'tip'],
        additionalProperties: false,
        properties: {
          package: { type: 'string' },
          branch: { type: 'string' },
          path: { type: 'string' },
          created: { type: 'boolean' },
          tip: { type: 'string' },
        },
      },
    },
    abort_reason: { type: ['string', 'null'] },
  },
}

const AGENT_RETURN_SCHEMA = {
  type: 'object',
  required: ['package', 'branch_name', 'commits_pushed', 'tests_passing', 'status_change_proposed', 'files_changed', 'cross_track_deps', 'blockers', 'handoff_summary'],
  additionalProperties: false,
  properties: {
    package: { type: 'string' },
    branch_name: { type: 'string' },
    commits_pushed: { type: 'boolean' },
    tests_passing: { type: 'boolean' },
    status_change_proposed: { type: 'string' },
    files_changed: { type: 'array', items: { type: 'string' } },
    cross_track_deps: { type: 'array', items: { type: 'string' } },
    blockers: { type: 'array', items: { type: 'string' } },
    handoff_summary: { type: 'string' },
  },
}

const HANDOFF_SCHEMA = {
  type: 'object',
  required: ['handoff_doc_markdown', 'integration_notes', 'merge_order'],
  additionalProperties: false,
  properties: {
    handoff_doc_markdown: { type: 'string' },
    integration_notes: { type: 'string' },
    merge_order: { type: 'array', items: { type: 'string' } },
  },
}

// Binding worktree header prepended to every impl prompt. The path is absolute
// and config-derived, so it is correct no matter which session launched the run.
const worktreeHeader = (wt) => `**WORKTREE (binding — read before anything else):**
Your git worktree has ALREADY been created for you at:
    ${wt.path}
on branch \`${wt.branch}\` (freshly_created=${wt.created}, current tip=${wt.tip}).

- Do ALL work inside that directory. Start with: \`cd ${wt.path}\`
- Do NOT run \`git worktree add\` and do NOT \`git checkout -b\` — the branch already exists and is checked out here.
- Do NOT cd into any other repository. This workflow may be launched from a different repo's session; the absolute path above is the ONLY correct location. If you ever see a \`packages/\` directory missing or a Next.js/\`app/\` layout, STOP — you are in the wrong place; report it as a blocker instead of working around it.
- If freshly_created=false a prior (possibly interrupted) run may have left commits or edits on this branch: first run \`git -C ${wt.path} status --short\` and \`git -C ${wt.path} log --oneline origin/${BASE_BRANCH}..HEAD\` and BUILD ON existing work rather than assuming a clean checkout.
- When done: commit on \`${wt.branch}\`, then \`git -C ${wt.path} push -u origin ${wt.branch}\`.

`

const PKG_TASKS = {
  'csam-shield': `You are the **csam-shield** implementation agent for Wave B (Adoption).

**Task:** Wire CSAM-Shield's PDQ detector path end-to-end against an operator-supplied hash list — no external credentials needed. v0.5 acceptance: middleware blocks an image whose hash is in the operator-supplied list and allows one that isn't, with retry/timeout/policy controls working across the three Node adapters (Express, Fastify, Hono).

**Coordination boundary (binding):**
- Stay inside \`packages/csam-shield/\`. Do NOT edit other packages.
- The PDQ detector accepts a pre-computed hash (\`{ hash: Uint8Array }\`) and matches against an operator-supplied \`hashList: Uint8Array[]\` via Hamming distance — do NOT depend on hashkit being merged.

**Concrete steps:**
1. Confirm your worktree: \`git -C <your worktree> status --short\` (you are already on \`agent/wave-b-csam-shield\`; do NOT create the branch).
2. Read \`packages/csam-shield/node/src/\` and \`packages/csam-shield/python/src/\`.
3. Node: implement \`packages/csam-shield/node/src/detectors/pdq.ts\` — \`createPdqListDetector({ hashList, threshold })\` returning a Detector; Match if any list entry within threshold Hamming distance; inline popcount helper.
4. Node: add \`retryPolicy: { maxRetries, backoffMs }\`, \`timeoutMs\`, and \`onError: 'allow' | 'deny'\` to the core dispatch (withTimeout + withRetry).
5. Adapter tests for Express/Fastify/Hono against a fake detector (one Match hash, one NoMatch).
6. Python: same PDQ-list detector + retry/timeout config in \`packages/csam-shield/python/src/csam_shield/detectors.py\`.
7. From \`packages/csam-shield/node/\`: \`npm install && npx tsc --noEmit && npx tsc && node --test dist/index.test.js dist/detectors/pdq.test.js\`. All green.
8. From \`packages/csam-shield/python/\`: \`pip install -e ".[dev]" && ruff check src && pytest -q\`.
9. \`bash scripts/safety-check.sh\` from the worktree root.
10. Commit + push (see worktree header). Co-Authored-By trailer.
11. Append handoff to \`docs/ops/handoffs/v1-adoption.md\` under \`### csam-shield\`.
12. Return the structured object.

**Acceptance:** PDQ-list detector works in both languages; retry/timeout/policy in core; adapter tests cover Express/Fastify/Hono; status_change_proposed mentions v0.5 with the operator-supplied hash list working end-to-end.`,

  'promptshield': `You are the **promptshield** implementation agent for Wave B (Adoption).

**Task:** Harden Stage 1 (pattern matcher) and ship a baseline Stage 2 (neural). v0.5 acceptance: classify 20 known CSAM-intent prompts (block), 20 benign (allow), 20 borderline (review) with documented score behavior. Stage 1 expansion + a small pure-Python baseline classifier (no runtime HuggingFace pull).

**Coordination boundary (binding):**
- Stay inside \`packages/promptshield/\`. Do NOT edit other packages.
- Stage 2: ship a pure-Python baseline (log-linear over hand-crafted features) on a synthetic toy dataset INSIDE the package. ONNX-pluggable interface, baseline default. Do NOT commit real weights.

**Concrete steps:**
1. Confirm your worktree: \`git -C <your worktree> status --short\` (already on \`agent/wave-b-promptshield\`; do NOT create the branch).
2. Read \`packages/promptshield/src/promptshield/\` — rules.py, classifier.py, neural.py, types.py.
3. Stage 1 in rules.py: expand minor-indicator patterns to >=50 and sexual-context patterns to >=50; keep the conjunction principle (fires only when BOTH categories match); document coverage rationale at top.
4. \`tests/test_false_positives.py\`: >=30 benign prompts hitting only ONE category — none fire.
5. \`tests/test_true_positives.py\`: >=30 unambiguous synthetic CSAM-intent prompts — all fire.
6. \`tests/test_borderline.py\`: >=10 prompts asserted in the review band (0.5 <= score < 0.75).
7. Stage 2 in neural.py: log-linear scorer over (minor-indicator-count, sexual-context-count, length, suspicious-token-count); \`NeuralClassifier(model_path=None)\` uses baseline; ONNX path raises NotImplementedError.
8. From \`packages/promptshield/\`: \`pip install -e ".[dev]" && ruff check src && pytest -q\`. All green.
9. \`bash scripts/safety-check.sh\` from the worktree root.
10. Commit + push (see worktree header). Co-Authored-By.
11. Append handoff to \`docs/ops/handoffs/v1-adoption.md\` under \`### promptshield\`.
12. Return the structured object.

**Acceptance:** >=50 patterns per category; >=30 TP + >=30 FP + >=10 borderline tests passing; baseline Stage 2 present; status_change_proposed mentions v0.5 with Stage 1 hardened + Stage 2 baseline.`,

  'c2pa-lite': `You are the **c2pa-lite** implementation agent for Wave B (satellite under Adoption).

**Task:** Wire the \`upstream\` feature flag to delegate \`sign_image\` to the maintained \`c2pa\` crate (MIT-OR-Apache-2.0). v0.5 acceptance: under \`--features upstream\`, sign_image produces a real C2PA manifest (c2patool verification is a documented external check, not blocking).

NOTE: this satellite's v0.5 work already landed on origin (branch agent/wave-b-c2pa-lite, real C2PA signing). If your worktree's freshly_created=false and the branch already carries that commit, VERIFY it still builds/tests green and reconcile rather than redoing it.

**Coordination boundary (binding):**
- Stay inside \`packages/c2pa-lite/\`. Touch the workspace Cargo.toml only if strictly required for feature wiring (document why in handoff).
- The watermark module stays NotImplemented — flag in handoff, do not wire.

**Concrete steps:**
1. Confirm your worktree: \`git -C <your worktree> status --short\` and (if freshly_created=false) \`git -C <your worktree> log --oneline origin/${BASE_BRANCH}..HEAD\` (already on \`agent/wave-b-c2pa-lite\`; do NOT create the branch).
2. Read \`packages/c2pa-lite/Cargo.toml\` and \`src/lib.rs\`.
3. Add optional dep: \`c2pa = { version = "0.85", optional = true, default-features = false, features = ["rust_native_crypto"] }\`; \`[features] upstream = ["dep:c2pa"]\`.
4. Gate the c2pa-rs wiring under \`#[cfg(feature = "upstream")]\`: when enabled, \`sign_image\` builds a c2pa::Builder from the ManifestClaim, signs with key_pem, returns a SignedAsset; when disabled, keep the existing placeholder path.
5. Tests under \`#[cfg(all(test, feature = "upstream"))]\` signing a tiny embedded PNG; assert signature length > 0. Do NOT shell out to c2patool.
6. Existing (non-upstream) tests still pass.
7. \`cargo fmt --all && cargo clippy --workspace --all-targets -- -D warnings && cargo test -p c2pa-lite && cargo test -p c2pa-lite --features upstream\`. Both green.
8. \`bash scripts/safety-check.sh\` from the worktree root.
9. Commit + push (see worktree header). Co-Authored-By.
10. Append handoff to \`docs/ops/handoffs/v1-adoption.md\` under \`### c2pa-lite\`.
11. Return the structured object.

**Acceptance:** \`upstream\` feature works; default build still passes; status_change_proposed mentions v0.5 with real C2PA manifest signing under the feature flag.`,
}

// ---- Phase 0: preflight + explicit worktree provisioning --------------------
phase('Preflight')

const branchFor = (pkg) => BRANCH_PREFIX + pkg
const preflightPrompt = `You are the PREFLIGHT + WORKTREE PROVISIONER for the Wave B (Adoption) implementation workflow. You run BEFORE any package agent. Goals: (A) prove we target the correct repo, (B) create one git worktree per package, (C) return absolute paths. On ANY failed assertion, STOP and return ok=false with a precise abort_reason — never guess or "work around" a wrong repo.

Use the Bash tool. Constants (from docs/ops/orchestration/tracks.config.json):
- REPO_ROOT hint: ${REPO_ROOT_HINT}
- origin remote MUST contain: ${REMOTE_SLUG}
- base branch: ${BASE_BRANCH}
- worktree dir: ${WORKTREE_DIR}
- packages -> branches:
${PACKAGES.map((p) => `    ${p} -> ${branchFor(p)}`).join('\n')}

Steps, in order:
1. ROOT = \`git -C ${REPO_ROOT_HINT} rev-parse --show-toplevel\` (trimmed). If it errors (not a git repo), ABORT.
2. ORIGIN = \`git -C "$ROOT" remote get-url origin\`. Assert ORIGIN contains "${REMOTE_SLUG}". If not, ABORT — record origin_url and abort_reason="wrong repo: origin <ORIGIN> does not contain ${REMOTE_SLUG}". (This is the exact check that would have caught the addiction-research mis-target.)
3. Assert \`test -f "$ROOT/Cargo.toml"\` AND \`test -d "$ROOT/packages"\`. Set markers_ok; if either is missing, ABORT with abort_reason naming the missing marker.
4. \`git -C "$ROOT" fetch origin --prune\`; then BASE_SHA = \`git -C "$ROOT" rev-parse origin/${BASE_BRANCH}\`. If either fails, ABORT.
5. Enumerate attached worktrees ONCE: \`git -C "$ROOT" worktree list --porcelain\`. Build a map of branch (the line "branch refs/heads/<name>") -> worktree path (the preceding "worktree <path>" line).
6. For EACH package/branch above, compute CANON = "$ROOT/${WORKTREE_DIR}/<branch with '/' replaced by '-'>" (e.g. $ROOT/${WORKTREE_DIR}/agent-wave-b-c2pa-lite), then:
   a. If <branch> is ALREADY attached at some path P (from step 5): REUSE it — path=P, created=false, tip=\`git -C "P" rev-parse HEAD\`. Do NOT run \`worktree add\` (git forbids one branch in two worktrees; this also reuses older-named worktrees like ${WORKTREE_DIR}/wave-b-promptshield).
   b. Else if the branch exists but is unattached (\`git -C "$ROOT" show-ref --verify --quiet refs/heads/<branch>\`): \`git -C "$ROOT" worktree add "$CANON" <branch>\`; path=CANON, created=false, tip=\`git -C "$CANON" rev-parse HEAD\`.
   c. Else (no such branch): \`git -C "$ROOT" worktree add -b <branch> "$CANON" origin/${BASE_BRANCH}\`; path=CANON, created=true, tip=BASE_SHA.
   Do the adds SEQUENTIALLY (never in parallel).
7. Return via StructuredOutput: ok=true, repo_root=ROOT, origin_url=ORIGIN, markers_ok=true, base_ref_sha=BASE_SHA, worktrees=[{package,branch,path,created,tip} per package], abort_reason=null.

Do NOT implement any package code — you provision only. If you abort, still return the schema with ok=false, the fields you did resolve, empty worktrees=[], and a precise abort_reason.`

const pre = await agent(preflightPrompt, { label: 'preflight', phase: 'Preflight', schema: PREFLIGHT_SCHEMA })

if (!pre || !pre.ok) {
  const reason = (pre && pre.abort_reason) || 'preflight agent returned no usable result'
  log(`PREFLIGHT ABORT — not dispatching any Wave B agents. Reason: ${reason}`)
  return { aborted: true, reason, preflight: pre || null }
}

const wtByPkg = Object.fromEntries(pre.worktrees.map((w) => [w.package, w]))
log(`Preflight OK in ${pre.repo_root} (origin ${pre.origin_url}). Worktrees: ${pre.worktrees.map((w) => `${w.package}@${w.path} (new=${w.created})`).join(', ')}`)

// ---- Phase 1: package implementation (NO isolation:'worktree') --------------
phase('Package implementation')

const results = (await parallel(
  PACKAGES.map((pkg) => () => {
    const wt = wtByPkg[pkg]
    if (!wt) {
      log(`No provisioned worktree for ${pkg} — skipping.`)
      return Promise.resolve(null)
    }
    return agent(worktreeHeader(wt) + PKG_TASKS[pkg], {
      phase: 'Package implementation',
      label: pkg,
      schema: AGENT_RETURN_SCHEMA,
      // NOTE: deliberately NO isolation:'worktree' — the preflight agent already
      // created the worktree in the correct repo and we inject its absolute path.
    })
  })
)).filter(Boolean)

// ---- Phase 2: handoff aggregation -------------------------------------------
phase('Handoff aggregation')

const aggregated = await agent(
  `You are the Adoption track handoff scribe. The Wave B implementation agents have completed (or partially completed). Aggregate their handoffs into one markdown doc + integration plan for the Release Captain.

Results:
${JSON.stringify(results, null, 2)}

Output handoff_doc_markdown for docs/ops/handoffs/v1-adoption.md (one section per package), integration_notes for the Release Captain, and merge_order.`,
  { phase: 'Handoff aggregation', label: 'scribe', schema: HANDOFF_SCHEMA }
)

return { preflight: pre, results, aggregated }
