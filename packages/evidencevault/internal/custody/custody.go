// Package custody implements chain-of-custody records for evidence.
//
// Every evidence package carries an immutable, append-only custody
// log. Every action that touches the evidence (store, access, hold,
// release, deletion) appends a new entry. Auditors verify the log is
// complete by replaying from the genesis entry.
package custody

import (
	"errors"
	"time"
)

// Action is the kind of custody event recorded.
type Action string

const (
	ActionStored      Action = "stored"
	ActionAccessed    Action = "accessed"
	ActionHoldPlaced  Action = "hold-placed"
	ActionHoldReleased Action = "hold-released"
	ActionDeleted     Action = "deleted"
)

// Entry is one append-only record in the custody log.
type Entry struct {
	Sequence       int       // 0-indexed monotonic position
	Action         Action
	OperatorID     string    // who performed the action
	PurposeRef     string    // free-form reference (subpoena ID, audit ticket, etc.)
	OccurredAt     time.Time
	// Hash of the prior entry, for tamper-evidence. Each new entry is
	// computed over the prior entry's bytes; modifying any earlier
	// entry breaks the chain.
	PriorEntryHash string
}

// Log is the in-memory custody log for one evidence package.
// Production deployments persist this to append-only storage.
type Log struct {
	EvidenceID string
	Entries    []Entry
}

// NewLog creates a custody log seeded with a stored-genesis entry.
func NewLog(evidenceID, operatorID, purposeRef string, at time.Time) *Log {
	return &Log{
		EvidenceID: evidenceID,
		Entries: []Entry{
			{
				Sequence:       0,
				Action:         ActionStored,
				OperatorID:     operatorID,
				PurposeRef:     purposeRef,
				OccurredAt:     at,
				PriorEntryHash: "",
			},
		},
	}
}

// Append records a new custody event. Returns ErrAlreadyDeleted if the
// log already terminates in a deletion entry — appending after deletion
// is structurally invalid.
var ErrAlreadyDeleted = errors.New("custody log already terminated in deletion")

func (l *Log) Append(action Action, operatorID, purposeRef string, at time.Time) error {
	if len(l.Entries) > 0 && l.Entries[len(l.Entries)-1].Action == ActionDeleted {
		return ErrAlreadyDeleted
	}
	prior := l.Entries[len(l.Entries)-1]
	l.Entries = append(l.Entries, Entry{
		Sequence:       prior.Sequence + 1,
		Action:         action,
		OperatorID:     operatorID,
		PurposeRef:     purposeRef,
		OccurredAt:     at,
		PriorEntryHash: hashEntry(prior),
	})
	return nil
}

// IsOnHold returns true if the most recent hold action is a placement.
func (l *Log) IsOnHold() bool {
	for i := len(l.Entries) - 1; i >= 0; i-- {
		switch l.Entries[i].Action {
		case ActionHoldPlaced:
			return true
		case ActionHoldReleased:
			return false
		}
	}
	return false
}

// IsDeleted returns true if the log terminates in deletion.
func (l *Log) IsDeleted() bool {
	return len(l.Entries) > 0 && l.Entries[len(l.Entries)-1].Action == ActionDeleted
}

// Verify checks the prior-hash chain. Returns nil if intact.
func (l *Log) Verify() error {
	for i := 1; i < len(l.Entries); i++ {
		expected := hashEntry(l.Entries[i-1])
		if l.Entries[i].PriorEntryHash != expected {
			return errors.New("custody log tampered: hash chain broken at sequence " +
				itoa(l.Entries[i].Sequence))
		}
	}
	return nil
}

// hashEntry is a stable, deterministic string hash. Scaffold uses a
// simple format; production swaps in SHA-256 or BLAKE3.
func hashEntry(e Entry) string {
	return e.OperatorID + "|" + string(e.Action) + "|" + e.OccurredAt.UTC().Format(time.RFC3339Nano) + "|" + itoa(e.Sequence)
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	negative := n < 0
	if negative {
		n = -n
	}
	digits := []byte{}
	for n > 0 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
		n /= 10
	}
	if negative {
		return "-" + string(digits)
	}
	return string(digits)
}
