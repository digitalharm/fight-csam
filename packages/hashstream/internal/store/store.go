// Package store defines the storage interface for hash snapshots.
//
// HashStream's job is to mirror NCMEC / IWF / Project Arachnid hash
// lists with versioned snapshots and a diff history that auditors can
// reproduce. The Store abstraction lets the storage backend vary
// (local filesystem for dev, object storage for production) without
// changing the API.
//
// As of v0.5 the store also accepts operator-supplied hash lists via a
// "local" source. Those snapshots carry their full hash set inline so
// that GET and diff are exact (no upstream credentials required), giving
// even fake-provider and self-hosted flows a verifiable end-to-end path.
package store

import (
	"context"
	"errors"
	"sort"
	"sync"
	"time"
)

// Source identifies the upstream hash list this snapshot was sourced from.
type Source string

const (
	SourceNCMEC           Source = "ncmec"
	SourceIWF             Source = "iwf"
	SourceProjectArachnid Source = "project-arachnid"
	// SourceLocal is for operator-supplied hash lists uploaded directly to
	// the service (no credentialed upstream). These snapshots carry their
	// full hash set inline, so GET and diff are exact.
	SourceLocal Source = "local"
)

// KnownSources is the set of sources the service accepts.
var KnownSources = []Source{SourceNCMEC, SourceIWF, SourceProjectArachnid, SourceLocal}

// IsKnownSource reports whether s is one of the accepted sources.
func IsKnownSource(s Source) bool {
	for _, k := range KnownSources {
		if s == k {
			return true
		}
	}
	return false
}

// Hash is a single perceptual/cryptographic hash entry: a fixed 32-byte value.
// The wire format is hex-encoded; operators pre-encode before upload.
type Hash [32]byte

// Snapshot is a versioned point-in-time copy of a hash list.
//
// For credentialed upstreams the actual hash blob may live behind a
// separate encrypted fetch (BlobURI); for operator-supplied "local"
// snapshots the hash set is carried inline in Hashes so the service can
// serve and diff it without any external dependency.
type Snapshot struct {
	ID         string    // stable identifier (UUIDv7 recommended for sortability)
	Source     Source    // upstream source
	Version    string    // upstream's version label, if any
	HashCount  int       // number of hashes in this snapshot
	CreatedAt  time.Time // when HashStream pulled (or received) this snapshot
	UpstreamAt time.Time // upstream's reported timestamp, if exposed
	BlobURI    string    // pointer to the encrypted blob (scheme://path), if any
	Hashes     []Hash    // inline hash set (operator-supplied snapshots); may be nil

	// Signature is a detached Ed25519 signature over
	// (snapshot_id || hash_list_serialized || created_at_unix). Present only
	// when the service was started with a signing key. Verifiable against the
	// public key identified by SigningKeyID.
	Signature []byte
	// SigningKeyID is the hex-encoded sha256 prefix (first 8 bytes, 16 hex
	// chars) of the public key used to sign this snapshot. Empty when unsigned.
	SigningKeyID string
}

// Diff describes the change between two snapshots of the same source.
type Diff struct {
	From       *Snapshot
	To         *Snapshot
	AddedN     int
	RemovedN   int
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

// InMemoryStore is a working implementation. Sufficient for smoke testing,
// CI, and operator-supplied local lists; production deployments swap in a
// persistent backend (S3, GCS, R2, filesystem) for credentialed upstreams.
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
	// Sort newest first by CreatedAt, with ID as a stable tiebreaker so the
	// order is deterministic even when timestamps collide (common in tests).
	sort.Slice(matches, func(i, j int) bool {
		if matches[i].CreatedAt.Equal(matches[j].CreatedAt) {
			return matches[i].ID > matches[j].ID
		}
		return matches[i].CreatedAt.After(matches[j].CreatedAt)
	})
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
	return diff(from, to), nil
}

// diff computes the exact delta between two snapshots when both carry inline
// hash sets. When inline hashes are unavailable (credentialed upstream blobs
// not yet fetched), it falls back to a count-based approximation so the
// scaffold endpoints still return something meaningful.
func diff(from, to *Snapshot) *Diff {
	if from.Hashes == nil && to.Hashes == nil {
		return &Diff{
			From:       from,
			To:         to,
			AddedN:     to.HashCount - from.HashCount, // crude approximation
			RemovedN:   0,
			UnchangedN: from.HashCount,
		}
	}

	fromSet := make(map[Hash]struct{}, len(from.Hashes))
	for _, h := range from.Hashes {
		fromSet[h] = struct{}{}
	}
	toSet := make(map[Hash]struct{}, len(to.Hashes))
	for _, h := range to.Hashes {
		toSet[h] = struct{}{}
	}

	var added, removed, unchanged int
	for h := range toSet {
		if _, ok := fromSet[h]; ok {
			unchanged++
		} else {
			added++
		}
	}
	for h := range fromSet {
		if _, ok := toSet[h]; !ok {
			removed++
		}
	}

	return &Diff{
		From:       from,
		To:         to,
		AddedN:     added,
		RemovedN:   removed,
		UnchangedN: unchanged,
	}
}
