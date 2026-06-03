// Package server is the HTTP API for HashStream.
//
// Endpoints:
//
//	GET  /health                          — liveness check
//	GET  /sources                         — list configured sources
//	POST /sources/{source}/snapshots      — ingest an operator-supplied snapshot
//	GET  /snapshots/{source}              — list snapshots for a source (newest first)
//	GET  /snapshots/{source}/latest       — fetch the latest snapshot for a source
//	GET  /snapshot/{id}                   — fetch a snapshot by ID
//	GET  /diff/{fromID}/{toID}            — diff between two snapshots
//
// Uses net/http directly so the package has no third-party deps.
//
// When the server is constructed with a Signer (see WithSigner), every
// snapshot accepted via POST is signed with a detached Ed25519 signature over
// its canonical serialization, and that signature plus the signing key ID are
// returned in the create response and all subsequent GETs. This gives even
// operator-supplied / fake-provider flows a tamper-evident signal.
package server

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/digitalharm/fight-csam/packages/hashstream/internal/store"
)

// Signer signs a snapshot in place, filling its Signature and SigningKeyID.
// Implemented by internal/signing.Signer; declared here as an interface so the
// server depends on behavior, not the concrete type.
type Signer interface {
	Sign(snap *store.Snapshot)
	KeyID() string
}

// Server is the HTTP handler for HashStream.
type Server struct {
	Store  store.Store
	Signer Signer // optional; when nil, snapshots are stored unsigned
	// now is the clock used to stamp CreatedAt; overridable in tests.
	now func() time.Time
}

// Option configures a Server.
type Option func(*Server)

// WithSigner attaches a snapshot signer.
func WithSigner(s Signer) Option {
	return func(srv *Server) { srv.Signer = s }
}

// WithClock overrides the CreatedAt clock (tests).
func WithClock(now func() time.Time) Option {
	return func(srv *Server) { srv.now = now }
}

// New returns a Server backed by the given store.
func New(s store.Store, opts ...Option) *Server {
	srv := &Server{Store: s, now: func() time.Time { return time.Now().UTC() }}
	for _, o := range opts {
		o(srv)
	}
	if srv.now == nil {
		srv.now = func() time.Time { return time.Now().UTC() }
	}
	return srv
}

// Handler returns the configured http.Handler.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.health)
	mux.HandleFunc("/sources", s.listSources)
	mux.HandleFunc("/sources/", s.sourceRoutes) // POST /sources/{source}/snapshots
	mux.HandleFunc("/snapshots/", s.snapshotRoutes)
	mux.HandleFunc("/snapshot/", s.snapshotByID)
	mux.HandleFunc("/diff/", s.diff)
	return mux
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) listSources(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"sources": store.KnownSources})
}

// createSnapshotRequest is the POST body for operator-supplied snapshots.
type createSnapshotRequest struct {
	SnapshotID string   `json:"snapshot_id"`
	HashesHex  []string `json:"hashes_hex"`
	Version    string   `json:"version,omitempty"`
}

// sourceRoutes dispatches /sources/{source}/... paths.
//
//	POST /sources/{source}/snapshots -> create
func (s *Server) sourceRoutes(w http.ResponseWriter, r *http.Request) {
	rest := strings.TrimPrefix(r.URL.Path, "/sources/")
	parts := strings.Split(rest, "/")
	if len(parts) < 1 || parts[0] == "" {
		writeError(w, http.StatusBadRequest, "missing source")
		return
	}
	source := store.Source(parts[0])

	// Only /sources/{source}/snapshots is defined.
	if len(parts) != 2 || parts[1] != "snapshots" {
		writeError(w, http.StatusNotFound, "unknown route under /sources/")
		return
	}
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", http.MethodPost)
		writeError(w, http.StatusMethodNotAllowed, "use POST to create a snapshot")
		return
	}
	s.createSnapshot(w, r, source)
}

func (s *Server) createSnapshot(w http.ResponseWriter, r *http.Request, source store.Source) {
	if !store.IsKnownSource(source) {
		writeError(w, http.StatusBadRequest, "unknown source: "+string(source))
		return
	}

	var req createSnapshotRequest
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body: "+err.Error())
		return
	}
	if strings.TrimSpace(req.SnapshotID) == "" {
		writeError(w, http.StatusBadRequest, "snapshot_id is required")
		return
	}

	hashes, err := store.ParseHashesHex(req.HashesHex)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid hashes_hex: "+err.Error())
		return
	}

	// Reject duplicate snapshot IDs so a re-POST is a clear conflict rather
	// than a silent overwrite (PutSnapshot is idempotent-by-overwrite).
	if _, err := s.Store.GetSnapshot(r.Context(), req.SnapshotID); err == nil {
		writeError(w, http.StatusConflict, "snapshot already exists: "+req.SnapshotID)
		return
	} else if !errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	snap := store.Snapshot{
		ID:        req.SnapshotID,
		Source:    source,
		Version:   req.Version,
		HashCount: len(hashes),
		CreatedAt: s.now(),
		Hashes:    hashes,
	}
	if s.Signer != nil {
		s.Signer.Sign(&snap)
	}

	if err := s.Store.PutSnapshot(r.Context(), snap); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, snap)
}

func (s *Server) snapshotRoutes(w http.ResponseWriter, r *http.Request) {
	// /snapshots/{source}              -> list
	// /snapshots/{source}/latest       -> latest
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/snapshots/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		writeError(w, http.StatusBadRequest, "missing source")
		return
	}
	source := store.Source(parts[0])

	if len(parts) >= 2 && parts[1] == "latest" {
		snap, err := s.Store.LatestSnapshot(r.Context(), source)
		if err != nil {
			writeError(w, http.StatusNotFound, "no snapshot")
			return
		}
		writeJSON(w, http.StatusOK, snap)
		return
	}

	list, err := s.Store.ListSnapshots(r.Context(), source, 100)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"source": source, "snapshots": list})
}

func (s *Server) snapshotByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/snapshot/")
	if id == "" {
		writeError(w, http.StatusBadRequest, "missing id")
		return
	}
	snap, err := s.Store.GetSnapshot(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "snapshot not found")
		return
	}
	writeJSON(w, http.StatusOK, snap)
}

func (s *Server) diff(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/diff/"), "/")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		writeError(w, http.StatusBadRequest, "diff requires /diff/{fromID}/{toID}")
		return
	}
	d, err := s.Store.DiffSnapshots(r.Context(), parts[0], parts[1])
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, d)
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		_ = err // best-effort write
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
