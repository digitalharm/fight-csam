package store

import (
	"context"
	"encoding/json"
	"testing"
	"time"
)

func h(b byte) Hash {
	var x Hash
	x[0] = b
	return x
}

func TestExactDiffWithInlineHashes(t *testing.T) {
	st := NewInMemoryStore()
	ctx := context.Background()
	from := Snapshot{
		ID: "f", Source: SourceLocal, HashCount: 3,
		CreatedAt: time.Now().UTC(),
		Hashes:    []Hash{h(1), h(2), h(3)},
	}
	to := Snapshot{
		ID: "t", Source: SourceLocal, HashCount: 4,
		CreatedAt: time.Now().UTC().Add(time.Hour),
		Hashes:    []Hash{h(2), h(3), h(4), h(5)},
	}
	_ = st.PutSnapshot(ctx, from)
	_ = st.PutSnapshot(ctx, to)

	d, err := st.DiffSnapshots(ctx, "f", "t")
	if err != nil {
		t.Fatalf("diff: %v", err)
	}
	if d.AddedN != 2 || d.RemovedN != 1 || d.UnchangedN != 2 {
		t.Fatalf("diff = +%d -%d =%d, want +2 -1 =2", d.AddedN, d.RemovedN, d.UnchangedN)
	}
}

func TestDiffIdenticalSets(t *testing.T) {
	st := NewInMemoryStore()
	ctx := context.Background()
	a := Snapshot{ID: "a", Source: SourceLocal, HashCount: 2, CreatedAt: time.Now().UTC(), Hashes: []Hash{h(1), h(2)}}
	b := Snapshot{ID: "b", Source: SourceLocal, HashCount: 2, CreatedAt: time.Now().UTC().Add(time.Minute), Hashes: []Hash{h(2), h(1)}}
	_ = st.PutSnapshot(ctx, a)
	_ = st.PutSnapshot(ctx, b)
	d, err := st.DiffSnapshots(ctx, "a", "b")
	if err != nil {
		t.Fatalf("diff: %v", err)
	}
	if d.AddedN != 0 || d.RemovedN != 0 || d.UnchangedN != 2 {
		t.Fatalf("identical diff = +%d -%d =%d, want +0 -0 =2", d.AddedN, d.RemovedN, d.UnchangedN)
	}
}

func TestSnapshotJSONRoundTrip(t *testing.T) {
	orig := Snapshot{
		ID:           "rt",
		Source:       SourceLocal,
		Version:      "v1",
		HashCount:    2,
		CreatedAt:    time.Unix(1_700_000_000, 0).UTC(),
		Hashes:       []Hash{h(1), h(2)},
		Signature:    []byte{0xde, 0xad, 0xbe, 0xef},
		SigningKeyID: "abcd1234abcd1234",
	}
	b, err := json.Marshal(orig)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	// Wire form must use snake_case + hashes_hex.
	s := string(b)
	for _, want := range []string{`"hash_count":2`, `"hashes_hex":`, `"signing_key_id":"abcd1234abcd1234"`, `"created_at":`} {
		if !contains(s, want) {
			t.Fatalf("wire JSON missing %q: %s", want, s)
		}
	}

	var back Snapshot
	if err := json.Unmarshal(b, &back); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if back.ID != orig.ID || back.HashCount != orig.HashCount || len(back.Hashes) != 2 {
		t.Fatalf("round-trip mismatch: %+v", back)
	}
	if back.Hashes[0] != h(1) || back.Hashes[1] != h(2) {
		t.Fatalf("hashes round-trip mismatch: %+v", back.Hashes)
	}
	if string(back.Signature) != string(orig.Signature) {
		t.Fatalf("signature round-trip mismatch")
	}
}

func TestParseHashHexErrors(t *testing.T) {
	if _, err := ParseHashHex("zz"); err == nil {
		t.Fatal("want error for invalid hex")
	}
	if _, err := ParseHashHex("abcd"); err == nil {
		t.Fatal("want error for short hash")
	}
	good := "0100000000000000000000000000000000000000000000000000000000000000"
	if got, err := ParseHashHex(good); err != nil || got != h(1) {
		t.Fatalf("good hash parse failed: %v", err)
	}
}

func contains(s, sub string) bool {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
