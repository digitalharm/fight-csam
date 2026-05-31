package vault

// KMS is the operator-supplied key-management interface. EvidenceVault never
// holds plaintext evidence: the operator wraps (encrypts) a per-package data
// blob with their own KMS before Store, and unwraps after Get. The vault only
// ever persists the wrapped ciphertext.
//
// This indirection keeps the blast radius small — a breach of the vault yields
// only wrapped blobs, not decryptable evidence (see docs/counsel-scope-brief.md,
// "Encryption key custody").
type KMS interface {
	// Wrap encrypts plaintext into ciphertext suitable for storage.
	Wrap(plaintext []byte) ([]byte, error)
	// Unwrap decrypts ciphertext previously produced by Wrap.
	Unwrap(ciphertext []byte) ([]byte, error)
}

// NoopKMS is the v0.5 default. It performs NO encryption: Wrap and Unwrap are
// the identity function, so the bytes the operator hands in are stored exactly
// as given. This exists so the vault has a working KMS seam without taking a
// dependency on a cloud KMS SDK in the scaffold.
//
// PRODUCTION OPERATORS MUST REPLACE THIS. NoopKMS provides no confidentiality.
// Wire AWS KMS / GCP KMS / Azure Key Vault / Vault Transit in its place and
// pass already-wrapped ciphertext to the vault. See the README.
type NoopKMS struct{}

// Wrap returns the plaintext unchanged.
func (NoopKMS) Wrap(plaintext []byte) ([]byte, error) { return plaintext, nil }

// Unwrap returns the ciphertext unchanged.
func (NoopKMS) Unwrap(ciphertext []byte) ([]byte, error) { return ciphertext, nil }

// Ensure NoopKMS satisfies KMS at compile time.
var _ KMS = NoopKMS{}
