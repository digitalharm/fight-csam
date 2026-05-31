package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/digitalharm/digitalharm-oss/packages/evidencevault/internal/custody"
	"github.com/digitalharm/digitalharm-oss/packages/evidencevault/internal/vault"
)

// newTestServer spins up an httptest.Server over the real HTTP mux backed by an
// in-memory vault, returning the server and its base URL.
func newTestServer(t *testing.T) (*httptest.Server, string) {
	t.Helper()
	v := vault.NewInMemoryVault(time.Now)
	srv := newServer(v, time.Now)
	ts := httptest.NewServer(srv.routes())
	t.Cleanup(ts.Close)
	return ts, ts.URL
}

func doJSON(t *testing.T, method, url string, body any) (*http.Response, []byte) {
	t.Helper()
	var rdr io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
		rdr = bytes.NewReader(b)
	}
	req, err := http.NewRequest(method, url, rdr)
	if err != nil {
		t.Fatalf("new request: %v", err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("%s %s: %v", method, url, err)
	}
	data, err := io.ReadAll(resp.Body)
	_ = resp.Body.Close()
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	return resp, data
}

// TestFullLifecycleOverHTTP walks the acceptance path end to end with real HTTP
// calls: Store -> Get -> PlaceHold -> Get-while-held -> ReleaseHold -> Delete ->
// Get-after-delete.
func TestFullLifecycleOverHTTP(t *testing.T) {
	_, base := newTestServer(t)

	// 1. Store.
	resp, data := doJSON(t, http.MethodPost, base+"/packages", map[string]any{
		"id":               "ev-lifecycle",
		"ciphertext":       []byte("wrapped-bytes"),
		"content_ref_hash": "sha256-abc",
		"operator":         "ts-operator",
	})
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("store status=%d body=%s", resp.StatusCode, data)
	}
	var stored storeResponse
	if err := json.Unmarshal(data, &stored); err != nil {
		t.Fatalf("decode store resp: %v (%s)", err, data)
	}
	if stored.PackageID != "ev-lifecycle" {
		t.Fatalf("package_id=%s want=ev-lifecycle", stored.PackageID)
	}

	// 2. Get (appends an Accessed entry: genesis + accessed = 2).
	resp, data = doJSON(t, http.MethodGet, base+"/packages/ev-lifecycle?operator=auditor&purpose=audit-1", nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("get status=%d body=%s", resp.StatusCode, data)
	}
	var view packageView
	if err := json.Unmarshal(data, &view); err != nil {
		t.Fatalf("decode get: %v (%s)", err, data)
	}
	if string(view.Ciphertext) != "wrapped-bytes" {
		t.Errorf("ciphertext=%q want=wrapped-bytes", view.Ciphertext)
	}
	if len(view.Custody.Entries) != 2 {
		t.Errorf("custody entries=%d want=2 after first get", len(view.Custody.Entries))
	}
	if view.Custody.Entries[1].Action != custody.ActionAccessed {
		t.Errorf("entry[1] action=%s want=accessed", view.Custody.Entries[1].Action)
	}

	// 3. PlaceHold.
	resp, data = doJSON(t, http.MethodPost, base+"/packages/ev-lifecycle/hold", map[string]any{
		"operator": "counsel",
		"hold_ref": "lit-2026-001",
	})
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("place hold status=%d body=%s", resp.StatusCode, data)
	}

	// 4. Get while held — must still succeed.
	resp, data = doJSON(t, http.MethodGet, base+"/packages/ev-lifecycle?operator=auditor&purpose=audit-2", nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("get-while-held status=%d body=%s", resp.StatusCode, data)
	}
	_ = json.Unmarshal(data, &view)
	if !view.Retention.OnLitigationHold {
		t.Error("expected OnLitigationHold true while held")
	}

	// 5. Delete while held — must be rejected with 409.
	resp, data = doJSON(t, http.MethodDelete, base+"/packages/ev-lifecycle?operator=retention-bot", nil)
	if resp.StatusCode != http.StatusConflict {
		t.Fatalf("delete-while-held status=%d want=409 body=%s", resp.StatusCode, data)
	}

	// 6. ReleaseHold.
	resp, data = doJSON(t, http.MethodDelete, base+"/packages/ev-lifecycle/hold?operator=counsel&hold_ref=lit-resolved", nil)
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("release hold status=%d body=%s", resp.StatusCode, data)
	}

	// 7. Delete — now succeeds.
	resp, data = doJSON(t, http.MethodDelete, base+"/packages/ev-lifecycle?operator=retention-bot", nil)
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("delete status=%d body=%s", resp.StatusCode, data)
	}

	// 8. Get after delete — succeeds, but ciphertext is gone and no new custody
	// entry is appended (chain is terminal).
	resp, data = doJSON(t, http.MethodGet, base+"/packages/ev-lifecycle?operator=auditor&purpose=post-mortem", nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("get-after-delete status=%d body=%s", resp.StatusCode, data)
	}
	_ = json.Unmarshal(data, &view)
	if view.Ciphertext != nil {
		t.Errorf("expected ciphertext nil after delete, got %q", view.Ciphertext)
	}
	if !view.Custody.IsDeleted() {
		t.Error("expected custody terminal after delete")
	}
	// genesis + accessed(get#1) + hold + accessed(get#2 while held) + released +
	// deleted = 6. The post-delete get does NOT append.
	if got := len(view.Custody.Entries); got != 6 {
		t.Errorf("custody entries=%d want=6 (post-delete get must not append)", got)
	}
}

