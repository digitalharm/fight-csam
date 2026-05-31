package store

import (
	"encoding/hex"
	"fmt"
)

// ParseHashHex decodes a single hex-encoded 32-byte hash. Input may be upper
// or lower case; surrounding whitespace is the caller's responsibility.
func ParseHashHex(s string) (Hash, error) {
	var h Hash
	b, err := hex.DecodeString(s)
	if err != nil {
		return h, fmt.Errorf("store: invalid hex hash %q: %w", s, err)
	}
	if len(b) != len(h) {
		return h, fmt.Errorf("store: hash %q decodes to %d bytes, want %d", s, len(b), len(h))
	}
	copy(h[:], b)
	return h, nil
}

// ParseHashesHex decodes a slice of hex strings into hashes, preserving order.
// Returns an error identifying the first bad entry by index.
func ParseHashesHex(hexes []string) ([]Hash, error) {
	out := make([]Hash, 0, len(hexes))
	for i, hx := range hexes {
		h, err := ParseHashHex(hx)
		if err != nil {
			return nil, fmt.Errorf("hash[%d]: %w", i, err)
		}
		out = append(out, h)
	}
	return out, nil
}
