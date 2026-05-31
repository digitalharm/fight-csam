// Package server is the HTTP API for HashStream.
//
// Endpoints:
//
//	GET  /health                        — liveness check
//	GET  /sources                       — list configured upstream sources
//	GET  /snapshots/{source}            — list snapshots for a source (newest first)
//	GET  /snapshots/{source}/latest     — fetch the latest snapshot for a source
//	GET  /snapshot/{id}                 — fetch a snapshot by ID
//	GET  /diff/{fromID}/{toID}          — diff between two snapshots
//	POST /pull/{source}                 — trigger an upstream pull (operator only)
//
// Scaffold stage. Uses net/http directly so the package has no
// third-party deps. Routing switches to chi once we have a release-
// candidate build.
package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/digitalharm/digitalharm-oss/packages/hashstream/internal/store"
)

// Server is the HTTP handler for HashStream.
type Server struct {
	Store store.Store
}

// New returns a Server backed by the given store.
func New(s store.Store) *Server {
	return &Server{Store: s}
}

// Handler returns the configured http.Handler.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.health)
	mux.HandleFunc("/sources", s.listSources)
	mux.HandleFunc("/snapshots/", s.snapshotRoutes)
	mux.HandleFunc("/snapshot/", s.snapshotByID)
	mux.HandleFunc("/diff/", s.diff)
	return mux
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) listSources(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"sources": []store.Source{
			store.SourceNCMEC,
			store.SourceIWF,
			store.SourceProjectArachnid,
		},
	})
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

// Compile-time check: package builds with no third-party deps.
var _ = context.Background
var _ = fmt.Sprintf
