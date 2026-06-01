// =============================================================================
// Wave A (Foundation) implementation workflow — CORRECTED / repo-safe version.
//
// Supersedes the buggy session-artifact script
//   ~/.claude/projects/-Users-colin-Code-addiction/35598985-.../workflows/scripts/
//     wave-a-foundation-impl-wf_dcfd4f2a-ebd.js
// which used `isolation: 'worktree'` and, launched from the /Users/colin/Code/addiction
// session, cut every agent's worktree from the WRONG repo (addiction-research).
//
// Same fix as wave-b-adoption-impl.js: a phase-0 preflight agent asserts the repo
// (remote slug + Cargo.toml/packages markers), ABORTS the run if wrong, and
// provisions one worktree per package explicitly + idempotently. `isolation` is
// removed; each impl agent is handed its absolute worktree path. See ../README.md
// and ../tracks.config.json. Constants below mirror tracks.config.json (scripts
// cannot read files at runtime — keep them in sync).
// =============================================================================

export const meta = {
  name: 'wave-a-foundation-impl',
  description: 'Foundation wave (hashkit, hashkit-match, detectkit-test): preflight repo guard + explicit worktree provisioning in digitalharm-oss, then three impl agents. Session-CWD-independent.',
  phases: [
    { title: 'Preflight' },
    { title: 'Package implementation' },
    { title: 'Handoff aggregation' },
  ],
}

// ---- Track config (mirror of docs/ops/orchestration/tracks.config.json) ------
const REPO_ROOT_HINT = '/Users/colin/Code/digitalharm-oss'
const REMOTE_SLUG = 'digitalharm/digitalharm-oss'
const BASE_BRANCH = 'main'
const WORKTREE_DIR = '.worktrees'
const BRANCH_PREFIX = 'agent/wave-a-'
const PACKAGES = ['hashkit', 'hashkit-match', 'detectkit-test']
const HANDOFF_DOC = 'docs/ops/handoffs/v0.1-foundation.md'

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
    branch_name: { type: 'string', description: 'The branch you committed to (e.g. agent/wave-a-hashkit).' },
    commits_pushed: { type: 'boolean', description: 'Did you successfully push your branch to origin?' },
    tests_passing: { type: 'boolean', description: 'Do all tests in your package pass locally after your changes?' },
    status_change_proposed: { type: 'string', description: 'The new STATUS line you propose for this package.' },
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

const worktreeHeader = (wt) => `**WORKTREE (binding — read before anything else):**
Your git worktree has ALREADY been created for you at:
    ${wt.path}
on branch \`${wt.branch}\` (freshly_created=${wt.created}, current tip=${wt.tip}).

- Do ALL work inside that directory. Start with: \`cd ${wt.path}\`
- Do NOT run \`git worktree add\` and do NOT \`git checkout -b\` — the branch already exists and is checked out here.
- Do NOT cd into any other repository. This workflow may be launched from a different repo's session; the absolute path above is the ONLY correct location. If you see a Next.js/\`app/\` layout or a missing \`packages/\` dir, STOP — you are in the wrong place; report it as a blocker.
- If freshly_created=false a prior (possibly interrupted) run may have left commits or edits on this branch: run \`git -C ${wt.path} status --short\` and \`git -C ${wt.path} log --oneline origin/${BASE_BRANCH}..HEAD\` first and BUILD ON existing work.
- When done: commit on \`${wt.branch}\`, then \`git -C ${wt.path} push -u origin ${wt.branch}\`.

`

