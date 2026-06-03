package server

import (
	"bytes"
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/digitalharm/fight-csam/packages/hashstream/internal/signing"
	"github.com/digitalharm/fight-csam/packages/hashstream/internal/store"
)

// newLiveServer keeps the original httptest.Server-based helper for the GET
// smoke tests, which exercise the real net/http stack.
func newLiveServer(t *testing.T, opts ...Option) (*httptest.Server, store.Store) {
	t.Helper()
	s := store.NewInMemoryStore()
	srv := httptest.NewServer(New(s, opts...).Handler())
	t.Cleanup(srv.Close)
	return srv, s
}

// newRecorderServer is used by the POST/diff/signature tests, which prefer
// httptest.ResponseRecorder so they can assert on bodies and status directly.
func newRecorderServer(opts ...Option) *Server {
	return New(store.NewInMemoryStore(), opts...)
}

// hx returns a deterministic hex-encoded 32-byte hash whose first byte is b.
func hx(b byte) string {
	var h [32]byte
	h[0] = b
	const hexdigits = "0123456789abcdef"
	out := make([]byte, 64)
	for i, x := range h {
		out[i*2] = hexdigits[x>>4]
		out[i*2+1] = hexdigits[x&0x0f]
	}
	return string(out)
}

func doJSON(t *testing.T, srv *Server, method, path string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var rdr *bytes.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
		rdr = bytes.NewReader(b)
	} else {
		rdr = bytes.NewReader(nil)
	}
	r := httptest.NewRequest(method, path, rdr)
	w := httptest.NewRecorder()
	srv.Handler().ServeHTTP(w, r)
	return w
}

func decodeSnapshot(t *testing.T, w *httptest.ResponseRecorder) store.Snapshot {
	t.Helper()
	var snap store.Snapshot
	if err := json.NewDecoder(w.Body).Decode(&snap); err != nil {
		t.Fatalf("decode snapshot: %v (body=%s)", err, w.Body.String())
	}
	return snap
}

// --- original GET smoke tests (kept, updated for 4 sources) ------------------

func TestHealth(t *testing.T) {
	srv, _ := newLiveServer(t)
	resp, err := http.Get(srv.URL + "/health")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Errorf("status=%d want=200", resp.StatusCode)
	}
}