func TestStoreDuplicateReturns409(t *testing.T) {
	_, base := newTestServer(t)
	body := map[string]any{"id": "dup", "content_ref_hash": "h"}
	resp, _ := doJSON(t, http.MethodPost, base+"/packages", body)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("first store status=%d", resp.StatusCode)
	}
	resp, data := doJSON(t, http.MethodPost, base+"/packages", body)
	if resp.StatusCode != http.StatusConflict {
		t.Errorf("duplicate store status=%d want=409 body=%s", resp.StatusCode, data)
	}
}

func TestGetMissingReturns404(t *testing.T) {
	_, base := newTestServer(t)
	resp, _ := doJSON(t, http.MethodGet, base+"/packages/nope?operator=x&purpose=y", nil)
	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("get-missing status=%d want=404", resp.StatusCode)
	}
}

func TestStoreRequiresID(t *testing.T) {
	_, base := newTestServer(t)
	resp, _ := doJSON(t, http.MethodPost, base+"/packages", map[string]any{"content_ref_hash": "h"})
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("store-without-id status=%d want=400", resp.StatusCode)
	}
}

func TestCustodyEndpointReturnsLog(t *testing.T) {
	_, base := newTestServer(t)
	doJSON(t, http.MethodPost, base+"/packages", map[string]any{"id": "ev-c", "content_ref_hash": "h", "operator": "op"})
	resp, data := doJSON(t, http.MethodGet, base+"/packages/ev-c/custody", nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("custody status=%d body=%s", resp.StatusCode, data)
	}
	var log custody.Log
	if err := json.Unmarshal(data, &log); err != nil {
		t.Fatalf("decode custody: %v (%s)", err, data)
	}
	if log.EvidenceID != "ev-c" {
		t.Errorf("evidence id=%s want=ev-c", log.EvidenceID)
	}
	if len(log.Entries) == 0 || log.Entries[0].Action != custody.ActionStored {
		t.Errorf("expected genesis stored entry, got %+v", log.Entries)
	}
}

func TestExpiredEndpoint(t *testing.T) {
	_, base := newTestServer(t)
	doJSON(t, http.MethodPost, base+"/packages", map[string]any{"id": "ev-x", "content_ref_hash": "h"})

	// As-of now: a freshly stored US-federal package (90d) is not expired.
	resp, data := doJSON(t, http.MethodGet, base+"/expired", nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expired status=%d body=%s", resp.StatusCode, data)
	}
	var er expiredResponse
	if err := json.Unmarshal(data, &er); err != nil {
		t.Fatalf("decode expired: %v (%s)", err, data)
	}
	if len(er.Expired) != 0 {
		t.Errorf("expected nothing expired now, got %v", er.Expired)
	}

	// As-of far future: it should appear.
	future := time.Now().Add(365 * 24 * time.Hour).UTC().Format(time.RFC3339)
	resp, data = doJSON(t, http.MethodGet, base+"/expired?as_of="+future, nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expired-future status=%d body=%s", resp.StatusCode, data)
	}
	_ = json.Unmarshal(data, &er)
	found := false
	for _, id := range er.Expired {
		if id == "ev-x" {
			found = true
		}
	}
	if !found {
		t.Errorf("expected ev-x expired in the future, got %v", er.Expired)
	}
}

func TestExpiredRejectsBadAsOf(t *testing.T) {
	_, base := newTestServer(t)
	resp, _ := doJSON(t, http.MethodGet, base+"/expired?as_of=not-a-time", nil)
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("bad as_of status=%d want=400", resp.StatusCode)
	}
}

func TestPlaceHoldRequiresHoldRef(t *testing.T) {
	_, base := newTestServer(t)
	doJSON(t, http.MethodPost, base+"/packages", map[string]any{"id": "ev-h", "content_ref_hash": "h"})
	resp, _ := doJSON(t, http.MethodPost, base+"/packages/ev-h/hold", map[string]any{"operator": "counsel"})
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("hold-without-ref status=%d want=400", resp.StatusCode)
	}
}

// TestOpenVaultSpecs covers the --store flag parsing used by `serve`.
func TestOpenVaultSpecs(t *testing.T) {
	mem, desc, err := openVault("memory::")
	if err != nil || mem == nil {
		t.Fatalf("memory:: -> %v", err)
	}
	if !strings.Contains(desc, "in-memory") {
		t.Errorf("memory desc=%q", desc)
	}

	dir := t.TempDir()
	disk, desc, err := openVault("disk:" + dir)
	if err != nil || disk == nil {
		t.Fatalf("disk:%s -> %v", dir, err)
	}
	if !strings.Contains(desc, dir) {
		t.Errorf("disk desc=%q want substring %q", desc, dir)
	}

	if _, _, err := openVault("disk:"); err == nil {
		t.Error("disk: with no path should error")
	}
	if _, _, err := openVault("bogus"); err == nil {
		t.Error("spec without scheme separator should error")
	}
	if _, _, err := openVault("ftp:/x"); err == nil {
		t.Error("unknown scheme should error")
	}
}
