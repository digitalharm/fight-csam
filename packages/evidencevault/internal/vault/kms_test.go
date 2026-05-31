package vault

import (
	"bytes"
	"testing"
)

func TestNoopKMSIsIdentity(t *testing.T) {
	k := NoopKMS{}
	plaintext := []byte("operator-supplied bytes")

	wrapped, err := k.Wrap(plaintext)
	if err != nil {
		t.Fatalf("wrap: %v", err)
	}
	if !bytes.Equal(wrapped, plaintext) {
		t.Errorf("NoopKMS.Wrap altered bytes: got %q want %q", wrapped, plaintext)
	}

	unwrapped, err := k.Unwrap(wrapped)
	if err != nil {
		t.Fatalf("unwrap: %v", err)
	}
	if !bytes.Equal(unwrapped, plaintext) {
		t.Errorf("NoopKMS round-trip altered bytes: got %q want %q", unwrapped, plaintext)
	}
}