func TestListSources(t *testing.T) {
	srv, _ := newLiveServer(t)
	resp, err := http.Get(srv.URL + "/sources")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	defer resp.Body.Close()
	var body struct {
		Sources []string `json:"sources"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(body.Sources) != 4 {
		t.Errorf("len(sources)=%d want=4 (%v)", len(body.Sources), body.Sources)
	}
	var hasLocal bool
	for _, s := range body.Sources {
		if s == string(store.SourceLocal) {
			hasLocal = true
		}
	}
	if !hasLocal {
		t.Errorf("sources missing %q: %v", store.SourceLocal, body.Sources)
	}
}

func TestSnapshotByID_NotFound(t *testing.T) {
	srv, _ := newLiveServer(t)
	resp, err := http.Get(srv.URL + "/snapshot/missing")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 404 {
		t.Errorf("status=%d want=404", resp.StatusCode)
	}
}

func TestSnapshotByID_Found(t *testing.T) {
	srv, st := newLiveServer(t)
	_ = st.PutSnapshot(context.Background(), store.Snapshot{
		ID:        "snap-1",
		Source:    store.SourceNCMEC,
		HashCount: 100,
		CreatedAt: time.Now(),
	})
	resp, err := http.Get(srv.URL + "/snapshot/snap-1")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Errorf("status=%d want=200", resp.StatusCode)
	}
}

func TestListSnapshots_BySource(t *testing.T) {
	srv, st := newLiveServer(t)
	now := time.Now()
	_ = st.PutSnapshot(context.Background(), store.Snapshot{ID: "a", Source: store.SourceNCMEC, CreatedAt: now})
	_ = st.PutSnapshot(context.Background(), store.Snapshot{ID: "b", Source: store.SourceIWF, CreatedAt: now})
	resp, err := http.Get(srv.URL + "/snapshots/ncmec")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	defer resp.Body.Close()
	var body struct {
		Source    string           `json:"source"`
		Snapshots []store.Snapshot `json:"snapshots"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(body.Snapshots) != 1 {
		t.Errorf("len(snapshots)=%d want=1", len(body.Snapshots))
	}
	if body.Snapshots[0].ID != "a" {
		t.Errorf("id=%s want=a", body.Snapshots[0].ID)
	}
}

func TestLatestSnapshot(t *testing.T) {
	srv, st := newLiveServer(t)
	now := time.Now()
	_ = st.PutSnapshot(context.Background(), store.Snapshot{ID: "older", Source: store.SourceNCMEC, CreatedAt: now.Add(-time.Hour)})
	_ = st.PutSnapshot(context.Background(), store.Snapshot{ID: "newer", Source: store.SourceNCMEC, CreatedAt: now})
	resp, err := http.Get(srv.URL + "/snapshots/ncmec/latest")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	defer resp.Body.Close()
	var snap store.Snapshot
	if err := json.NewDecoder(resp.Body).Decode(&snap); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if snap.ID != "newer" {
		t.Errorf("id=%s want=newer", snap.ID)
	}
}

// --- v0.5: POST ingestion + diff + signing ----------------------------------

// TestCreateAndGetSnapshot is the core v0.5 acceptance: POST a hash file ->
// stored as a snapshot -> GET serves the correct snapshot back.
func TestCreateAndGetSnapshot(t *testing.T) {
	srv := newRecorderServer()
	body := createSnapshotRequest{
		SnapshotID: "local-1",
		HashesHex:  []string{hx(1), hx(2), hx(3)},
		Version:    "op-2026-05-30",
	}
	w := doJSON(t, srv, http.MethodPost, "/sources/local/snapshots", body)
	if w.Code != http.StatusCreated {
		t.Fatalf("create status = %d, want 201 (body=%s)", w.Code, w.Body.String())
	}
	created := decodeSnapshot(t, w)
	if created.ID != "local-1" {
		t.Fatalf("created.ID = %q, want local-1", created.ID)
	}
	if created.Source != store.SourceLocal {
		t.Fatalf("created.Source = %q, want local", created.Source)
	}
	if created.HashCount != 3 {
		t.Fatalf("created.HashCount = %d, want 3", created.HashCount)
	}
	if created.CreatedAt.IsZero() {
		t.Fatalf("created.CreatedAt is zero")
	}
	if len(created.Hashes) != 3 {
		t.Fatalf("created.Hashes len = %d, want 3", len(created.Hashes))
	}

	w = doJSON(t, srv, http.MethodGet, "/snapshot/local-1", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("get status = %d, want 200", w.Code)
	}
	got := decodeSnapshot(t, w)
	if got.ID != "local-1" || got.HashCount != 3 || len(got.Hashes) != 3 {
		t.Fatalf("round-trip mismatch: %+v", got)
	}

	w = doJSON(t, srv, http.MethodGet, "/snapshots/local/latest", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("latest status = %d, want 200", w.Code)
	}
	latest := decodeSnapshot(t, w)
	if latest.ID != "local-1" {
		t.Fatalf("latest.ID = %q, want local-1", latest.ID)
	}
}

func TestCreateSnapshotValidation(t *testing.T) {
	tests := []struct {
		name string
		path string
		body any
		want int
	}{
		{"unknown source", "/sources/bogus/snapshots", createSnapshotRequest{SnapshotID: "x", HashesHex: []string{hx(1)}}, http.StatusBadRequest},
		{"missing id", "/sources/local/snapshots", createSnapshotRequest{HashesHex: []string{hx(1)}}, http.StatusBadRequest},
		{"bad hex", "/sources/local/snapshots", createSnapshotRequest{SnapshotID: "x", HashesHex: []string{"zzzz"}}, http.StatusBadRequest},
		{"short hash", "/sources/local/snapshots", createSnapshotRequest{SnapshotID: "x", HashesHex: []string{"abcd"}}, http.StatusBadRequest},
		{"empty hash list ok", "/sources/local/snapshots", createSnapshotRequest{SnapshotID: "empty-ok", HashesHex: []string{}}, http.StatusCreated},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			srv := newRecorderServer()
			w := doJSON(t, srv, http.MethodPost, tc.path, tc.body)
			if w.Code != tc.want {
				t.Fatalf("status = %d, want %d (body=%s)", w.Code, tc.want, w.Body.String())
			}
		})
	}
}

func TestCreateSnapshotDuplicateConflict(t *testing.T) {
	srv := newRecorderServer()
	body := createSnapshotRequest{SnapshotID: "dup", HashesHex: []string{hx(1)}}
	if w := doJSON(t, srv, http.MethodPost, "/sources/local/snapshots", body); w.Code != http.StatusCreated {
		t.Fatalf("first create = %d, want 201", w.Code)
	}
	w := doJSON(t, srv, http.MethodPost, "/sources/local/snapshots", body)
	if w.Code != http.StatusConflict {
		t.Fatalf("duplicate create = %d, want 409", w.Code)
	}
}

