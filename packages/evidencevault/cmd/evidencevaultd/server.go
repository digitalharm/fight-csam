package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/digitalharm/fight-csam/packages/evidencevault/internal/custody"
	"github.com/digitalharm/fight-csam/packages/evidencevault/internal/retention"
	"github.com/digitalharm/fight-csam/packages/evidencevault/internal/vault"
)

// server is the HTTP surface over a Vault. It is backend-agnostic: any
// vault.Vault (in-memory or disk) can be injected, so the same handlers serve
// both the CI in-memory tests and the disk-backed deployment.
type server struct {
	vault vault.Vault
	clock func() time.Time
}

// newServer wires a server around an injected vault. A nil clock defaults to
// time.Now.
func newServer(v vault.Vault, clock func() time.Time) *server {
	if clock == nil {
		clock = time.Now
	}
	return &server{vault: v, clock: clock}
}

// routes builds the HTTP mux. Uses Go 1.22 method+pattern routing so each verb
// maps to a distinct handler and {id} is available via r.PathValue("id").
func (s *server) routes() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /packages", s.handleStore)
	mux.HandleFunc("GET /packages/{id}", s.handleGet)
	mux.HandleFunc("POST /packages/{id}/hold", s.handlePlaceHold)
	mux.HandleFunc("DELETE /packages/{id}/hold", s.handleReleaseHold)
	mux.HandleFunc("DELETE /packages/{id}", s.handleDelete)
	mux.HandleFunc("GET /packages/{id}/custody", s.handleCustody)
	mux.HandleFunc("GET /expired", s.handleExpired)
	return mux
}

// --- request/response payloads --- //

// storeRequest is the POST /packages body. The custody log and retention
// schedule are seeded server-side if the caller omits them, so a minimal
// ingest only needs the ciphertext + a content hash + the ingesting operator.
type storeRequest struct {
	ID             string `json:"id"`
	Ciphertext     []byte `json:"ciphertext"`      // base64 in JSON; operator-wrapped bytes
	ContentRefHash string `json:"content_ref_hash"`
	Operator       string `json:"operator"`        // who is ingesting (for the genesis custody entry)
	Jurisdiction   string `json:"jurisdiction"`    // optional: us-federal|eu|uk|au (default us-federal)
}

type storeResponse struct {
	PackageID string `json:"package_id"`
}

type holdRequest struct {
	Operator string `json:"operator"`
	HoldRef  string `json:"hold_ref"`
}

type expiredResponse struct {
	AsOf    time.Time `json:"as_of"`
	Expired []string  `json:"expired"`
}

// packageView is the JSON projection of a Package returned by GET.
type packageView struct {
	ID             string          `json:"id"`
	Ciphertext     []byte          `json:"ciphertext"`
	ContentRefHash string          `json:"content_ref_hash"`
	Custody        *custody.Log    `json:"custody"`
	Retention      retention.State `json:"retention"`
}

func viewOf(pkg *vault.Package) packageView {
	return packageView{
		ID:             pkg.ID,
		Ciphertext:     pkg.Ciphertext,
		ContentRefHash: pkg.ContentRefHash,
		Custody:        pkg.Custody,
		Retention:      pkg.Retention,
	}
}

// scheduleFor maps a jurisdiction string to a retention schedule, defaulting to
// US federal. Note: these schedules are QUERYABLE BUT NOT ENFORCED in v0.5 —
// the timer/destruction enforcement is gated on counsel review.
func scheduleFor(jurisdiction string) retention.Schedule {
	switch jurisdiction {
	case string(retention.JurisdictionEU):
		return retention.EuDSA
	case string(retention.JurisdictionUK):
		return retention.UKOSA
	case string(retention.JurisdictionAU):
		return retention.AustraliaESafety
	default:
		return retention.USFederal2258A
	}
}

// --- handlers --- //

