// Package adapter defines the upstream-list integration contract.
//
// Each adapter pulls from one credentialed source (NCMEC, IWF, Project
// Arachnid) and produces snapshots that the HashStream service stores.
// Scaffold stage: the interface and stub implementations are here;
// real wire protocols land when the credentialing relationships
// (docs/sponsorship.md) are unblocked.
package adapter

import (
	"context"
	"errors"

	"github.com/digitalharm/digitalharm-oss/packages/hashstream/internal/store"
)

// Adapter is the contract every upstream-list integration implements.
type Adapter interface {
	// Source identifies which upstream this adapter pulls from.
	Source() store.Source
	// Pull fetches the current state of the upstream list and writes a
	// new snapshot to the supplied store. It is up to the adapter to
	// decide whether to dedupe against the latest snapshot or always
	// produce a new one.
	Pull(ctx context.Context, s store.Store) (*store.Snapshot, error)
}

// ErrNotImplemented is returned by scaffold stubs until the wire
// protocol is wired up.
var ErrNotImplemented = errors.New("adapter scaffold stub — see docs/roadmap.md")

// NCMECAdapter is the NCMEC Hash Sharing API integration.
type NCMECAdapter struct {
	Environment string // "industry" | "law-enforcement" | "npo"
	Username    string
	Password    string
}

func (NCMECAdapter) Source() store.Source { return store.SourceNCMEC }

func (a NCMECAdapter) Pull(_ context.Context, _ store.Store) (*store.Snapshot, error) {
	// TODO: implement NCMEC Hash Sharing wire protocol. Requires ESP
	// credentialing — see docs/sponsorship.md.
	return nil, ErrNotImplemented
}

// IWFAdapter is the Internet Watch Foundation Hash List integration.
type IWFAdapter struct {
	APIKey string
}

func (IWFAdapter) Source() store.Source { return store.SourceIWF }

func (a IWFAdapter) Pull(_ context.Context, _ store.Store) (*store.Snapshot, error) {
	// TODO: implement IWF Hash List wire protocol. Requires IWF
	// membership.
	return nil, ErrNotImplemented
}

// ProjectArachnidAdapter is the Project Arachnid Shield integration.
type ProjectArachnidAdapter struct {
	ShieldKey string
}

func (ProjectArachnidAdapter) Source() store.Source { return store.SourceProjectArachnid }

func (a ProjectArachnidAdapter) Pull(_ context.Context, _ store.Store) (*store.Snapshot, error) {
	// TODO: implement Project Arachnid Shield wire protocol. The Shield
	// API is documented at https://projectarachnid.ca/en/.
	return nil, ErrNotImplemented
}