func TestCreateSnapshotMethodNotAllowed(t *testing.T) {
	srv := newRecorderServer()
	w := doJSON(t, srv, http.MethodGet, "/sources/local/snapshots", nil)
	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("GET on create route = %d, want 405", w.Code)
	}
	if allow := w.Header().Get("Allow"); !strings.Contains(allow, http.MethodPost) {
		t.Fatalf("Allow header = %q, want to contain POST", allow)
	}
}

// TestDiffBetweenSnapshots is the second half of v0.5 acceptance: diff between
// two snapshots returns the right delta.
func TestDiffBetweenSnapshots(t *testing.T) {
	srv := newRecorderServer()
	from := createSnapshotRequest{SnapshotID: "d-from", HashesHex: []string{hx(1), hx(2), hx(3)}}
	to := createSnapshotRequest{SnapshotID: "d-to", HashesHex: []string{hx(2), hx(3), hx(4), hx(5)}}
	if w := doJSON(t, srv, http.MethodPost, "/sources/local/snapshots", from); w.Code != http.StatusCreated {
		t.Fatalf("create from = %d", w.Code)
	}
	if w := doJSON(t, srv, http.MethodPost, "/sources/local/snapshots", to); w.Code != http.StatusCreated {
		t.Fatalf("create to = %d", w.Code)
	}

	w := doJSON(t, srv, http.MethodGet, "/diff/d-from/d-to", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("diff status = %d, want 200 (body=%s)", w.Code, w.Body.String())
	}
	var d struct {
		AddedN     int `json:"added_n"`
		RemovedN   int `json:"removed_n"`
		UnchangedN int `json:"unchanged_n"`
	}
	if err := json.NewDecoder(w.Body).Decode(&d); err != nil {
		t.Fatalf("decode diff: %v", err)
	}
	if d.AddedN != 2 || d.RemovedN != 1 || d.UnchangedN != 2 {
		t.Fatalf("diff = +%d -%d =%d, want +2 -1 =2", d.AddedN, d.RemovedN, d.UnchangedN)
	}
}

// TestSignedSnapshot verifies the Ed25519 signing layer end-to-end: a server
// constructed with a signer stamps every snapshot with a verifiable signature
// and the signing key ID, and those are served on GET.
func TestSignedSnapshot(t *testing.T) {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatalf("genkey: %v", err)
	}
	signer, err := signing.NewSigner(priv)
	if err != nil {
		t.Fatalf("new signer: %v", err)
	}
	fixed := time.Unix(1_700_000_000, 0).UTC()
	srv := newRecorderServer(WithSigner(signer), WithClock(func() time.Time { return fixed }))

	body := createSnapshotRequest{SnapshotID: "signed-1", HashesHex: []string{hx(9), hx(7), hx(8)}}
	w := doJSON(t, srv, http.MethodPost, "/sources/local/snapshots", body)
	if w.Code != http.StatusCreated {
		t.Fatalf("create status = %d, want 201 (body=%s)", w.Code, w.Body.String())
	}
	created := decodeSnapshot(t, w)
	if len(created.Signature) == 0 {
		t.Fatalf("created snapshot has no signature")
	}
	if created.SigningKeyID == "" {
		t.Fatalf("created snapshot has no signing_key_id")
	}
	if created.SigningKeyID != signing.KeyID(pub) {
		t.Fatalf("signing_key_id = %q, want %q", created.SigningKeyID, signing.KeyID(pub))
	}

	w = doJSON(t, srv, http.MethodGet, "/snapshot/signed-1", nil)
	got := decodeSnapshot(t, w)
	if err := signing.Verify(&got, pub); err != nil {
		t.Fatalf("verify served snapshot: %v", err)
	}

	// Tampering with the hash set must break verification.
	got.Hashes[0][0] ^= 0xff
	if err := signing.Verify(&got, pub); err == nil {
		t.Fatalf("verification unexpectedly passed after tampering")
	}
}

// TestUnsignedByDefault confirms snapshots are stored unsigned when no signer
// is configured.
func TestUnsignedByDefault(t *testing.T) {
	srv := newRecorderServer()
	body := createSnapshotRequest{SnapshotID: "plain", HashesHex: []string{hx(1)}}
	w := doJSON(t, srv, http.MethodPost, "/sources/local/snapshots", body)
	created := decodeSnapshot(t, w)
	if len(created.Signature) != 0 {
		t.Fatalf("expected no signature, got %d bytes", len(created.Signature))
	}
	if created.SigningKeyID != "" {
		t.Fatalf("expected empty signing_key_id, got %q", created.SigningKeyID)
	}
}
