# Handoff: v1-legal-infra (Wave C — Credentialed Infrastructure + Legal/Ops)

Current state (30s tick): trainguard v0.5 landed on `agent/wave-c-trainguard`
— LAION JSON reader + file-backed provider + Ed25519-signed compliance
report, end-to-end. 24 tests pass, ruff clean, safety-check clean. Other
Wave C tools (hashstream, cybertip-cli, evidencevault) tracked on their own
`agent/wave-c-*` branches; see their sections as they land.

This doc aggregates per-tool handoffs for the Wave C track. Each agent
appends its own `### <tool>` subsection and never edits another tool's
files. The Release Captain merges the `agent/wave-c-*` branches per
`docs/ops/release-captain-playbook.md`.

## Tools

### trainguard

**Branch:** `agent/wave-c-trainguard` (off `main` `f5c2f49`). **Commit:**
`1b2e4a9`. **Status proposal:** In Progress → **v0.5** (operator-supplied
dataset screening with a signed report works end-to-end).

**What changed** (all inside `packages/trainguard/`):

- `src/trainguard/readers.py`
  - `LaionJsonReader(path)` — reads a LAION-format JSON manifest of shape
    `{"items": [{"id", "url", "hash"}, ...]}` and yields `DatasetEntry`
    rows, decoding each item's hex `hash` into `pdq_hash`. Required `id` +
    `url` per item; missing-field or bad-shape manifests raise `ValueError`
    (fail fast, don't silently screen a truncated dataset). The Parquet
    `LaionReader` is left as a scaffold stub and now points callers at the
    JSON reader.
  - `parse_hash_lines(lines)` — shared newline-delimited hex hash-list
    parser: skips blanks and `#` comments, strips whitespace, lowercases,
    rejects non-hex lines. This mirrors hashstream's on-disk hash-file
    format **locally** so trainguard has no cross-track import.
- `src/trainguard/pipeline.py`
  - `HashListFileProvider(path, *, source, snapshot_id)` — a
    `HashListProvider` backed by a hash file. Loads via `parse_hash_lines`,
    enforces 32-byte PDQ width (rejects other widths at load), and matches
    by Hamming distance ≤ threshold. `source` + `snapshot_id` are
    operator-supplied provenance that flow into the report's
    `sources_consulted` / `snapshot_ids` and each match's `matched_against`.
  - `HashstreamProvider(...)` — STUB. `contains()` raises
    `NotImplementedError` (cross-track dep, see below).
  - `signing_payload(report)` — canonical signed bytes:
    `report_id || dataset_id || hash_list_versions || matches_total ||
    scanned_at`, NUL-separated, with `hash_list_versions` as sorted
    `source@snapshot` pairs (order-independent).
  - `scan_dataset(..., signing_key=None)` — new optional keyword. When a
    32-byte raw Ed25519 private key is supplied, the assembled report is
    signed over `signing_payload`; when `None`, the report is left unsigned
    and a `WARNING` is logged ("not tamper-evident"). The existing
    keyword-only signature and `(report, matches)` return shape are
    unchanged, so all prior tests still pass.
- `src/trainguard/types.py`
  - `hamming_distance(a, b)` — hex-facing Hamming helper (byte-level hot
    path stays in `pipeline._hamming`).
  - `ComplianceReport.signature: bytes | None` field + `is_signed` property.
    The dataclass stays `frozen=True, slots=True`; the pipeline rebuilds the
    report with the signature attached.
- `src/trainguard/__init__.py` — re-exports the new public names.
- `pyproject.toml` — added `cryptography>=42` to runtime deps (Ed25519).
- `tests/test_pipeline.py` — 13 new tests on top of the original 11:
  hex hamming, LAION reader (happy + bad-shape + missing-field), file
  provider (parse/normalize + width rejection), hashstream stub, unsigned
  warning, signed-report verification, the **end-to-end** LAION-file →
  match → signed-report flow (5-item manifest, exactly 2 matches, custody
  fields populated, signature verifies with the operator pubkey, tamper
  check), and a **v0.5-scale 100-image** manifest scan. **All fixtures are
  synthetic and written at test time — no real LAION data is committed.**

**Acceptance evidence (v0.5):** scanning a 100-image LAION-format manifest
against a hash list produces a `ComplianceReport` with every
chain-of-custody field populated (`report_id`, `dataset_id`,
`dataset_size`, `sources_consulted`, `snapshot_ids`, `scanned_at_iso`,
`chain_of_custody`) and a valid Ed25519 signature (operator-supplied key).
`pip install -e ".[dev]"` → `ruff check src tests` clean → `pytest -q`
24 passed → `bash scripts/safety-check.sh --staged` clean.

**Tested:** `cd packages/trainguard && pip install -e ".[dev]" && ruff
check src && pytest -q` (24 passed); `bash scripts/safety-check.sh
--staged` from worktree root (clean).

**Files changed:** `packages/trainguard/{pyproject.toml,
src/trainguard/__init__.py, src/trainguard/pipeline.py,
src/trainguard/readers.py, tests/test_pipeline.py}`.

**Status-file note for the Release Captain:** `packages/trainguard/STATUS`
still reads the Wave-3 scaffold line; per the cadence rule agents don't edit
`docs/roadmap.md` in-worktree. Suggest updating STATUS + roadmap to
reflect v0.5 (LAION JSON reader + file-backed provider + signed report) at
integration time.

**Blocked:** nothing for the file-backed path.

## Cross-track dependencies

- **trainguard → hashstream:** the production `HashstreamProvider` is a stub
  (`NotImplementedError`) pending hashstream's snapshot-serving HTTP API
  (sibling Wave C task). The file-backed `HashListFileProvider` is the
  end-to-end v0.5 path and needs nothing from hashstream. trainguard
  deliberately re-implements hashstream's newline-delimited hex hash-file
  format locally (`readers.parse_hash_lines`) rather than importing
  hashstream, to avoid a build-time cross-track coupling; if that format
  ever diverges, reconcile the two parsers. Do not edit hashstream's files
  from this branch.
