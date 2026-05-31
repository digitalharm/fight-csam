// Package vault is the operational layer on top of custody + retention.
//
// Stores encrypted evidence packages (the ciphertext is the operator's
// responsibility — the vault holds wrapped blobs only), maintains the
// custody log per package, applies the retention schedule, and exposes
// query / hold / release operations.
//
// Scaffold stage. The in-memory implementation is sufficient for CI
// and small deployments. Production swaps in object-storage backends
// with envelope encryption via the operator's KMS.
package vault

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/digitalharm/digitalharm-oss/packages/evidencevault/internal/custody"
	"github.com/digitalharm/digitalharm-oss/packages/evidencevault/internal/retention"
)

// Package is the unit of evidence retention.
type Package struct {
	ID             string
	Ciphertext     []byte // operator-encrypted; the vault never sees plaintext
	ContentRefHash string // hash of the (operator-side) content, for integrity verification
	Custody        *custody.Log
	Retention      retention.State
}

// Vault is the operational interface.
type Vault interface {
	Store(ctx context.Context, pkg Package) error
	Get(ctx context.Context, id, operatorID, purposeRef string) (*Package, error)
	PlaceHold(ctx context.Context, id, operatorID, holdRef string) error
	ReleaseHold(ctx context.Context, id, operatorID, holdRef string) error
	Delete(ctx context.Context, id, operatorID string) error
	ListExpired(ctx context.Context, now time.Time) ([]string, error)
}

// InMemoryVault is the scaffold reference implementation.
type InMemoryVault struct {
	mu       sync.RWMutex
	packages map[string]*Package
	clock    func() time.Time
}

// NewInMemoryVault returns a fresh vault. The clock parameter lets
// tests inject a deterministic time source.
func NewInMemoryVault(clock func() time.Time) *InMemoryVault {
	if clock == nil {
		clock = time.Now
	}
	return &InMemoryVault{
		packages: make(map[string]*Package),
		clock:    clock,
	}
}

// ErrAlreadyExists is returned by Store if the package ID is taken.
var ErrAlreadyExists = errors.New("evidence package already exists")

// ErrNotFound is returned by all retrieval operations if no package matches.
var ErrNotFound = errors.New("evidence package not found")

// ErrOnHold is returned by Delete if the package is under litigation hold.
var ErrOnHold = errors.New("cannot delete: package is under litigation hold")

func (v *InMemoryVault) Store(_ context.Context, pkg Package) error {
	v.mu.Lock()
	defer v.mu.Unlock()
	if _, exists := v.packages[pkg.ID]; exists {
		return ErrAlreadyExists
	}
	v.packages[pkg.ID] = &pkg
	return nil
}

func (v *InMemoryVault) Get(_ context.Context, id, operatorID, purposeRef string) (*Package, error) {
	v.mu.Lock()
	defer v.mu.Unlock()
	pkg, ok := v.packages[id]
	if !ok {
		return nil, ErrNotFound
	}
	if err := pkg.Custody.Append(custody.ActionAccessed, operatorID, purposeRef, v.clock()); err != nil {
		return nil, err
	}
	// Return a copy so callers can't mutate the canonical custody log.
	copied := *pkg
	return &copied, nil
}

func (v *InMemoryVault) PlaceHold(_ context.Context, id, operatorID, holdRef string) error {
	v.mu.Lock()
	defer v.mu.Unlock()
	pkg, ok := v.packages[id]
	if !ok {
		return ErrNotFound
	}
	pkg.Retention.OnLitigationHold = true
	return pkg.Custody.Append(custody.ActionHoldPlaced, operatorID, holdRef, v.clock())
}

func (v *InMemoryVault) ReleaseHold(_ context.Context, id, operatorID, holdRef string) error {
	v.mu.Lock()
	defer v.mu.Unlock()
	pkg, ok := v.packages[id]
	if !ok {
		return ErrNotFound
	}
	pkg.Retention.OnLitigationHold = false
	return pkg.Custody.Append(custody.ActionHoldReleased, operatorID, holdRef, v.clock())
}

func (v *InMemoryVault) Delete(_ context.Context, id, operatorID string) error {
	v.mu.Lock()
	defer v.mu.Unlock()
	pkg, ok := v.packages[id]
	if !ok {
		return ErrNotFound
	}
	if pkg.Retention.OnLitigationHold {
		return ErrOnHold
	}
	if err := pkg.Custody.Append(custody.ActionDeleted, operatorID, "retention-expired", v.clock()); err != nil {
		return err
	}
	// Zero the ciphertext but keep the metadata + custody log for audit.
	pkg.Ciphertext = nil
	return nil
}

func (v *InMemoryVault) ListExpired(_ context.Context, now time.Time) ([]string, error) {
	v.mu.RLock()
	defer v.mu.RUnlock()
	var expired []string
	for id, pkg := range v.packages {
		if pkg.Custody.IsDeleted() {
			continue
		}
		if pkg.Retention.Expired(now) {
			expired = append(expired, id)
		}
	}
	return expired, nil
}
