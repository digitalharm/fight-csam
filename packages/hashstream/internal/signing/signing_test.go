package signing

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/digitalharm/fight-csam/packages/hashstream/internal/store"
)

func mustHash(t *testing.T, b byte) store.Hash {
	t.Helper()
	var h store.Hash
	h[0] = b
	return h
}

// TestPayloadCanonicalForm pins the exact byte layout of the signing payload.
// The TypeScript SDK reimplements this; if this string changes, the SDK's
// verify helper must change in lockstep.
func TestPayloadCanonicalForm(t *testing.T) {
	created := time.Unix(1_700_000_000, 0).UTC()
	// Two hashes provided out of order; serialization must sort them.
	h2 := mustHash(t, 0x02) // hex starts 02...
	h1 := mustHash(t, 0x01) // hex starts 01...
	got := string(Payload("snap-1", []store.Hash{h2, h1}, created))

	h1hex := "0100000000000000000000000000000000000000000000000000000000000000"
	h2hex := "0200000000000000000000000000000000000000000000000000000000000000"
	want := "snap-1" + "\n" + h1hex + "\n" + h2hex + "\n" + "1700000000"
	if got != want {
		t.Fatalf("payload mismatch:\n got=%q\nwant=%q", got, want)
	}
}

func TestPayloadEmptyHashes(t *testing.T) {
	created := time.Unix(42, 0).UTC()
	got := string(Payload("id", nil, created))
	want := "id" + "\n" + "" + "\n" + "42"
	if got != want {
		t.Fatalf("empty payload = %q, want %q", got, want)
	}
}

func TestSignVerifyRoundTrip(t *testing.T) {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatalf("genkey: %v", err)
	}
	signer, err := NewSigner(priv)
	if err != nil {
		t.Fatalf("new signer: %v", err)
	}
	snap := &store.Snapshot{
		ID:        "rt-1",
		Source:    store.SourceLocal,
		CreatedAt: time.Unix(1_700_000_123, 0).UTC(),
		Hashes:    []store.Hash{mustHash(t, 5), mustHash(t, 6)},
	}
	snap.HashCount = len(snap.Hashes)
	signer.Sign(snap)

	if snap.SigningKeyID != KeyID(pub) {
		t.Fatalf("key id = %q, want %q", snap.SigningKeyID, KeyID(pub))
	}
	if err := Verify(snap, pub); err != nil {
		t.Fatalf("verify: %v", err)
	}

	// Wrong key fails.
	otherPub, _, _ := ed25519.GenerateKey(rand.Reader)
	if err := Verify(snap, otherPub); err == nil {
		t.Fatal("verify with wrong key should fail")
	}

	// Tampered created_at fails.
	tampered := *snap
	tampered.CreatedAt = tampered.CreatedAt.Add(time.Second)
	if err := Verify(&tampered, pub); err == nil {
		t.Fatal("verify after created_at tamper should fail")
	}
}

func TestVerifyNoSignature(t *testing.T) {
	pub, _, _ := ed25519.GenerateKey(rand.Reader)
	if err := Verify(&store.Snapshot{ID: "x"}, pub); err == nil {
		t.Fatal("verify with no signature should fail")
	}
}

func TestLoadSignerFromFilePEM(t *testing.T) {
	_, priv, _ := ed25519.GenerateKey(rand.Reader)
	der, err := x509.MarshalPKCS8PrivateKey(priv)
	if err != nil {
		t.Fatalf("marshal pkcs8: %v", err)
	}
	pemBytes := pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: der})

	dir := t.TempDir() // outside the repo; never committed
	path := filepath.Join(dir, "key.pem")
	if err := os.WriteFile(path, pemBytes, 0o600); err != nil {
		t.Fatalf("write key: %v", err)
	}
	signer, err := LoadSignerFromFile(path)
	if err != nil {
		t.Fatalf("load PEM signer: %v", err)
	}
	if signer.KeyID() != KeyID(priv.Public().(ed25519.PublicKey)) {
		t.Fatal("loaded signer key id mismatch")
	}
}

func TestLoadSignerFromFileRawAndSeed(t *testing.T) {
	_, priv, _ := ed25519.GenerateKey(rand.Reader)
	dir := t.TempDir()

	// Raw 64-byte private key.
	rawPath := filepath.Join(dir, "key.raw")
	if err := os.WriteFile(rawPath, priv, 0o600); err != nil {
		t.Fatalf("write raw: %v", err)
	}
	if _, err := LoadSignerFromFile(rawPath); err != nil {
		t.Fatalf("load raw signer: %v", err)
	}

	// 32-byte seed.
	seedPath := filepath.Join(dir, "key.seed")
	if err := os.WriteFile(seedPath, priv.Seed(), 0o600); err != nil {
		t.Fatalf("write seed: %v", err)
	}
	signer, err := LoadSignerFromFile(seedPath)
	if err != nil {
		t.Fatalf("load seed signer: %v", err)
	}
	// Seed-derived key must match the original key's identity.
	if signer.KeyID() != KeyID(priv.Public().(ed25519.PublicKey)) {
		t.Fatal("seed-derived key id mismatch")
	}
}

func TestParsePublicKeyForms(t *testing.T) {
	pub, _, _ := ed25519.GenerateKey(rand.Reader)

	// Raw 32 bytes.
	if got, err := ParsePublicKey(pub); err != nil || KeyID(got) != KeyID(pub) {
		t.Fatalf("raw pub parse: %v", err)
	}

	// PKIX PEM.
	der, _ := x509.MarshalPKIXPublicKey(pub)
	pemBytes := pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: der})
	if got, err := ParsePublicKey(pemBytes); err != nil || KeyID(got) != KeyID(pub) {
		t.Fatalf("pem pub parse: %v", err)
	}
}
