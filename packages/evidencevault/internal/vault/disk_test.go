package vault

import (
	"context"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"github.com/digitalharm/digitalharm-oss/packages/evidencevault/internal/custody"
	"github.com/digitalharm/digitalharm-oss/packages/evidencevault/internal/retention"
)

func newDiskPackage(id string, storedAt time.Time) Package {
	return Package{
		ID:             id,
		Ciphertext:     []byte("wrapped-ciphertext"),
		ContentRefHash: "sha256-deadbeef",
		Custody:        custody.NewLog(id, "ingestion", "intake", storedAt),
		Retention: retention.State{
			StoredAt: storedAt,
			Schedule: retention.USFederal2258A,
		},
	}
}

func TestDiskStoreAndGet(t *testing.T) {
	dir := t.TempDir()
	v, err := NewDiskVault(dir, nil)
	if err != nil {
		t.Fatalf("new disk vault: %v", err)
	}
	ctx := context.Background()
	if err := v.Store(ctx, newDiskPackage("ev-1", time.Now())); err != nil {
		t.Fatalf("store: %v", err)
	}
	// File should exist on disk.
	if _, err := os.Stat(filepath.Join(dir, "ev-1.json")); err != nil {
		t.Fatalf("expected ev-1.json on disk: %v", err)
	}
	pkg, err := v.Get(ctx, "ev-1", "auditor", "audit-2026-01")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if pkg.ID != "ev-1" {
		t.Errorf("id=%s want=ev-1", pkg.ID)
	}
	// Stored genesis + one accessed entry.
	if len(pkg.Custody.Entries) != 2 {
		t.Errorf("custody entries=%d want=2", len(pkg.Custody.Entries))
	}
}

func TestDiskStoreDuplicateRejected(t *testing.T) {
	v, err := NewDiskVault(t.TempDir(), nil)
	if err != nil {
		t.Fatalf("new: %v", err)
	}
	ctx := context.Background()
	_ = v.Store(ctx, newDiskPackage("ev-1", time.Now()))
	if err := v.Store(ctx, newDiskPackage("ev-1", time.Now())); err != ErrAlreadyExists {
		t.Errorf("want ErrAlreadyExists, got %v", err)
	}
}

func TestDiskGetMissing(t *testing.T) {
	v, err := NewDiskVault(t.TempDir(), nil)
	if err != nil {
		t.Fatalf("new: %v", err)
	}
	if _, err := v.Get(context.Background(), "missing", "op", "purpose"); err != ErrNotFound {
		t.Errorf("want ErrNotFound, got %v", err)
	}
}

// TestDiskPersistsAcrossRestart is the headline acceptance test: write with one
// instance, drop it, open a fresh instance on the same directory, and confirm
// the package (and its verifiable custody chain) is intact.
func TestDiskPersistsAcrossRestart(t *testing.T) {
	dir := t.TempDir()
	ctx := context.Background()

	// First instance: store + access (so the custody chain has >1 entry).
	v1, err := NewDiskVault(dir, nil)
	if err != nil {
		t.Fatalf("new v1: %v", err)
	}
	if err := v1.Store(ctx, newDiskPackage("ev-persist", time.Now())); err != nil {
		t.Fatalf("store: %v", err)
	}
	if _, err := v1.Get(ctx, "ev-persist", "auditor", "first-read"); err != nil {
		t.Fatalf("get v1: %v", err)
	}

	// Simulate a process restart: a brand-new vault over the same directory.
	v2, err := NewDiskVault(dir, nil)
	if err != nil {
		t.Fatalf("new v2: %v", err)
	}
	pkg, err := v2.Get(ctx, "ev-persist", "auditor", "after-restart")
	if err != nil {
		t.Fatalf("get v2 after restart: %v", err)
	}
	if pkg.ID != "ev-persist" {
		t.Errorf("id=%s want=ev-persist", pkg.ID)
	}
	if string(pkg.Ciphertext) != "wrapped-ciphertext" {
		t.Errorf("ciphertext=%q want=wrapped-ciphertext", pkg.Ciphertext)
	}
	if pkg.ContentRefHash != "sha256-deadbeef" {
		t.Errorf("content ref hash not persisted: %q", pkg.ContentRefHash)
	}
	// genesis + first-read(v1) + after-restart(v2) = 3 entries.
	if len(pkg.Custody.Entries) != 3 {
		t.Errorf("custody entries=%d want=3", len(pkg.Custody.Entries))
	}
	// The tamper-evident chain must still verify after a serialize/deserialize.
	if err := pkg.Custody.Verify(); err != nil {
		t.Errorf("custody chain broken across restart: %v", err)
	}
	if pkg.Retention.Schedule.Jurisdiction != retention.JurisdictionUSFederal {
		t.Errorf("retention schedule not persisted: %+v", pkg.Retention.Schedule)
	}
}

