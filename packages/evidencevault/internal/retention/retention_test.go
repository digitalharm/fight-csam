package retention

import (
	"testing"
	"time"
)

func TestUSFederalScheduleHas90DayBase(t *testing.T) {
	if USFederal2258A.BaseDuration != 90*24*time.Hour {
		t.Errorf("base=%v want=90d", USFederal2258A.BaseDuration)
	}
}

func TestExpiresAtUsesBaseWhenNoPreservation(t *testing.T) {
	stored := time.Now()
	s := State{StoredAt: stored, Schedule: USFederal2258A}
	want := stored.Add(USFederal2258A.BaseDuration)
	if !s.ExpiresAt().Equal(want) {
		t.Errorf("expires=%v want=%v", s.ExpiresAt(), want)
	}
}

func TestExpiresAtUsesPreservationWhenLater(t *testing.T) {
	stored := time.Now()
	preservation := stored.Add(120 * 24 * time.Hour)
	s := State{StoredAt: stored, Schedule: USFederal2258A, PreservationEnd: &preservation}
	if !s.ExpiresAt().Equal(preservation) {
		t.Errorf("expires=%v want=%v", s.ExpiresAt(), preservation)
	}
}

func TestExpiredReturnsTrueAfterBase(t *testing.T) {
	stored := time.Now().Add(-100 * 24 * time.Hour)
	s := State{StoredAt: stored, Schedule: USFederal2258A}
	if !s.Expired(time.Now()) {
		t.Error("expected expired after 100d on 90d schedule")
	}
}

func TestLitigationHoldSuspendsExpiry(t *testing.T) {
	stored := time.Now().Add(-1000 * 24 * time.Hour)
	s := State{StoredAt: stored, Schedule: USFederal2258A, OnLitigationHold: true}
	if s.Expired(time.Now()) {
		t.Error("expected not expired under litigation hold")
	}
}

func TestExtendForPreservationWithinMax(t *testing.T) {
	stored := time.Now()
	s := State{StoredAt: stored, Schedule: USFederal2258A}
	until := stored.Add(120 * 24 * time.Hour) // within 180d max
	if err := s.ExtendForPreservation(until); err != nil {
		t.Errorf("extend: %v", err)
	}
	if s.PreservationEnd == nil || !s.PreservationEnd.Equal(until) {
		t.Errorf("preservation end not set: %v", s.PreservationEnd)
	}
}

func TestExtendForPreservationBeyondMaxRejected(t *testing.T) {
	stored := time.Now()
	s := State{StoredAt: stored, Schedule: USFederal2258A}
	until := stored.Add(500 * 24 * time.Hour) // exceeds 180d max
	if err := s.ExtendForPreservation(until); err != ErrPreservationExceedsMax {
		t.Errorf("want ErrPreservationExceedsMax, got %v", err)
	}
}

func TestSchedulesHaveCounselReviewMarker(t *testing.T) {
	// All schedules must declare counsel-review-pending until they're
	// confirmed. Drift on this is the canary for unauthorized changes.
	schedules := []Schedule{USFederal2258A, EuDSA, UKOSA, AustraliaESafety}
	for _, s := range schedules {
		if !contains(s.SourceCitation, "counsel review pending") {
			t.Errorf("%s schedule missing 'counsel review pending' marker", s.Jurisdiction)
		}
	}
}

func contains(haystack, needle string) bool {
	return len(haystack) >= len(needle) && (haystack == needle ||
		len(needle) == 0 ||
		stringContains(haystack, needle))
}

func stringContains(s, sub string) bool {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
