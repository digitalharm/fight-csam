# v1 Legal-Infra — Wave C handoff

Track: Legal/Ops (cybertip-cli, hashstream, evidencevault, trainguard).
This file collects per-package handoffs for the v1 legal-infra release.

### evidencevault

**v0.5 shipped — HTTP API + disk persistence.** Branch `agent/wave-c-evidencevault`.

What landed (all inside `packages/evidencevault/`):

- **HTTP surface** (`cmd/evidencevaultd/{server.go,main.go}`) over `net/http`,
  wired to the injected `vault.Vault` interface so backends swap cleanly:
  - `POST /packages` — store; `201` + `{"package_id"}`
  - `GET /packages/{id}?operator=X&purpose=Y` — get; appends an `accessed`
    custody entry (skipped once the package is deleted — terminal chain)
  - `POST /packages/{id}/hold` `{operator, hold_ref}` — place litigation hold
  - `DELETE /packages/{id}/hold` — release hold
  - `DELETE /packages/{id}?operator=X` — delete (zeroes ciphertext, preserves
    custody; `409` if on hold)
  - `GET /packages/{id}/custody` — full chain-of-custody log
  - `GET /expired?as_of=<RFC3339>` — ids past retention (not held, not deleted)
- **`evidencevaultd serve`** with `--store=memory:: | disk:/path` and `--addr`,
  graceful shutdown on SIGINT/SIGTERM.
- **DiskVault** (`internal/vault/disk.go`) — one `<store_dir>/<id>.json` per
  package (ciphertext + custody + retention), atomic temp-file+rename writes at
  `0600`, read→mutate→write per op, per-package mutex (same-id ops serialize,
  different ids parallelize), path-traversal-safe id validation. Mirrors
  `InMemoryVault` semantics exactly.
- **noop-KMS** (`vault.NoopKMS`) — operator-supplied-encryption seam; stores
  ciphertext as given (no confidentiality; documented as replace-in-production).

Verification: `go build ./...`, `go vet ./...`, `go test ./...` green;
`bash scripts/safety-check.sh` clean. Manual curl smoke confirmed the full
lifecycle (Store → Get → PlaceHold → Get-while-held → ReleaseHold → Delete →
Get-after-delete) and that the disk backend survives a process restart (kill the
daemon, restart on the same `--store` dir, custody chain intact and `Verify()`s).

Curl recipe (full version in the package README):

```bash
BASE=http://127.0.0.1:8080
curl -X POST "$BASE/packages" -H 'Content-Type: application/json' \
  -d '{"id":"ev-1","ciphertext":"aGVsbG8=","content_ref_hash":"sha256-abc","operator":"ts-op"}'
curl "$BASE/packages/ev-1?operator=auditor&purpose=subpoena-2026-014"
curl -X POST "$BASE/packages/ev-1/hold" -H 'Content-Type: application/json' \
  -d '{"operator":"counsel","hold_ref":"lit-2026-001"}'
curl -X DELETE "$BASE/packages/ev-1/hold?operator=counsel&hold_ref=lit-resolved"
curl -X DELETE "$BASE/packages/ev-1?operator=retention-bot"
curl "$BASE/packages/ev-1?operator=auditor&purpose=post-mortem"   # ciphertext: null
```

**Still pending counsel (unchanged):** retention **enforcement**. Schedules
(US/EU/UK/AU) are queryable and litigation hold correctly suspends expiry, but
there is **no timer-driven destruction** — `GET /expired` reports eligibility
only and every deletion is an explicit, audited `DELETE`. Timer enforcement and
the jurisdiction timer values stay gated on `docs/counsel-scope-brief.md`; all
schedules retain their `counsel review pending` marker. Encryption remains
operator-supplied (the shipped KMS is a noop).

Scope honored: changes confined to `packages/evidencevault/` (plus this handoff
note). `internal/vault/vault.go` (InMemoryVault) was left untouched — its
read-modify-write is already correctly mutex-guarded; no bug to fix there.

### cybertip-cli

(awaiting handoff)

### hashstream

(awaiting handoff)

### trainguard

(awaiting handoff)
