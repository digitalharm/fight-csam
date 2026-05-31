package vault

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/digitalharm/digitalharm-oss/packages/evidencevault/internal/custody"
	"github.com/digitalharm/digitalharm-oss/packages/evidencevault/internal/retention"
)

// DiskVault is a file-backed Vault implementation. Each evidence package is
// persisted as a single JSON document at <dir>/<id>.json containing the wrapped
// ciphertext, the full custody log, and the retention state. Every mutating
// operation reads the file, applies the change, and writes it back atomically,
// so the on-disk state is the source of truth and survives process restarts.
//
// Concurrency: each package id gets its own sync.Mutex held for the duration of
// a read-modify-write. Operations on different ids proceed in parallel;
// operations on the same id serialize. A single map mutex guards the lock map
// itself. This is sufficient for a single-process deployment; multi-process
// access to the same directory would additionally need OS file locks (out of
// scope for v0.5 — documented in the README).
type DiskVault struct {
	dir   string
	clock func() time.Time

	mu    sync.Mutex
	locks map[string]*sync.Mutex
}

// diskRecord is the on-disk serialization of a Package. It mirrors Package but
// lives here so the wire format is explicit and stable. encoding/json
// base64-encodes the Ciphertext byte slice automatically (and a nil slice
// round-trips as JSON null, preserving the "ciphertext zeroed after deletion"
// invariant).
type diskRecord struct {
	ID             string          `json:"id"`
	Ciphertext     []byte          `json:"ciphertext"`
	ContentRefHash string          `json:"content_ref_hash"`
	Custody        *custody.Log    `json:"custody"`
	Retention      retention.State `json:"retention"`
}

// NewDiskVault opens (creating if necessary) a disk-backed vault rooted at dir.
// The clock parameter lets tests inject a deterministic time source; nil means
// time.Now.
func NewDiskVault(dir string, clock func() time.Time) (*DiskVault, error) {
	if clock == nil {
		clock = time.Now
	}
	if dir == "" {
		return nil, errors.New("evidencevault: disk store directory is required")
	}
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return nil, fmt.Errorf("evidencevault: create store dir: %w", err)
	}
	return &DiskVault{
		dir:   dir,
		clock: clock,
		locks: make(map[string]*sync.Mutex),
	}, nil
}

// ErrInvalidID is returned when a package id cannot be safely mapped to a
// filename (empty, or containing path separators / traversal sequences).
var ErrInvalidID = errors.New("evidence package id is invalid")

// lockFor returns the per-id mutex, creating it on first use.
func (v *DiskVault) lockFor(id string) *sync.Mutex {
	v.mu.Lock()
	defer v.mu.Unlock()
	l, ok := v.locks[id]
	if !ok {
		l = &sync.Mutex{}
		v.locks[id] = l
	}
	return l
}

// pathFor validates the id and returns its on-disk path.
func (v *DiskVault) pathFor(id string) (string, error) {
	if id == "" || id != filepath.Base(id) || id == "." || id == ".." {
		return "", ErrInvalidID
	}
	// Reject any separator that filepath.Base might not have caught on this OS.
	for _, r := range id {
		if r == '/' || r == '\\' || r == 0 {
			return "", ErrInvalidID
		}
	}
	return filepath.Join(v.dir, id+".json"), nil
}

// readPkg loads a package from disk. Returns ErrNotFound if the file is absent.
func (v *DiskVault) readPkg(id string) (*Package, error) {
	path, err := v.pathFor(id)
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("evidencevault: read package %s: %w", id, err)
	}
	var rec diskRecord
	if err := json.Unmarshal(data, &rec); err != nil {
		return nil, fmt.Errorf("evidencevault: decode package %s: %w", id, err)
	}
	return &Package{
		ID:             rec.ID,
		Ciphertext:     rec.Ciphertext,
		ContentRefHash: rec.ContentRefHash,
		Custody:        rec.Custody,
		Retention:      rec.Retention,
	}, nil
}

// writePkg persists a package atomically (temp file + rename within the same
// directory, so a crash mid-write never leaves a partial file at the real path).
func (v *DiskVault) writePkg(pkg *Package) error {
	path, err := v.pathFor(pkg.ID)
	if err != nil {
		return err
	}
	rec := diskRecord{
		ID:             pkg.ID,
		Ciphertext:     pkg.Ciphertext,
		ContentRefHash: pkg.ContentRefHash,
		Custody:        pkg.Custody,
		Retention:      pkg.Retention,
	}
	data, err := json.MarshalIndent(rec, "", "  ")
	if err != nil {
		return fmt.Errorf("evidencevault: encode package %s: %w", pkg.ID, err)
	}
	tmp, err := os.CreateTemp(v.dir, pkg.ID+".*.tmp")
	if err != nil {
		return fmt.Errorf("evidencevault: temp file for %s: %w", pkg.ID, err)
	}
	tmpName := tmp.Name()
	// Best-effort cleanup if we bail before the rename.
	defer func() { _ = os.Remove(tmpName) }()
	if _, err := tmp.Write(data); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("evidencevault: write temp for %s: %w", pkg.ID, err)
	}
	if err := tmp.Chmod(0o600); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("evidencevault: chmod temp for %s: %w", pkg.ID, err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("evidencevault: close temp for %s: %w", pkg.ID, err)
	}
	if err := os.Rename(tmpName, path); err != nil {
		return fmt.Errorf("evidencevault: commit package %s: %w", pkg.ID, err)
	}
	return nil
}