func TestDiskPlaceHoldBlocksDeleteAndSurvivesRestart(t *testing.T) {
	dir := t.TempDir()
	ctx := context.Background()
	v1, err := NewDiskVault(dir, nil)
	if err != nil {
		t.Fatalf("new: %v", err)
	}
	_ = v1.Store(ctx, newDiskPackage("ev-1", time.Now()))
	if err := v1.PlaceHold(ctx, "ev-1", "counsel", "lit-2026-001"); err != nil {
		t.Fatalf("place hold: %v", err)
	}
	if err := v1.Delete(ctx, "ev-1", "retention-bot"); err != ErrOnHold {
		t.Errorf("want ErrOnHold, got %v", err)
	}

	// Restart: hold must persist.
	v2, err := NewDiskVault(dir, nil)
	if err != nil {
		t.Fatalf("new v2: %v", err)
	}
	if err := v2.Delete(ctx, "ev-1", "retention-bot"); err != ErrOnHold {
		t.Errorf("after restart want ErrOnHold, got %v", err)
	}
	// Release then delete should succeed.
	if err := v2.ReleaseHold(ctx, "ev-1", "counsel", "lit-resolved"); err != nil {
		t.Fatalf("release: %v", err)
	}
	if err := v2.Delete(ctx, "ev-1", "retention-bot"); err != nil {
		t.Fatalf("delete after release: %v", err)
	}
}

func TestDiskDeleteZeroesCiphertextKeepsCustody(t *testing.T) {
	dir := t.TempDir()
	ctx := context.Background()
	v, err := NewDiskVault(dir, nil)
	if err != nil {
		t.Fatalf("new: %v", err)
	}
	_ = v.Store(ctx, newDiskPackage("ev-1", time.Now()))
	if err := v.Delete(ctx, "ev-1", "retention-bot"); err != nil {
		t.Fatalf("delete: %v", err)
	}
	// Re-open to confirm the zeroing is durable.
	v2, err := NewDiskVault(dir, nil)
	if err != nil {
		t.Fatalf("new v2: %v", err)
	}
	pkg, err := v2.Get(ctx, "ev-1", "auditor", "post-deletion-audit")
	if err != nil {
		t.Fatalf("get after delete: %v", err)
	}
	if pkg.Ciphertext != nil {
		t.Errorf("expected ciphertext nil after deletion, got %q", pkg.Ciphertext)
	}
	if !pkg.Custody.IsDeleted() {
		t.Error("expected custody log to be terminal (deleted)")
	}
	// Post-deletion Get must NOT append a new entry (chain is terminal).
	// store + delete = 2 entries; no accessed entry added.
	if len(pkg.Custody.Entries) != 2 {
		t.Errorf("custody entries=%d want=2 (no post-deletion append)", len(pkg.Custody.Entries))
	}
}