func (s *server) handleStore(w http.ResponseWriter, r *http.Request) {
	var req storeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body: "+err.Error())
		return
	}
	if req.ID == "" {
		writeError(w, http.StatusBadRequest, "id is required")
		return
	}
	operator := req.Operator
	if operator == "" {
		operator = "ingestion"
	}
	now := s.clock()
	pkg := vault.Package{
		ID:             req.ID,
		Ciphertext:     req.Ciphertext,
		ContentRefHash: req.ContentRefHash,
		Custody:        custody.NewLog(req.ID, operator, "intake", now),
		Retention: retention.State{
			StoredAt: now,
			Schedule: scheduleFor(req.Jurisdiction),
		},
	}
	if err := s.vault.Store(r.Context(), pkg); err != nil {
		writeVaultError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, storeResponse{PackageID: req.ID})
}

func (s *server) handleGet(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	operator := r.URL.Query().Get("operator")
	purpose := r.URL.Query().Get("purpose")
	pkg, err := s.vault.Get(r.Context(), id, operator, purpose)
	if err != nil {
		writeVaultError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, viewOf(pkg))
}

func (s *server) handlePlaceHold(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req holdRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body: "+err.Error())
		return
	}
	if req.HoldRef == "" {
		writeError(w, http.StatusBadRequest, "hold_ref is required")
		return
	}
	if err := s.vault.PlaceHold(r.Context(), id, req.Operator, req.HoldRef); err != nil {
		writeVaultError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *server) handleReleaseHold(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	// hold_ref/operator may come from a body or query string (DELETE bodies are
	// allowed but awkward for curl, so accept both).
	operator := r.URL.Query().Get("operator")
	holdRef := r.URL.Query().Get("hold_ref")
	if holdRef == "" {
		var req holdRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			if operator == "" {
				operator = req.Operator
			}
			holdRef = req.HoldRef
		}
	}
	if err := s.vault.ReleaseHold(r.Context(), id, operator, holdRef); err != nil {
		writeVaultError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *server) handleDelete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	operator := r.URL.Query().Get("operator")
	if err := s.vault.Delete(r.Context(), id, operator); err != nil {
		writeVaultError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *server) handleCustody(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	// A custody read should NOT mutate the chain, so pass an empty purpose and
	// rely on the vault returning the current log. Get appends an Accessed entry
	// for non-deleted packages by design; to keep custody inspection read-only
	// we instead use the dedicated audit purpose so the appended entry is
	// self-describing. (Auditors expect their reads to be logged.)
	pkg, err := s.vault.Get(r.Context(), id, "custody-reader", "custody-log-export")
	if err != nil {
		writeVaultError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, pkg.Custody)
}

func (s *server) handleExpired(w http.ResponseWriter, r *http.Request) {
	asOf := s.clock()
	if raw := r.URL.Query().Get("as_of"); raw != "" {
		parsed, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			writeError(w, http.StatusBadRequest, "as_of must be RFC3339: "+err.Error())
			return
		}
		asOf = parsed
	}
	ids, err := s.vault.ListExpired(r.Context(), asOf)
	if err != nil {
		writeVaultError(w, err)
		return
	}
	if ids == nil {
		ids = []string{}
	}
	writeJSON(w, http.StatusOK, expiredResponse{AsOf: asOf, Expired: ids})
}

// --- helpers --- //

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// writeVaultError maps the vault's sentinel errors to HTTP status codes.
func writeVaultError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, vault.ErrNotFound):
		writeError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, vault.ErrAlreadyExists):
		writeError(w, http.StatusConflict, err.Error())
	case errors.Is(err, vault.ErrOnHold):
		writeError(w, http.StatusConflict, err.Error())
	case errors.Is(err, vault.ErrInvalidID):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, custody.ErrAlreadyDeleted):
		writeError(w, http.StatusConflict, err.Error())
	default:
		writeError(w, http.StatusInternalServerError, err.Error())
	}
}