const PKG_TASKS = {
  'hashkit': `You are the **hashkit** implementation agent for Wave A (Foundation).

**Task:** Wire \`hashkit::hash_from_luma\` and \`hash_dihedral_from_luma\` to a real PDQ implementation. Currently they are \`todo!()\`. Delegate to the maintained \`pdqhash\` crate (Apache-2.0, https://crates.io/crates/pdqhash) so the value-add stays in the cross-language conformance layer, not in re-implementing PDQ from the C++ reference.

**Coordination boundary (binding):**
- Stay inside \`packages/hashkit/\` for all file edits.
- Do NOT edit packages/hashkit-match, docs/roadmap.md, .github/workflows/, or any other package.
- If you discover a dependency on hashkit-match or detectkit-test, document it in \`${HANDOFF_DOC}\` under \`### hashkit\` — do NOT fix it by reaching across.

**Concrete steps:**
1. Confirm your pre-created worktree (see header): \`cd\` there and run \`git status --short\`. You are ALREADY on \`agent/wave-a-hashkit\` — do NOT run \`git checkout -b\`.
2. Read \`packages/hashkit/Cargo.toml\` and \`packages/hashkit/src/lib.rs\`. Note the current public API surface (PdqHash, PdqQuality, PdqResult, PdqError, hash_from_luma, hash_dihedral_from_luma). NOTE the no_std complication: the crate is \`#![cfg_attr(not(feature="std"), no_std)]\` with NO \`std\` feature defined — add a \`std\` feature, gate pdqhash + impl behind it, keep no_std compiling.
3. Add deps to \`packages/hashkit/Cargo.toml\`:
   - \`pdqhash = "0.1"\`
   - use \`pdqhash::image\` re-export (NOT a direct \`image\` dep — avoids the 0.23-vs-0.25 DynamicImage type mismatch)
4. In \`src/lib.rs\` (pdq module), replace the \`todo!()\` in \`hash_from_luma\`:
   - Validate dimensions (>0, luma.len() == (width*height) as usize)
   - Wrap luma into a \`GrayImage\` then \`DynamicImage::ImageLuma8(gray)\` (via the pdqhash::image re-export)
   - Call \`pdqhash::generate_pdq(&dyn_img)\` — returns Option<([u8;32], f32)>
   - Convert quality f32 (0.0–1.0) to PdqQuality(u8) via \`(quality * 100.0).round().clamp(0.0, 100.0) as u8\`
   - Return Ok(PdqResult { hash: PdqHash(bytes), quality: PdqQuality(...) })
5. Implement \`hash_dihedral_from_luma\`: compute the 8 dihedral variants via imageops, hash each, return [PdqResult; 8].
6. Add tests: hash_from_luma on a 256x256 deterministic luma → 32-byte hash, quality > 0; dihedral → 8 hashes; dimensions validation → PdqError; determinism.
7. \`cargo fmt --all && cargo clippy --workspace --all-targets -- -D warnings && cargo test -p hashkit\` from the workspace root. All green.
8. \`bash scripts/safety-check.sh\` from the workspace root. Must be clean.
9. Commit (Co-Authored-By trailer) + push (see worktree header).
10. Append your handoff to \`${HANDOFF_DOC}\` under \`### hashkit\`. 30s tick discipline.
11. Return the structured object.

**Acceptance:** branch_name = "agent/wave-a-hashkit"; commits_pushed = true; tests_passing = true. If you hit a hard blocker, still return the schema with commits_pushed:false and a detailed blockers[].`,

  'hashkit-match': `You are the **hashkit-match** implementation agent for Wave A (Foundation).

**Task:** Implement \`PdqMatcher::query\` and \`PdqMatcher::query_all\` — currently \`todo!()\`. v1.0 acceptance is "matches naive linear-scan ground truth on 1,000-hash sets over 100 random queries." MIH is a v2 hardening; do NOT attempt MIH this wave. Naive linear scan is the right v0.5/v1.0 baseline.

**Coordination boundary (binding):**
- Stay inside \`packages/hashkit-match/\`. Do NOT edit packages/hashkit, docs/roadmap.md, or any other package.
- You depend on \`hashkit::PdqHash\`, but build naive matching using just \`PdqHash::hamming\` (already implemented) + synthetic random [u8;32] hashes for tests. If you need real test vectors, flag it as a cross-track dep — do NOT call into hashkit's pdqhash work.

**Concrete steps:**
1. Confirm your pre-created worktree (see header): \`cd\` there, \`git status --short\`. Already on \`agent/wave-a-hashkit-match\` — do NOT create the branch.
2. Read \`packages/hashkit-match/Cargo.toml\` and \`src/lib.rs\`. Note PdqMatcher API: \`new\`, \`with_default_threshold\`, \`query\`, \`query_all\`, error types.
3. In \`new\`: also reject EmptySet when the iterator yields zero hashes (current code only rejects threshold>256).
4. \`query\`: naive linear scan; return the closest hash whose distance ≤ threshold (Some(MatchResult)), else None.
5. \`query_all\`: naive linear scan; return all matches sorted ascending by distance.
6. Add tests: query near-hit; query_all returns 3 ordered matches; EmptySet error; InvalidThreshold(>256); ground-truth test (100 random queries vs a hand-written linear scan over 1,000 hashes).
7. \`cargo fmt && cargo clippy --workspace --all-targets -- -D warnings && cargo test -p hashkit-match\` from workspace root. All green.
8. \`bash scripts/safety-check.sh\` from workspace root.
9. Commit (Co-Authored-By) + push (see header).
10. Append handoff to \`${HANDOFF_DOC}\` under \`### hashkit-match\`. 30s tick.
11. Return the structured object.

**Acceptance:** branch_name = "agent/wave-a-hashkit-match"; commits_pushed = true; tests_passing = true; status_change_proposed mentions naive matching ships at v0.5/v1.0 with MIH deferred to v2.0.`,

  'detectkit-test': `You are the **detectkit-test** implementation agent for Wave A (Foundation).

**Task:** Implement \`detectkit_test.fixtures.generate_image(identifier, seed, pattern, width=512, height=512)\` to produce deterministic PNG bytes for at least three patterns: \`gradient-horizontal\`, \`gradient-vertical\`, \`checkerboard\`. Current implementation raises NotImplementedError.

**Coordination boundary (binding):**
- Stay inside \`packages/detectkit-test/\`. Do NOT touch packages/hashkit (document the hash-recording dependency, don't edit it).
- Hash-recording (corpus.json) is OUT OF SCOPE for v0.5 — flag as cross-track for v1.0.

**Concrete steps:**
1. Confirm your pre-created worktree (see header): \`cd\` there, \`git status --short\`. Already on \`agent/wave-a-detectkit-test\` — do NOT create the branch.
2. Read \`packages/detectkit-test/pyproject.toml\` and \`src/detectkit_test/fixtures.py\`. Note the SyntheticImage / generate_image API.
3. Add deps to \`pyproject.toml\`: \`pillow>=10\`, \`numpy>=1.26\`.
4. Implement \`generate_image\` deterministically: seed numpy with \`hash((identifier, seed, pattern, width, height)) & 0xFFFFFFFF\`; gradient-horizontal (linspace across cols), gradient-vertical (across rows), checkerboard (32x32 tiles 0/255); wrap into PIL, save PNG to BytesIO, return bytes in a SyntheticImage dataclass.
5. Update tests/test_smoke.py: same args → byte-identical PNG; three patterns distinct; unsupported pattern raises ValueError (not NotImplementedError).
6. Add tests/test_cli.py: invoke \`detectkit-test generate --pattern checkerboard --out /tmp/x.png\` via subprocess; assert a valid PNG.
7. \`pip install -e ".[dev]" && ruff check src && pytest -q\` from \`packages/detectkit-test/\`.
8. \`bash scripts/safety-check.sh\` from workspace root.
9. Commit (Co-Authored-By) + push (see header).
10. Append handoff to \`${HANDOFF_DOC}\` under \`### detectkit-test\`. 30s tick.
11. Return the structured object.

**Acceptance:** branch_name = "agent/wave-a-detectkit-test"; commits_pushed = true; tests_passing = true; at least 3 patterns implemented.`,
}