func TestDiskListExpiredAcrossRestart(t *testing.T) {
	dir := t.TempDir()
	ctx := context.Background()
	v1, err := NewDiskVault(dir, nil)
	if err != nil {
		t.Fatalf("new: %v", err)
	}
	// One expired (stored long ago), one fresh.
	_ = v1.Store(ctx, newDiskPackage("ev-old", time.Now().Add(-1000*24*time.Hour)))
	_ = v1.Store(ctx, newDiskPackage("ev-new", time.Now()))

	v2, err := NewDiskVault(dir, nil)
	if err != nil {
		t.Fatalf("new v2: %v", err)
	}
	expired, err := v2.ListExpired(ctx, time.Now())
	if err != nil {
		t.Fatalf("list expired: %v", err)
	}
	if len(expired) != 1 || expired[0] != "ev-old" {
		t.Errorf("expired=%v want=[ev-old]", expired)
	}

	// A hold should suspend expiry.
	if err := v2.PlaceHold(ctx, "ev-old", "counsel", "lit"); err != nil {
		t.Fatalf("hold: %v", err)
	}
	expired, _ = v2.ListExpired(ctx, time.Now())
	if len(expired) != 0 {
		t.Errorf("expected nothing expired under hold, got %v", expired)
	}
}

func TestDiskRejectsUnsafeIDs(t *testing.T) {
	v, err := NewDiskVault(t.TempDir(), nil)
	if err != nil {
		t.Fatalf("new: %v", err)
	}
	ctx := context.Background()
	for _, bad := range []string{"", "..", ".", "a/b", "../escape", `a\b`} {
		if err := v.Store(ctx, newDiskPackage(bad, time.Now())); err != ErrInvalidID {
			t.Errorf("Store(%q): want ErrInvalidID, got %v", bad, err)
		}
		if _, err := v.Get(ctx, bad, "op", "p"); err != ErrInvalidID {
			t.Errorf("Get(%q): want ErrInvalidID, got %v", bad, err)
		}
	}
}

// TestDiskConcurrentGetsSerialize hammers a single package with concurrent Get
// calls. Each Get is a read-modify-write that appends one Accessed entry; the
// per-package lock must serialize them so no append is lost and the custody
// chain stays verifiable. Run under `go test -race` to catch data races.
func TestDiskConcurrentGetsSerialize(t *testing.T) {
	dir := t.TempDir()
	v, err := NewDiskVault(dir, nil)
	if err != nil {
		t.Fatalf("new: %v", err)
	}
	ctx := context.Background()
	if err := v.Store(ctx, newDiskPackage("ev-hot", time.Now())); err != nil {
		t.Fatalf("store: %v", err)
	}

	const n = 25
	var wg sync.WaitGroup
	errs := make(chan error, n)
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if _, err := v.Get(ctx, "ev-hot", "auditor", "concurrent"); err != nil {
				errs <- err
			}
		}()
	}
	wg.Wait()
	close(errs)
	for err := range errs {
		t.Fatalf("concurrent get: %v", err)
	}

	pkg, err := v.Get(ctx, "ev-hot", "auditor", "final")
	if err != nil {
		t.Fatalf("final get: %v", err)
	}
	// genesis + n concurrent + 1 final = n+2 entries, none lost.
	if got := len(pkg.Custody.Entries); got != n+2 {
		t.Errorf("custody entries=%d want=%d (lost an append under contention)", got, n+2)
	}
	if err := pkg.Custody.Verify(); err != nil {
		t.Errorf("custody chain broken under concurrency: %v", err)
	}
}

func TestDiskNoTempFilesLeftBehind(t *testing.T) {
	dir := t.TempDir()
	ctx := context.Background()
	v, err := NewDiskVault(dir, nil)
	if err != nil {
		t.Fatalf("new: %v", err)
	}
	_ = v.Store(ctx, newDiskPackage("ev-1", time.Now()))
	_, _ = v.Get(ctx, "ev-1", "op", "p")
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatalf("readdir: %v", err)
	}
	for _, e := range entries {
		if filepath.Ext(e.Name()) == ".tmp" {
			t.Errorf("leftover temp file: %s", e.Name())
		}
	}
	if len(entries) != 1 {
		t.Errorf("expected exactly 1 file (ev-1.json), got %d: %v", len(entries), entries)
	}
}
