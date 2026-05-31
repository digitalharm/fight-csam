package store

import (
	"context"
	"testing"
	"time"
)

func TestInMemoryStore_PutAndGet(t *testing.T) {
	ctx := context.Background()
	s := NewInMemoryStore()
	snap := Snapshot{
		ID:        "snap-1",
		Source:    SourceNCMEC,
		Version:   "2026-05-30",
		HashCount: 5_000_000,
		CreatedAt: time.Now(),
		BlobURI:   "mem://snap-1",
	}
	if err := s.PutSnapshot(ctx, snap); err != nil {
		t.Fatalf("put: %v", err)
	}
	got, err := s.GetSnapshot(ctx, "snap-1")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.HashCount != 5_000_000 {
		t.Errorf("HashCount=%d want=5000000", got.HashCount)
	}
}

func TestInMemoryStore_GetMissing(t *testing.T) {
	_, err := NewInMemoryStore().GetSnapshot(context.Background(), "missing")
	if err != ErrNotFound {
		t.Errorf("want ErrNotFound, got %v", err)
	}
}

func TestInMemoryStore_ListSnapshotsNewestFirst(t *testing.T) {
	ctx := context.Background()
	s := NewInMemoryStore()
	now := time.Now()
	_ = s.PutSnapshot(ctx, Snapshot{ID: "a", Source: SourceNCMEC, CreatedAt: now.Add(-2 * time.Hour)})
	_ = s.PutSnapshot(ctx, Snapshot{ID: "b", Source: SourceNCMEC, CreatedAt: now.Add(-1 * time.Hour)})
	_ = s.PutSnapshot(ctx, Snapshot{ID: "c", Source: SourceNCMEC, CreatedAt: now})
	_ = s.PutSnapshot(ctx, Snapshot{ID: "x", Source: SourceIWF, CreatedAt: now})

	list, err := s.ListSnapshots(ctx, SourceNCMEC, 10)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(list) != 3 {
		t.Fatalf("len=%d want=3", len(list))
	}
	if list[0].ID != "c" || list[1].ID != "b" || list[2].ID != "a" {
		t.Errorf("not newest-first: %v %v %v", list[0].ID, list[1].ID, list[2].ID)
	}
}

func TestInMemoryStore_LatestSnapshot(t *testing.T) {
	ctx := context.Background()
	s := NewInMemoryStore()
	_ = s.PutSnapshot(ctx, Snapshot{ID: "older", Source: SourceNCMEC, CreatedAt: time.Now().Add(-time.Hour)})
	_ = s.PutSnapshot(ctx, Snapshot{ID: "newer", Source: SourceNCMEC, CreatedAt: time.Now()})

	latest, err := s.LatestSnapshot(ctx, SourceNCMEC)
	if err != nil {
		t.Fatalf("latest: %v", err)
	}
	if latest.ID != "newer" {
		t.Errorf("latest.ID=%s want=newer", latest.ID)
	}
}

func TestInMemoryStore_DiffSourceMismatchRejected(t *testing.T) {
	ctx := context.Background()
	s := NewInMemoryStore()
	_ = s.PutSnapshot(ctx, Snapshot{ID: "n", Source: SourceNCMEC})
	_ = s.PutSnapshot(ctx, Snapshot{ID: "i", Source: SourceIWF})
	_, err := s.DiffSnapshots(ctx, "n", "i")
	if err == nil {
		t.Error("want error diffing across sources")
	}
}