// Store writes a new package. Returns ErrAlreadyExists if the id is taken.
func (v *DiskVault) Store(_ context.Context, pkg Package) error {
	if _, err := v.pathFor(pkg.ID); err != nil {
		return err
	}
	l := v.lockFor(pkg.ID)
	l.Lock()
	defer l.Unlock()

	if _, err := v.readPkg(pkg.ID); err == nil {
		return ErrAlreadyExists
	} else if !errors.Is(err, ErrNotFound) {
		return err
	}
	return v.writePkg(&pkg)
}

// Get retrieves a package, appending an Accessed custody entry unless the log
// has already terminated in deletion (mirroring InMemoryVault). The returned
// package is decoded fresh from disk, so callers cannot mutate canonical state.
func (v *DiskVault) Get(_ context.Context, id, operatorID, purposeRef string) (*Package, error) {
	if _, err := v.pathFor(id); err != nil {
		return nil, err
	}
	l := v.lockFor(id)
	l.Lock()
	defer l.Unlock()

	pkg, err := v.readPkg(id)
	if err != nil {
		return nil, err
	}
	if !pkg.Custody.IsDeleted() {
		if err := pkg.Custody.Append(custody.ActionAccessed, operatorID, purposeRef, v.clock()); err != nil {
			return nil, err
		}
		if err := v.writePkg(pkg); err != nil {
			return nil, err
		}
	}
	return pkg, nil
}

// PlaceHold marks a package under litigation hold (suspending expiry) and
// records the action in the custody log.
func (v *DiskVault) PlaceHold(_ context.Context, id, operatorID, holdRef string) error {
	if _, err := v.pathFor(id); err != nil {
		return err
	}
	l := v.lockFor(id)
	l.Lock()
	defer l.Unlock()

	pkg, err := v.readPkg(id)
	if err != nil {
		return err
	}
	pkg.Retention.OnLitigationHold = true
	if err := pkg.Custody.Append(custody.ActionHoldPlaced, operatorID, holdRef, v.clock()); err != nil {
		return err
	}
	return v.writePkg(pkg)
}

// ReleaseHold lifts a litigation hold and records the action.
func (v *DiskVault) ReleaseHold(_ context.Context, id, operatorID, holdRef string) error {
	if _, err := v.pathFor(id); err != nil {
		return err
	}
	l := v.lockFor(id)
	l.Lock()
	defer l.Unlock()

	pkg, err := v.readPkg(id)
	if err != nil {
		return err
	}
	pkg.Retention.OnLitigationHold = false
	if err := pkg.Custody.Append(custody.ActionHoldReleased, operatorID, holdRef, v.clock()); err != nil {
		return err
	}
	return v.writePkg(pkg)
}

// Delete zeroes the ciphertext while preserving the metadata and custody log.
// Returns ErrOnHold if the package is under litigation hold.
func (v *DiskVault) Delete(_ context.Context, id, operatorID string) error {
	if _, err := v.pathFor(id); err != nil {
		return err
	}
	l := v.lockFor(id)
	l.Lock()
	defer l.Unlock()

	pkg, err := v.readPkg(id)
	if err != nil {
		return err
	}
	if pkg.Retention.OnLitigationHold {
		return ErrOnHold
	}
	if err := pkg.Custody.Append(custody.ActionDeleted, operatorID, "retention-expired", v.clock()); err != nil {
		return err
	}
	pkg.Ciphertext = nil
	return v.writePkg(pkg)
}

// ListExpired scans the store directory and returns the ids of packages that
// are past their effective retention and not deleted. Litigation hold suspends
// expiry (handled inside retention.State.Expired).
func (v *DiskVault) ListExpired(_ context.Context, now time.Time) ([]string, error) {
	entries, err := os.ReadDir(v.dir)
	if err != nil {
		return nil, fmt.Errorf("evidencevault: scan store dir: %w", err)
	}
	var expired []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		if filepath.Ext(name) != ".json" {
			continue
		}
		id := name[:len(name)-len(".json")]
		pkg, err := v.readPkg(id)
		if err != nil {
			// A concurrently-deleted or malformed file shouldn't fail the scan.
			if errors.Is(err, ErrNotFound) {
				continue
			}
			return nil, err
		}
		if pkg.Custody.IsDeleted() {
			continue
		}
		if pkg.Retention.Expired(now) {
			expired = append(expired, id)
		}
	}
	return expired, nil
}

// Ensure DiskVault satisfies the Vault interface at compile time.
var _ Vault = (*DiskVault)(nil)
