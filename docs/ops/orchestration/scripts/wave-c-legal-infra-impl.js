// =============================================================================
// Wave C (Credentialed + Legal) implementation workflow — CORRECTED / repo-safe.
//
// Supersedes the buggy session-artifact script
//   ~/.claude/projects/-Users-colin-Code-addiction/35598985-.../workflows/scripts/
//     wave-c-credentialed-legal-impl-wf_44682382-dd6.js
// which used `isolation: 'worktree'` and, launched from the /Users/colin/Code/addiction
// session, cut every agent's worktree from the WRONG repo (addiction-research). That
// run was also KILLED mid-flight, so this corrected version is the one to re-run.
//
// Same fix as wave-b-adoption-impl.js: phase-0 preflight asserts the repo + ABORTS if
// wrong, then provisions worktrees explicitly + idempotently (reuses an already
// attached branch — important here, since some agent/wave-c-* branches/worktrees
// already exist from the killed run). `isolation` removed; absolute paths injected.
// See ../README.md and ../tracks.config.json (constants below mirror it).
// =============================================================================

export const meta = {
  name: 'wave-c-legal-infra-impl',
  description: 'Credentialed + Legal wave (hashstream, trainguard, cybertip-cli, evidencevault): preflight repo guard + explicit idempotent worktree provisioning in fight-csam, then four impl agents. Safe to re-run after the killed original.',
  phases: [
    { title: 'Preflight' },
    { title: 'Package implementation' },
    { title: 'Handoff aggregation' },
  ],
}

// ---- Track config (mirror of docs/ops/orchestration/tracks.config.json) ------
const REPO_ROOT_HINT = '/Users/colin/Code/fight-csam'
const REMOTE_SLUG = 'digitalharm/fight-csam'
const BASE_BRANCH = 'main'
const WORKTREE_DIR = '.worktrees'
const BRANCH_PREFIX = 'agent/wave-c-'
const PACKAGES = ['hashstream', 'trainguard', 'cybertip-cli', 'evidencevault']
const HANDOFF_DOC = 'docs/ops/handoffs/v1-legal-infra.md'

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

const worktreeHeader = (wt) => `**WORKTREE (binding — read before anything else):**
Your git worktree has ALREADY been created for you at:
    ${wt.path}
on branch \`${wt.branch}\` (freshly_created=${wt.created}, current tip=${wt.tip}).

- Do ALL work inside that directory. Start with: \`cd ${wt.path}\`
- Do NOT run \`git worktree add\` and do NOT \`git checkout -b\` — the branch already exists and is checked out here.
- Do NOT cd into any other repository. This workflow may be launched from a different repo's session; the absolute path above is the ONLY correct location. If you see a Next.js/\`app/\` layout or a missing \`packages/\` dir, STOP — you are in the wrong place; report it as a blocker.
- If freshly_created=false a prior (possibly interrupted) run may have left commits or edits on this branch (the original Wave C run was killed mid-flight): run \`git -C ${wt.path} status --short\` and \`git -C ${wt.path} log --oneline origin/${BASE_BRANCH}..HEAD\` first and BUILD ON / verify existing work rather than starting over.
- When done: commit on \`${wt.branch}\`, then \`git -C ${wt.path} push -u origin ${wt.branch}\`.

`

