package server

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/digitalharm/digitalharm-oss/packages/hashstream/internal/store"
)

func newTestServer(t *testing.T) (*httptest.Server, store.Store) {
	t.Helper()
	s := store.NewInMemoryStore()
	srv := httptest.NewServer(New(s).Handler())
	t.Cleanup(srv.Close)
	return srv, s
}

func TestHealth(t *testing.T) {
	srv, _ := newTestServer(t)
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
	srv, _ := newTestServer(t)
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
	if len(body.Sources) != 3 {
		t.Errorf("len(sources)=%d want=3", len(body.Sources))
	}
}

func TestSnapshotByID_NotFound(t *testing.T) {
	srv, _ := newTestServer(t)
	resp, _ := http.Get(srv.URL + "/snapshot/missing")
	defer resp.Body.Close()
	if resp.StatusCode != 404 {
		t.Errorf("status=%d want=404", resp.StatusCode)
	}
}

func TestSnapshotByID_Found(t *testing.T) {
	srv, st := newTestServer(t)
	_ = st.PutSnapshot(context.Background(), store.Snapshot{
		ID:        "snap-1",
		Source:    store.SourceNCMEC,
		HashCount: 100,
		CreatedAt: time.Now(),
	})
	resp, _ := http.Get(srv.URL + "/snapshot/snap-1")
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Errorf("status=%d want=200", resp.StatusCode)
	}
}

func TestListSnapshots_BySource(t *testing.T) {
	srv, st := newTestServer(t)
	now := time.Now()
	_ = st.PutSnapshot(context.Background(), store.Snapshot{ID: "a", Source: store.SourceNCMEC, CreatedAt: now})
	_ = st.PutSnapshot(context.Background(), store.Snapshot{ID: "b", Source: store.SourceIWF, CreatedAt: now})
	resp, _ := http.Get(srv.URL + "/snapshots/ncmec")
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
	srv, st := newTestServer(t)
	now := time.Now()
	_ = st.PutSnapshot(context.Background(), store.Snapshot{ID: "older", Source: store.SourceNCMEC, CreatedAt: now.Add(-time.Hour)})
	_ = st.PutSnapshot(context.Background(), store.Snapshot{ID: "newer", Source: store.SourceNCMEC, CreatedAt: now})
	resp, _ := http.Get(srv.URL + "/snapshots/ncmec/latest")
	defer resp.Body.Close()
	var snap store.Snapshot
	if err := json.NewDecoder(resp.Body).Decode(&snap); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if snap.ID != "newer" {
		t.Errorf("id=%s want=newer", snap.ID)
	}
}