// ---- Phase 0: preflight + explicit worktree provisioning --------------------
phase('Preflight')

const branchFor = (pkg) => BRANCH_PREFIX + pkg
const preflightPrompt = `You are the PREFLIGHT + WORKTREE PROVISIONER for the Wave A (Foundation) implementation workflow. You run BEFORE any package agent. Goals: (A) prove we target the correct repo, (B) create one git worktree per package, (C) return absolute paths. On ANY failed assertion, STOP and return ok=false with a precise abort_reason — never guess or "work around" a wrong repo.

Use the Bash tool. Constants (from docs/ops/orchestration/tracks.config.json):
- REPO_ROOT hint: ${REPO_ROOT_HINT}
- origin remote MUST contain: ${REMOTE_SLUG}
- base branch: ${BASE_BRANCH}
- worktree dir: ${WORKTREE_DIR}
- packages -> branches:
${PACKAGES.map((p) => `    ${p} -> ${branchFor(p)}`).join('\n')}

Steps, in order:
1. ROOT = \`git -C ${REPO_ROOT_HINT} rev-parse --show-toplevel\` (trimmed). If it errors (not a git repo), ABORT.
2. ORIGIN = \`git -C "$ROOT" remote get-url origin\`. Assert ORIGIN contains "${REMOTE_SLUG}". If not, ABORT (record origin_url + abort_reason="wrong repo: origin <ORIGIN> does not contain ${REMOTE_SLUG}").
3. Assert \`test -f "$ROOT/Cargo.toml"\` AND \`test -d "$ROOT/packages"\`. Set markers_ok; if either missing, ABORT naming the missing marker.
4. \`git -C "$ROOT" fetch origin --prune\`; then BASE_SHA = \`git -C "$ROOT" rev-parse origin/${BASE_BRANCH}\`. If either fails, ABORT.
5. Enumerate attached worktrees ONCE: \`git -C "$ROOT" worktree list --porcelain\`. Map branch ("branch refs/heads/<name>") -> worktree path (preceding "worktree <path>").
6. For EACH package/branch, compute CANON = "$ROOT/${WORKTREE_DIR}/<branch with '/' replaced by '-'>", then:
   a. If <branch> is ALREADY attached at some path P: REUSE it — path=P, created=false, tip=\`git -C "P" rev-parse HEAD\`. Do NOT run \`worktree add\`.
   b. Else if the branch exists but is unattached (\`git -C "$ROOT" show-ref --verify --quiet refs/heads/<branch>\`): \`git -C "$ROOT" worktree add "$CANON" <branch>\`; path=CANON, created=false, tip=\`git -C "$CANON" rev-parse HEAD\`.
   c. Else (no such branch): \`git -C "$ROOT" worktree add -b <branch> "$CANON" origin/${BASE_BRANCH}\`; path=CANON, created=true, tip=BASE_SHA.
   Do the adds SEQUENTIALLY (never in parallel).
7. Return via StructuredOutput: ok=true, repo_root=ROOT, origin_url=ORIGIN, markers_ok=true, base_ref_sha=BASE_SHA, worktrees=[{package,branch,path,created,tip} per package], abort_reason=null.

Do NOT implement any package code — you provision only. On abort, still return the schema with ok=false, fields you resolved, worktrees=[], and a precise abort_reason.`

const pre = await agent(preflightPrompt, { label: 'preflight', phase: 'Preflight', schema: PREFLIGHT_SCHEMA })

if (!pre || !pre.ok) {
  const reason = (pre && pre.abort_reason) || 'preflight agent returned no usable result'
  log(`PREFLIGHT ABORT — not dispatching any Wave A agents. Reason: ${reason}`)
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
    })
  })
)).filter(Boolean)

// ---- Phase 2: handoff aggregation -------------------------------------------
phase('Handoff aggregation')

const aggregated = await agent(
  `You are the Foundation track handoff scribe. The Wave A implementation agents have completed (or partially completed). Aggregate their handoffs into one markdown doc + integration plan for the Release Captain.

Results:
${JSON.stringify(results, null, 2)}

Output handoff_doc_markdown for ${HANDOFF_DOC} (one section per package: state, files changed, cross-track deps, blockers, branch to merge), integration_notes for the Release Captain, and merge_order (hashkit first — hashkit-match depends on real PdqHash semantically; detectkit-test can land any time). Be honest about partial completions or failures.`,
  { phase: 'Handoff aggregation', label: 'scribe', schema: HANDOFF_SCHEMA }
)

return { preflight: pre, results, aggregated }
