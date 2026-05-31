// Package signing provides Ed25519 signing and verification for snapshot
// manifests.
//
// Why this exists: HashStream may run with fake or operator-supplied list
// sources (no credentialed upstream). Even in that mode, downstream
// consumers want a tamper-evident signal that a snapshot's metadata and
// hash set were produced by the operator and not altered in transit or at
// rest. A detached Ed25519 signature over a canonical serialization of the
// snapshot gives them exactly that, with an operator-supplied key.
//
// Canonical signing payload (MUST match the TS SDK byte-for-byte):
//
//	snapshot_id "\n" hash_list_serialized "\n" created_at_unix
//
// where:
//   - snapshot_id          is the UTF-8 bytes of the snapshot ID
//   - hash_list_serialized is the snapshot's hashes, each lowercase-hex
//     encoded, sorted ascending, and joined with "\n" (the same
//     newline-delimited hex "hash file" format the service ingests)
//   - created_at_unix      is the decimal ASCII of the snapshot's CreatedAt
//     in Unix seconds (UTC)
//
// The three parts are joined with a single "\n". An empty hash list
// serializes the middle part as the empty string, yielding
// "id\n\ncreated".
package signing

import (
	"crypto/ed25519"
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"errors"
	"fmt"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/digitalharm/digitalharm-oss/packages/hashstream/internal/store"
)

// Signer holds an Ed25519 private key and the derived key ID.
type Signer struct {
	priv  ed25519.PrivateKey
	keyID string
}

// KeyID returns the hex-encoded sha256 prefix (first 8 bytes -> 16 hex
// chars) of the public key. It identifies which key signed a snapshot so
// verifiers can select the right public key.
func (s *Signer) KeyID() string { return s.keyID }

// PublicKey returns the signer's Ed25519 public key.
func (s *Signer) PublicKey() ed25519.PublicKey {
	return s.priv.Public().(ed25519.PublicKey)
}

// KeyID derives the canonical key ID from a public key: lowercase hex of the
// first 8 bytes of sha256(pub). Shared by Signer and verifiers so both sides
// agree on the identifier.
func KeyID(pub ed25519.PublicKey) string {
	sum := sha256.Sum256(pub)
	return hex.EncodeToString(sum[:8])
}

// NewSigner builds a Signer from an Ed25519 private key.
func NewSigner(priv ed25519.PrivateKey) (*Signer, error) {
	if l := len(priv); l != ed25519.PrivateKeySize {
		return nil, fmt.Errorf("signing: bad private key size %d, want %d", l, ed25519.PrivateKeySize)
	}
	pub := priv.Public().(ed25519.PublicKey)
	return &Signer{priv: priv, keyID: KeyID(pub)}, nil
}

// LoadSignerFromFile reads an Ed25519 private key from path and returns a
// Signer. The file may be:
//
//   - a PEM block (PKCS#8 "PRIVATE KEY"), or
//   - a raw 64-byte Ed25519 private key (ed25519.PrivateKeySize), or
//   - a raw 32-byte Ed25519 seed (ed25519.SeedSize).
//
// This flexibility lets operators supply a key in whatever form their KMS or
// keygen tooling emits without a conversion step.
func LoadSignerFromFile(path string) (*Signer, error) {
	data, err := os.ReadFile(path) //nolint:gosec // operator-supplied path, by design
	if err != nil {
		return nil, fmt.Errorf("signing: read key %q: %w", path, err)
	}
	priv, err := ParsePrivateKey(data)
	if err != nil {
		return nil, err
	}
	return NewSigner(priv)
}

