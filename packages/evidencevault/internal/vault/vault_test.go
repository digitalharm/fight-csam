package vault

import (
	"context"
	"testing"
	"time"

	"github.com/digitalharm/digitalharm-oss/packages/evidencevault/internal/custody"
	"github.com/digitalharm/digitalharm-oss/packages/evidencevault/internal/retention"
)

func newPackage(id string) Package {
	stored := time.Now()
	return Package{
		ID:             id,
		Ciphertext:     []byte("ciphertext"),
		ContentRefHash: "sha256-deadbeef",
		Custody:        custody.NewLog(id, "ingestion", "intake", stored),
		Retention: retention.State{
			StoredAt: stored,
			Schedule: retention.USFederal2258A,
		},
	}
}

func TestStoreAndGet(t *testing.T) {
	v := NewInMemoryVault(nil)
	ctx := context.Background()
	if err := v.Store(ctx, newPackage("ev-1")); err != nil {
		t.Fatalf("store: %v", err)
	}
	pkg, err := v.Get(ctx, "ev-1", "auditor", "audit-2026-01")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if pkg.ID != "ev-1" {
		t.Errorf("id=%s want=ev-1", pkg.ID)
	}
	// Get should have appended an Accessed entry to the canonical log.
	canonical, _ := v.Get(ctx, "ev-1", "second-auditor", "audit-2")
	// 1 stored + 2 accessed
	if len(canonical.Custody.Entries) != 3 {
		t.Errorf("custody entries=%d want=3", len(canonical.Custody.Entries))
	}
}

func TestStoreDuplicateRejected(t *testing.T) {
	v := NewInMemoryVault(nil)
	ctx := context.Background()
	_ = v.Store(ctx, newPackage("ev-1"))
	err := v.Store(ctx, newPackage("ev-1"))
	if err != ErrAlreadyExists {
		t.Errorf("want ErrAlreadyExists, got %v", err)
	}
}

func TestGetMissing(t *testing.T) {
	v := NewInMemoryVault(nil)
	_, err := v.Get(context.Background(), "missing", "op", "purpose")
	if err != ErrNotFound {
		t.Errorf("want ErrNotFound, got %v", err)
	}
}

func TestPlaceHoldSuspendsExpiry(t *testing.T) {
	clock := func() time.Time { return time.Now() }
	v := NewInMemoryVault(clock)
	ctx := context.Background()
	pkg := newPackage("ev-1")
	pkg.Retention.StoredAt = time.Now().Add(-1000 * 24 * time.Hour) // long expired on schedule
	_ = v.Store(ctx, pkg)

	// Without hold, it's expired.
	expired, _ := v.ListExpired(ctx, time.Now())
	if len(expired) != 1 {
		t.Errorf("expected expired before hold, got %d", len(expired))
	}

	_ = v.PlaceHold(ctx, "ev-1", "counsel", "lit-2026-001")

	expired, _ = v.ListExpired(ctx, time.Now())
	if len(expired) != 0 {
		t.Errorf("expected no expired under hold, got %d", len(expired))
	}
}

func TestDeleteBlockedByHold(t *testing.T) {
	v := NewInMemoryVault(nil)
	ctx := context.Background()
	_ = v.Store(ctx, newPackage("ev-1"))
	_ = v.PlaceHold(ctx, "ev-1", "counsel", "lit")
	err := v.Delete(ctx, "ev-1", "op")
	if err != ErrOnHold {
		t.Errorf("want ErrOnHold, got %v", err)
	}
}

func TestDeleteZeroesCiphertextKeepsCustody(t *testing.T) {
	v := NewInMemoryVault(nil)
	ctx := context.Background()
	_ = v.Store(ctx, newPackage("ev-1"))
	_ = v.Delete(ctx, "ev-1", "retention-bot")
	pkg, err := v.Get(ctx, "ev-1", "auditor", "post-deletion-audit")
	// Get should still succeed (metadata retained); ciphertext should be nil
	if err != nil {
		t.Fatalf("get after delete: %v", err)
	}
	if pkg.Ciphertext != nil {
		t.Error("expected ciphertext zeroed after deletion")
	}
}

func TestReleaseHoldUnsuspendsExpiry(t *testing.T) {
	v := NewInMemoryVault(nil)
	ctx := context.Background()
	pkg := newPackage("ev-1")
	pkg.Retention.StoredAt = time.Now().Add(-1000 * 24 * time.Hour)
	_ = v.Store(ctx, pkg)
	_ = v.PlaceHold(ctx, "ev-1", "counsel", "lit")
	_ = v.ReleaseHold(ctx, "ev-1", "counsel", "lit-resolved")

	expired, _ := v.ListExpired(ctx, time.Now())
	if len(expired) != 1 {
		t.Errorf("expected expired after hold release, got %d", len(expired))
	}
}