const PKG_TASKS = {
  'hashstream': `You are the **hashstream** implementation agent for Wave C (Credentialed Infrastructure).

**Task:** Ship operator-supplied hash file ingestion end-to-end. v0.5 acceptance: POST a hash file → service stores it as a snapshot → GET serves correct snapshot → diff between two snapshots returns the right delta. Also: signed snapshot manifests (Ed25519, operator-supplied key).

**Coordination boundary (binding):**
- Stay inside \`packages/hashstream/\` (Go service + sdk-ts TypeScript SDK). Do NOT edit other packages.
- "Hash file" format: newline-delimited hex-encoded [u8;32] strings. NCMEC/IWF/Arachnid real-credential sync stays out of scope (no creds).

**Concrete steps:**
1. Confirm your pre-created worktree (see header): \`cd\` there, \`git status --short\`. Already on \`agent/wave-c-hashstream\` — do NOT create the branch.
2. Read \`packages/hashstream/internal/{server,store,adapter}/\` and \`sdk-ts/src/index.ts\`.
3. Server: add POST /sources/{source}/snapshots — body \`{ snapshot_id, hashes_hex: string[] }\`; validate source (add a "Local" source for operator lists); compute hash_count/created_at; store; return 201.
4. Snapshot signing: Ed25519 layer; server --signing-key flag; sign over (snapshot_id || hash_list_serialized || created_at_unix); add \`signature\` + \`signing_key_id\` (sha256 prefix of pubkey); include signature in GET responses.
5. TS SDK: \`client.putSnapshot(source, snapshotId, hashesHex)\` + \`client.verifySnapshotSignature(snapshot, pubkeyPem)\`.
6. Tests: extend server_test.go (POST + verify) and sdk-ts tests (put + verify).
7. \`cd packages/hashstream && go build ./... && go vet ./... && go test ./...\` all green.
8. \`cd packages/hashstream/sdk-ts && npm install && npx tsc --noEmit && npx tsc && node --test dist/index.test.js\` green.
9. \`bash scripts/safety-check.sh\` clean.
10. Commit (Co-Authored-By) + push (see header). NOTE: if the agent added golang.org/x/crypto, run \`go mod tidy\` so go.sum is complete.
11. Append handoff to \`${HANDOFF_DOC}\` under \`### hashstream\`. 30s tick.
12. Return the structured object.

**Acceptance:** POST endpoint works; signed snapshots verifiable; status_change_proposed mentions v0.5 with operator-supplied lists end-to-end + Ed25519 signing.`,

  'trainguard': `You are the **trainguard** implementation agent for Wave C (Credentialed Infrastructure).

**Task:** Ship a real LAION-format JSON reader + end-to-end \`scan_dataset\` against an operator-supplied hash list, producing a signed compliance report with full chain-of-custody. v0.5 acceptance: scan a 100-image LAION-format manifest against a hash list; report with all chain-of-custody fields; report signed (Ed25519 with operator-supplied key).

**Coordination boundary (binding):**
- Stay inside \`packages/trainguard/\`. The hashstream-backed provider can stay a stub (cross-track dep); your file-backed provider works end-to-end. Use a synthetic LAION fixture — do NOT commit real LAION data.

**Concrete steps:**
1. Confirm your pre-created worktree (see header): \`cd\` there, \`git status --short\`. Already on \`agent/wave-c-trainguard\` — do NOT create the branch. (This branch likely already carries v0.5 work from the killed run — verify before redoing.)
2. Read \`packages/trainguard/src/trainguard/{pipeline,readers,types}.py\`. Note InMemoryHashListProvider + scan_dataset.
3. LAION reader: \`LaionJsonReader\` in readers.py — reads \`{"items":[{"id","url","hash"},...]}\`, yields LaionRecord dataclasses.
4. HashListFileProvider: loads newline-delimited hex hashes (same format hashstream accepts).
5. End-to-end scan_dataset: with LaionJsonReader + HashListFileProvider, compare each record hash against the list via a tiny hamming helper in types.py, record matches with custody metadata.
6. ComplianceReport signing: Ed25519 over (report_id || dataset_path || hash_list_versions || matches_count || generated_at); optional signing_key (None → unsigned + warning); add signature field.
7. Tests: extend tests/test_pipeline.py with end-to-end LAION-file → match → signed-report (5-item synthetic JSON + 3-hash list, 2 match; assert matches_count==2, signature verifies).
8. \`pip install -e ".[dev]" && ruff check src && pytest -q\` green.
9. \`bash scripts/safety-check.sh\` clean.
10. Commit (Co-Authored-By) + push (see header).
11. Append handoff to \`${HANDOFF_DOC}\` under \`### trainguard\`. 30s tick.
12. Return the structured object.

**Acceptance:** LAION reader + file-backed provider + signed report work end-to-end; status_change_proposed mentions v0.5 with operator-supplied dataset screening.`,

  'cybertip-cli': `You are the **cybertip-cli** implementation agent for Wave C (Legal/Ops).

**Task:** Document the NCMEC sandbox endpoint and ship a working sandbox submission path. v0.5 acceptance: \`cybertip submit --sandbox\` validates the report, generates the wire payload, and prints the submission result. Production path stays explicitly blocked with a clear "counsel sign-off required" error.

**Coordination boundary (binding):**
- Stay inside \`packages/cybertip-cli/\` (both node/ and python/). Do NOT wire any production endpoint or embed real credentials. "Sandbox" = validate + format + simulate-POST (log the curl-equivalent that WOULD be sent); do NOT actually POST.

**Concrete steps:**
1. Confirm your pre-created worktree (see header): \`cd\` there, \`git status --short\`. Already on \`agent/wave-c-cybertip-cli\` — do NOT create the branch.
2. Read \`packages/cybertip-cli/{node,python}/src/\` — submit.ts and submit.py have dry-run support.
3. Sandbox path (both languages): \`SubmitMode\` enum DryRun|Sandbox|Production. DryRun = existing. Sandbox = validate + format + simulate POST (log curl-equivalent + redacted summary), no network. Production = throws "counsel sign-off required: see packages/cybertip-cli/docs/counsel-scope-brief.md".
4. CLI: add \`--mode sandbox|dry-run|production\` flag.
5. Tests: extend test_model.py / report.test.ts (sandbox logs curl-equivalent; production errors with counsel-pending message).
6. Doc: in \`packages/cybertip-cli/docs/counsel-scope-brief.md\` add "Sandbox vs production" with the NCMEC sandbox URL documented as operator-supplied via env var \`NCMEC_SANDBOX_URL\` (do NOT embed as a default).
7. Run all tests in both subdirs (node test + pytest). \`bash scripts/safety-check.sh\` clean.
8. Commit (Co-Authored-By) + push (see header).
9. Append handoff to \`${HANDOFF_DOC}\` under \`### cybertip-cli\`. 30s tick.
10. Return the structured object.

**Acceptance:** Sandbox path works in both languages; production path errors loudly; status_change_proposed mentions v0.5 with sandbox simulation working.`,

  'evidencevault': `You are the **evidencevault** implementation agent for Wave C (Legal/Ops).

**Task:** Wire HTTP API + disk persistence. v0.5 acceptance: \`evidencevaultd serve\` accepts curl through the full lifecycle (Store → Get → PlaceHold → Get-while-held → ReleaseHold → Delete → Get-after-delete). Disk backend persists across restart.

**Coordination boundary (binding):**
- Stay inside \`packages/evidencevault/\`. Counsel-gated retention ENFORCEMENT stays pending (schedules queryable but not enforced). Encryption is operator-supplied (KMS interface); for v0.5 ship a noop-KMS storing ciphertext as-given; document in README.

**Concrete steps:**
1. Confirm your pre-created worktree (see header): \`cd\` there, \`git status --short\`. Already on \`agent/wave-c-evidencevault\` — do NOT create the branch. (This branch likely already carries v0.5 work from the killed run — verify before redoing.)
2. Read \`packages/evidencevault/{cmd/evidencevaultd,internal/{custody,retention,vault}}/\`. Note InMemoryVault + custody log + retention schedules.
3. HTTP API in \`cmd/evidencevaultd/main.go\`: POST /packages; GET /packages/:id?operator=X&purpose=Y; POST /packages/:id/hold; DELETE /packages/:id/hold; DELETE /packages/:id?operator=X (errors if on hold); GET /packages/:id/custody; GET /expired?as_of=.... Wire to an injected Vault interface.
4. DiskVault: new \`internal/vault/disk.go\` implementing Vault — persists each Package as \`<store_dir>/<package_id>.json\`; read→mutate→write; per-package locking.
5. CLI flag: --store=memory:: or --store=disk:/path.
6. Tests: existing in-memory pass; new httptest.Server tests over the HTTP API + in-memory; new disk tests (Store, kill instance, fresh instance reads same data).
7. \`cd packages/evidencevault && go build ./... && go vet ./... && go test ./...\` all green.
8. \`bash scripts/safety-check.sh\` clean.
9. Commit (Co-Authored-By) + push (see header).
10. Append handoff to \`${HANDOFF_DOC}\` under \`### evidencevault\`. 30s tick.
11. Return the structured object.

**Acceptance:** HTTP API + disk backend work; lifecycle curlable; status_change_proposed mentions v0.5 with HTTP + disk shipped, retention enforcement still pending counsel.`,
}

