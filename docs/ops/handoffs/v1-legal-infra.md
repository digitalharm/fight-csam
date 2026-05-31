# v1 Legal Infrastructure — Wave Handoffs

Per-package handoffs for the credentialed-infrastructure wave. Each section is
written so the next agent (or a human reviewer) can pick up cold.

### hashstream

**Branch:** `agent/wave-c-hashstream` (pushed to origin; cut from `main`).
**Scope:** `packages/hashstream/` only (Go service + TypeScript SDK). No other
packages touched. Hash-file format kept as newline-delimited hex `[u8;32]`.
Real NCMEC / IWF / Project Arachnid credentialed sync remains out of scope.

**What shipped (v0.5): operator-supplied hash ingestion + Ed25519 signing.**

The v0.5 acceptance path works end-to-end and was verified both in tests and
against a running daemon:

- POST a hash file → the service stores it as a snapshot.
- GET serves the correct snapshot back (by id and via `/latest`).
- Diff between two snapshots returns the exact delta.
- Snapshots are signed (Ed25519, operator-supplied key) so even
  fake-provider / self-hosted flows carry a tamper-evident signal.

Store (`internal/store/`)
- Added `SourceLocal` plus `KnownSources` / `IsKnownSource`; the service now
  advertises all four sources.
- New `Hash [32]byte`. `Snapshot` carries an inline `Hashes []Hash` set for
  operator lists, so GET and diff are exact. `DiffSnapshots` computes
  added/removed/unchanged from the sets, with a count-approximation fallback
  when inline hashes are absent (credentialed-upstream blobs not yet fetched).
- `Snapshot` gained `Signature []byte` and `SigningKeyID string`.
- `json.go`: custom (de)serialization for the snake_case wire contract the SDK
  consumes — `hashes_hex[]`, `signature` (base64, `null` when unsigned),
  `signing_key_id`. `ListSnapshots` ordering made deterministic.
- `hash.go`: `ParseHashHex` / `ParseHashesHex`.

Signing (`internal/signing/`)
- Detached Ed25519 signature over the canonical payload
  `id "\n" sortedLowercaseHexHashes(joined by "\n") "\n" createdAtUnixSeconds`.
- Operator key loaded from PKCS#8 PEM, raw 64-byte key, or 32-byte seed.
- Key id = hex of the first 8 bytes of `sha256(pubkey)`.
- `Sign(snap)` / `Verify(snap, pub)` / `ParsePublicKey`.

Server / daemon
- `POST /sources/{source}/snapshots` — body `{ snapshot_id, hashes_hex[],
  version? }`. Validates the source, parses hex hashes, returns 409 on a
  duplicate id, stamps `created_at`, signs when a key is configured, and
  returns 201 with the snapshot. GET endpoints serve the signature.
- `hashstreamd --signing-key <path>` (or `$HASHSTREAM_SIGNING_KEY`) enables
  signing.

TypeScript SDK (`sdk-ts/`)
- `client.putSnapshot(source, snapshotId, hashesHex)` and
  `client.verifySnapshotSignature(snapshot, pubkeyPem)`, plus an exported
  `snapshotSigningPayload()` and standalone `verifySnapshotSignature()`. The
  verifier reconstructs the exact canonical payload and checks the signature
  with `node:crypto` (lazy-imported so the client stays browser-safe). Tracked
  `dist/` was rebuilt.

**Verification (all green):**
- `cd packages/hashstream && gofmt -l . && go build ./... && go vet ./... && go test ./...` — pass.
- `cd packages/hashstream/sdk-ts && npm install && npx tsc --noEmit && npx tsc && node --test dist/index.test.js` — 12/12 pass.
- Live daemon smoke (signing enabled): `/health`, `/sources` (4 sources),
  POST×2, GET, `/latest`, `/diff` (added_n=1 removed_n=1 unchanged_n=2 for
  {1,2,3} vs {2,3,4}), duplicate→409, unknown source→400, bad hex→400, GET on
  POST route→405, `ncmec` source→201.
- Cross-language interop: a Go-signed snapshot served over HTTP verifies with
  the TS SDK; a tampered copy fails.
- `bash scripts/safety-check.sh --staged` — clean.

**Coordination / merge note.** The in-flight `codex/release-v1-legal-infra`
worktree contains a *different* uncommitted `internal/store/store.go` design
that adds `PutSnapshotHashes` / `GetSnapshotHashes` to the `Store` interface
plus a side hashes map. This branch instead carries hashes inline on
`Snapshot` and diffs from them. Only one store design can land; reconcile
before merging both. (Also: a stray empty `agent/wave-c-hashstream` branch was
created in the unrelated `addiction-research` repo during setup and can be
deleted there — this work lives in `digitalharm-oss`.)
