package custody

import (
	"testing"
	"time"
)

func TestNewLogStartsWithStoredEntry(t *testing.T) {
	log := NewLog("ev-1", "op-1", "ingestion", time.Now())
	if len(log.Entries) != 1 {
		t.Fatalf("len=%d want=1", len(log.Entries))
	}
	if log.Entries[0].Action != ActionStored {
		t.Errorf("action=%s want=stored", log.Entries[0].Action)
	}
	if log.Entries[0].Sequence != 0 {
		t.Errorf("sequence=%d want=0", log.Entries[0].Sequence)
	}
}

func TestAppendIncrementsSequence(t *testing.T) {
	log := NewLog("ev", "op", "ingest", time.Now())
	for i := 0; i < 3; i++ {
		if err := log.Append(ActionAccessed, "op", "subpoena-1", time.Now()); err != nil {
			t.Fatalf("append: %v", err)
		}
	}
	if log.Entries[len(log.Entries)-1].Sequence != 3 {
		t.Errorf("last sequence=%d want=3", log.Entries[len(log.Entries)-1].Sequence)
	}
}

func TestIsOnHold(t *testing.T) {
	log := NewLog("ev", "op", "ingest", time.Now())
	if log.IsOnHold() {
		t.Error("expected not on hold initially")
	}
	_ = log.Append(ActionHoldPlaced, "counsel", "lit-2026-001", time.Now())
	if !log.IsOnHold() {
		t.Error("expected on hold after placement")
	}
	_ = log.Append(ActionHoldReleased, "counsel", "lit-2026-001-resolved", time.Now())
	if log.IsOnHold() {
		t.Error("expected not on hold after release")
	}
}

func TestAppendAfterDeletionRejected(t *testing.T) {
	log := NewLog("ev", "op", "ingest", time.Now())
	_ = log.Append(ActionDeleted, "op", "retention-expired", time.Now())
	err := log.Append(ActionAccessed, "op", "should-fail", time.Now())
	if err != ErrAlreadyDeleted {
		t.Errorf("want ErrAlreadyDeleted, got %v", err)
	}
}

func TestVerifyDetectsTampering(t *testing.T) {
	log := NewLog("ev", "op", "ingest", time.Now())
	_ = log.Append(ActionAccessed, "op2", "audit", time.Now())
	_ = log.Append(ActionAccessed, "op3", "audit", time.Now())

	if err := log.Verify(); err != nil {
		t.Fatalf("verify clean log: %v", err)
	}
	// Tamper with an earlier entry.
	log.Entries[1].OperatorID = "ATTACKER"
	if err := log.Verify(); err == nil {
		t.Error("expected verify to fail on tampered log")
	}
}

func TestIsDeletedReflectsTerminalState(t *testing.T) {
	log := NewLog("ev", "op", "ingest", time.Now())
	if log.IsDeleted() {
		t.Error("expected not deleted initially")
	}
	_ = log.Append(ActionDeleted, "op", "expired", time.Now())
	if !log.IsDeleted() {
		t.Error("expected deleted after deletion entry")
	}
}