// ---- Phase 0: preflight + explicit worktree provisioning --------------------
phase('Preflight')

const branchFor = (pkg) => BRANCH_PREFIX + pkg
const preflightPrompt = `You are the PREFLIGHT + WORKTREE PROVISIONER for the Wave C (Credentialed + Legal) implementation workflow. You run BEFORE any package agent. Goals: (A) prove we target the correct repo, (B) create one git worktree per package, (C) return absolute paths. On ANY failed assertion, STOP and return ok=false with a precise abort_reason — never guess or "work around" a wrong repo.

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
5. Enumerate attached worktrees ONCE: \`git -C "$ROOT" worktree list --porcelain\`. Map branch ("branch refs/heads/<name>") -> worktree path (preceding "worktree <path>"). NOTE: if any agent/wave-c-* branch already exists with an attached worktree (e.g. an interrupted re-run), REUSE it — do not re-create. (As of the v0.5 session close these were merged and cleaned up, so a fresh run will create new worktrees from origin/main, which already carries the shipped v0.5 code.)
6. For EACH package/branch, compute CANON = "$ROOT/${WORKTREE_DIR}/<branch with '/' replaced by '-'>", then:
   a. If <branch> is ALREADY attached at some path P: REUSE it — path=P, created=false, tip=\`git -C "P" rev-parse HEAD\`. Do NOT run \`worktree add\` (this covers older-named worktrees like ${WORKTREE_DIR}/wave-c-trainguard).
   b. Else if the branch exists but is unattached (\`git -C "$ROOT" show-ref --verify --quiet refs/heads/<branch>\`): \`git -C "$ROOT" worktree add "$CANON" <branch>\`; path=CANON, created=false, tip=\`git -C "$CANON" rev-parse HEAD\`.
   c. Else (no such branch): \`git -C "$ROOT" worktree add -b <branch> "$CANON" origin/${BASE_BRANCH}\`; path=CANON, created=true, tip=BASE_SHA.
   Do the adds SEQUENTIALLY (never in parallel).
7. Return via StructuredOutput: ok=true, repo_root=ROOT, origin_url=ORIGIN, markers_ok=true, base_ref_sha=BASE_SHA, worktrees=[{package,branch,path,created,tip} per package], abort_reason=null.

Do NOT implement any package code — you provision only. On abort, still return the schema with ok=false, fields you resolved, worktrees=[], and a precise abort_reason.`

const pre = await agent(preflightPrompt, { label: 'preflight', phase: 'Preflight', schema: PREFLIGHT_SCHEMA })

if (!pre || !pre.ok) {
  const reason = (pre && pre.abort_reason) || 'preflight agent returned no usable result'
  log(`PREFLIGHT ABORT — not dispatching any Wave C agents. Reason: ${reason}`)
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
  `You are the Credentialed/Legal track handoff scribe. The Wave C implementation agents have completed (or partially completed). Aggregate their handoffs.

Results:
${JSON.stringify(results, null, 2)}

Output handoff_doc_markdown for ${HANDOFF_DOC} (one section per package), integration_notes for the Release Captain, and merge_order. Be honest about partial completions or failures.`,
  { phase: 'Handoff aggregation', label: 'scribe', schema: HANDOFF_SCHEMA }
)

return { preflight: pre, results, aggregated }
