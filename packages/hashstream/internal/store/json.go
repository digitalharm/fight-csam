package store

import (
	"encoding/hex"
	"encoding/json"
	"time"
)

// The wire format is the contract shared with the TypeScript SDK
// (packages/hashstream/sdk-ts). Field names are snake_case. Snapshot uses a
// custom marshaler so the inline hash set is rendered as hex strings
// (hashes_hex) — the same newline-delimited hex "hash file" format the POST
// endpoint ingests — rather than Go's default base64 of raw bytes.
//
// signature is rendered as base64 (Go's default for []byte) and is null when
// the snapshot is unsigned; signing_key_id is omitted when empty.

type snapshotWire struct {
	ID           string    `json:"id"`
	Source       Source    `json:"source"`
	Version      string    `json:"version"`
	HashCount    int       `json:"hash_count"`
	CreatedAt    time.Time `json:"created_at"`
	UpstreamAt   time.Time `json:"upstream_at"`
	BlobURI      string    `json:"blob_uri"`
	HashesHex    []string  `json:"hashes_hex,omitempty"`
	Signature    []byte    `json:"signature"`
	SigningKeyID string    `json:"signing_key_id,omitempty"`
}

// MarshalJSON renders a Snapshot in the wire format shared with the SDK.
func (s Snapshot) MarshalJSON() ([]byte, error) {
	var hexes []string
	if s.Hashes != nil {
		hexes = make([]string, len(s.Hashes))
		for i, h := range s.Hashes {
			hexes[i] = hex.EncodeToString(h[:])
		}
	}
	return json.Marshal(snapshotWire{
		ID:           s.ID,
		Source:       s.Source,
		Version:      s.Version,
		HashCount:    s.HashCount,
		CreatedAt:    s.CreatedAt,
		UpstreamAt:   s.UpstreamAt,
		BlobURI:      s.BlobURI,
		HashesHex:    hexes,
		Signature:    s.Signature,
		SigningKeyID: s.SigningKeyID,
	})
}

// UnmarshalJSON parses the wire format back into a Snapshot. Symmetric with
// MarshalJSON so round-trips (and the server's own decode paths) are exact.
func (s *Snapshot) UnmarshalJSON(b []byte) error {
	var w snapshotWire
	if err := json.Unmarshal(b, &w); err != nil {
		return err
	}
	var hashes []Hash
	if w.HashesHex != nil {
		hashes = make([]Hash, 0, len(w.HashesHex))
		for _, hx := range w.HashesHex {
			h, err := ParseHashHex(hx)
			if err != nil {
				return err
			}
			hashes = append(hashes, h)
		}
	}
	*s = Snapshot{
		ID:           w.ID,
		Source:       w.Source,
		Version:      w.Version,
		HashCount:    w.HashCount,
		CreatedAt:    w.CreatedAt,
		UpstreamAt:   w.UpstreamAt,
		BlobURI:      w.BlobURI,
		Hashes:       hashes,
		Signature:    w.Signature,
		SigningKeyID: w.SigningKeyID,
	}
	return nil
}

// Diff marshals with snake_case field names matching the SDK.
type diffWire struct {
	From       *Snapshot `json:"from"`
	To         *Snapshot `json:"to"`
	AddedN     int       `json:"added_n"`
	RemovedN   int       `json:"removed_n"`
	UnchangedN int       `json:"unchanged_n"`
}

// MarshalJSON renders a Diff in the wire format shared with the SDK.
func (d Diff) MarshalJSON() ([]byte, error) {
	return json.Marshal(diffWire{
		From:       d.From,
		To:         d.To,
		AddedN:     d.AddedN,
		RemovedN:   d.RemovedN,
		UnchangedN: d.UnchangedN,
	})
}
