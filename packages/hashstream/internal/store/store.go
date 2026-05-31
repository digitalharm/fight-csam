// Package store defines the storage interface for hash snapshots.
//
// HashStream's job is to mirror NCMEC / IWF / Project Arachnid hash
// lists with versioned snapshots and a diff history that auditors can
// reproduce. The Store abstraction lets the storage backend vary
// (local filesystem for dev, object storage for production) without
// changing the API.
//
// Scaffold stage. The InMemoryStore exists as a working implementation
// so the server scaffold compiles and serves a smoke endpoint. Object-
// storage backends land as adapters when the credentialed list-source
// integrations are unblocked.
package store

import (
	"context"
	"errors"
	"sync"
	"time"
)

// Source identifies the upstream hash list this snapshot was sourced from.
type Source string

const (
	SourceNCMEC          Source = "ncmec"
	SourceIWF            Source = "iwf"
	SourceProjectArachnid Source = "project-arachnid"
)

// Snapshot is a versioned point-in-time copy of a hash list.
//
// HashStream never stores raw hash list bytes in plaintext on the
// wire; all snapshots are encrypted at rest with the operator's
// KMS-managed key. The Snapshot struct holds the metadata; the
// actual hash blob lives behind a separate fetch.
type Snapshot struct {
	ID         string    // stable identifier (UUIDv7 recommended for sortability)
	Source     Source    // upstream source
	Version    string    // upstream's version label, if any
	HashCount  int       // number of hashes in this snapshot
	CreatedAt  time.Time // when HashStream pulled this snapshot
	UpstreamAt time.Time // upstream's reported timestamp, if exposed
	BlobURI    string    // pointer to the encrypted blob (scheme://path)
	Signature  []byte    // detached signature over the blob, for integrity verification
}

// Diff describes the change between two snapshots of the same source.
type Diff struct {
	From      *Snapshot
	To        *Snapshot
	AddedN    int
	RemovedN  int
	UnchangedN int
}

// Store is the interface every storage backend implements.
type Store interface {
	// PutSnapshot records a new snapshot. Idempotent on ID.
	PutSnapshot(ctx context.Context, s Snapshot) error
	// GetSnapshot retrieves a snapshot by ID.
	GetSnapshot(ctx context.Context, id string) (*Snapshot, error)
	// ListSnapshots returns snapshots for a source, newest first.
	ListSnapshots(ctx context.Context, source Source, limit int) ([]Snapshot, error)
	// LatestSnapshot returns the most recent snapshot for a source.
	LatestSnapshot(ctx context.Context, source Source) (*Snapshot, error)
	// DiffSnapshots computes a diff between two snapshots of the same source.
	DiffSnapshots(ctx context.Context, fromID, toID string) (*Diff, error)
}

// ErrNotFound is returned when a requested snapshot does not exist.
var ErrNotFound = errors.New("snapshot not found")

// InMemoryStore is a working scaffold implementation. Sufficient for
// smoke testing and CI; production deployments swap in a persistent
// backend (S3, GCS, R2, filesystem).
type InMemoryStore struct {
	mu        sync.RWMutex
	snapshots map[string]Snapshot
}

// NewInMemoryStore returns a fresh in-memory store.
func NewInMemoryStore() *InMemoryStore {
	return &InMemoryStore{
		snapshots: make(map[string]Snapshot),
	}
}

func (s *InMemoryStore) PutSnapshot(_ context.Context, snap Snapshot) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.snapshots[snap.ID] = snap
	return nil
}

func (s *InMemoryStore) GetSnapshot(_ context.Context, id string) (*Snapshot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	snap, ok := s.snapshots[id]
	if !ok {
		return nil, ErrNotFound
	}
	return &snap, nil
}

func (s *InMemoryStore) ListSnapshots(_ context.Context, source Source, limit int) ([]Snapshot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var matches []Snapshot
	for _, snap := range s.snapshots {
		if snap.Source == source {
			matches = append(matches, snap)
		}
	}
	// Sort newest first by CreatedAt.
	for i := 0; i < len(matches)-1; i++ {
		for j := i + 1; j < len(matches); j++ {
			if matches[j].CreatedAt.After(matches[i].CreatedAt) {
				matches[i], matches[j] = matches[j], matches[i]
			}
		}
	}
	if limit > 0 && len(matches) > limit {
		matches = matches[:limit]
	}
	return matches, nil
}

func (s *InMemoryStore) LatestSnapshot(ctx context.Context, source Source) (*Snapshot, error) {
	list, err := s.ListSnapshots(ctx, source, 1)
	if err != nil {
		return nil, err
	}
	if len(list) == 0 {
		return nil, ErrNotFound
	}
	return &list[0], nil
}

func (s *InMemoryStore) DiffSnapshots(ctx context.Context, fromID, toID string) (*Diff, error) {
	from, err := s.GetSnapshot(ctx, fromID)
	if err != nil {
		return nil, err
	}
	to, err := s.GetSnapshot(ctx, toID)
	if err != nil {
		return nil, err
	}
	if from.Source != to.Source {
		return nil, errors.New("cannot diff snapshots from different sources")
	}
	// Scaffold: real diff requires fetching and comparing blob contents.
	// The in-memory store doesn't carry blobs; report counts only.
	return &Diff{
		From:       from,
		To:         to,
		AddedN:     to.HashCount - from.HashCount, // crude approximation
		RemovedN:   0,
		UnchangedN: from.HashCount,
	}, nil
}