// ParsePrivateKey parses an Ed25519 private key from PEM or raw bytes.
func ParsePrivateKey(data []byte) (ed25519.PrivateKey, error) {
	// Try PEM first.
	if block, _ := pem.Decode(data); block != nil {
		key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("signing: parse PKCS#8 key: %w", err)
		}
		ed, ok := key.(ed25519.PrivateKey)
		if !ok {
			return nil, fmt.Errorf("signing: PEM key is %T, want ed25519.PrivateKey", key)
		}
		return ed, nil
	}

	// Raw bytes: accept a trailing newline for convenience.
	raw := trimTrailingNewline(data)
	switch len(raw) {
	case ed25519.PrivateKeySize:
		return ed25519.PrivateKey(raw), nil
	case ed25519.SeedSize:
		return ed25519.NewKeyFromSeed(raw), nil
	default:
		return nil, fmt.Errorf(
			"signing: raw key is %d bytes, want %d (private) or %d (seed), or a PKCS#8 PEM block",
			len(raw), ed25519.PrivateKeySize, ed25519.SeedSize,
		)
	}
}

// ParsePublicKey parses an Ed25519 public key from PEM (PKIX "PUBLIC KEY"),
// raw 32 bytes, or hex-encoded 32 bytes. Used by tooling and tests.
func ParsePublicKey(data []byte) (ed25519.PublicKey, error) {
	if block, _ := pem.Decode(data); block != nil {
		key, err := x509.ParsePKIXPublicKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("signing: parse PKIX key: %w", err)
		}
		ed, ok := key.(ed25519.PublicKey)
		if !ok {
			return nil, fmt.Errorf("signing: PEM key is %T, want ed25519.PublicKey", key)
		}
		return ed, nil
	}
	raw := trimTrailingNewline(data)
	if len(raw) == ed25519.PublicKeySize {
		return ed25519.PublicKey(raw), nil
	}
	if decoded, err := hex.DecodeString(strings.TrimSpace(string(raw))); err == nil && len(decoded) == ed25519.PublicKeySize {
		return ed25519.PublicKey(decoded), nil
	}
	return nil, fmt.Errorf("signing: public key is not PEM, %d raw bytes, or %d hex chars", ed25519.PublicKeySize, ed25519.PublicKeySize*2)
}

// Payload builds the canonical signing payload for a snapshot. See the
// package doc for the exact format. Exported so tests (and any reimplementing
// SDK) can assert byte-for-byte agreement.
func Payload(id string, hashes []store.Hash, createdAt time.Time) []byte {
	return []byte(id + "\n" + serializeHashes(hashes) + "\n" + strconv.FormatInt(createdAt.UTC().Unix(), 10))
}

// serializeHashes renders hashes as sorted, lowercase-hex, newline-joined.
func serializeHashes(hashes []store.Hash) string {
	if len(hashes) == 0 {
		return ""
	}
	hexes := make([]string, len(hashes))
	for i, h := range hashes {
		hexes[i] = hex.EncodeToString(h[:])
	}
	sort.Strings(hexes)
	return strings.Join(hexes, "\n")
}

// Sign fills snap.Signature and snap.SigningKeyID over the canonical payload.
// It signs whatever hash set the snapshot carries (Hashes); for credentialed
// snapshots without inline hashes the payload's hash part is empty, which is
// still a stable, verifiable commitment to (id, created_at).
func (s *Signer) Sign(snap *store.Snapshot) {
	payload := Payload(snap.ID, snap.Hashes, snap.CreatedAt)
	snap.Signature = ed25519.Sign(s.priv, payload)
	snap.SigningKeyID = s.keyID
}

// Verify checks a snapshot's detached signature against pub.
func Verify(snap *store.Snapshot, pub ed25519.PublicKey) error {
	if len(snap.Signature) == 0 {
		return errors.New("signing: snapshot has no signature")
	}
	payload := Payload(snap.ID, snap.Hashes, snap.CreatedAt)
	if !ed25519.Verify(pub, payload, snap.Signature) {
		return errors.New("signing: signature verification failed")
	}
	return nil
}

func trimTrailingNewline(b []byte) []byte {
	for len(b) > 0 && (b[len(b)-1] == '\n' || b[len(b)-1] == '\r') {
		b = b[:len(b)-1]
	}
	return b
}
