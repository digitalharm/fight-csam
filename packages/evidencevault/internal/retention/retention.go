// Package retention encodes jurisdiction-specific retention rules.
//
// Each Schedule names a jurisdiction, defines the base retention
// window, the preservation-request extension behavior, and the
// deletion-trigger conditions. Schedules are intentionally simple
// data — counsel review enumerates the rules; the package mechanically
// applies them.
//
// Scaffold stage. The schedule values below are placeholders pending
// counsel review per packages/evidencevault/docs/counsel-scope-brief.md.
package retention

import (
	"errors"
	"time"
)

// Jurisdiction identifies the applicable legal regime.
type Jurisdiction string

const (
	JurisdictionUSFederal Jurisdiction = "us-federal"
	JurisdictionEU        Jurisdiction = "eu"
	JurisdictionUK        Jurisdiction = "uk"
	JurisdictionAU        Jurisdiction = "au"
)

// Schedule defines how long evidence is retained and how preservation
// requests extend that.
type Schedule struct {
	Jurisdiction      Jurisdiction
	BaseDuration      time.Duration // base retention from initial storage
	PreservationMax   time.Duration // maximum extension on preservation request
	AutoDeleteOnExpiry bool         // delete automatically when timer expires (vs require operator action)
	// SourceCitation is a human-readable pointer to the legal authority.
	// Populated for audit; not for runtime decisions.
	SourceCitation string
}

// Standard schedules. Counsel must confirm these values per
// docs/counsel-scope-brief.md.
var (
	USFederal2258A = Schedule{
		Jurisdiction:      JurisdictionUSFederal,
		BaseDuration:      90 * 24 * time.Hour, // 90 days per 18 U.S.C. § 2258A(h)
		PreservationMax:   180 * 24 * time.Hour, // typical extension on LE request
		AutoDeleteOnExpiry: false,                 // operator action required
		SourceCitation:    "18 U.S.C. § 2258A(h) — retention by reporting providers (counsel review pending)",
	}
	EuDSA = Schedule{
		Jurisdiction:      JurisdictionEU,
		BaseDuration:      6 * 30 * 24 * time.Hour, // ~6 months placeholder
		PreservationMax:   24 * 30 * 24 * time.Hour, // up to 2 years on order
		AutoDeleteOnExpiry: false,
		SourceCitation:    "Digital Services Act Article 24 (counsel review pending)",
	}
	UKOSA = Schedule{
		Jurisdiction:      JurisdictionUK,
		BaseDuration:      6 * 30 * 24 * time.Hour,
		PreservationMax:   12 * 30 * 24 * time.Hour,
		AutoDeleteOnExpiry: false,
		SourceCitation:    "Online Safety Act 2023 preservation duties (counsel review pending)",
	}
	AustraliaESafety = Schedule{
		Jurisdiction:      JurisdictionAU,
		BaseDuration:      6 * 30 * 24 * time.Hour,
		PreservationMax:   24 * 30 * 24 * time.Hour,
		AutoDeleteOnExpiry: false,
		SourceCitation:    "Online Safety Act 2021 (Cth) eSafety preservation (counsel review pending)",
	}
)

// State describes the current retention state of an evidence package.
type State struct {
	StoredAt        time.Time
	Schedule        Schedule
	PreservationEnd *time.Time // non-nil if under preservation extension
	OnLitigationHold bool
}

// ExpiresAt returns the effective expiry time given the schedule and
// any active preservation extension. Returns the zero value if the
// package is on litigation hold (which suspends expiry indefinitely).
func (s State) ExpiresAt() time.Time {
	if s.OnLitigationHold {
		return time.Time{}
	}
	base := s.StoredAt.Add(s.Schedule.BaseDuration)
	if s.PreservationEnd != nil && s.PreservationEnd.After(base) {
		return *s.PreservationEnd
	}
	return base
}

// Expired returns true if the package is past its effective expiry.
// Litigation hold suppresses expiry; returns false unconditionally if
// the hold is active.
func (s State) Expired(now time.Time) bool {
	if s.OnLitigationHold {
		return false
	}
	return now.After(s.ExpiresAt())
}

// ExtendForPreservation extends retention up to the schedule's
// preservation max. Returns ErrPreservationExceedsMax if the requested
// extension exceeds the schedule's ceiling.
var ErrPreservationExceedsMax = errors.New("preservation extension exceeds schedule's maximum")

func (s *State) ExtendForPreservation(until time.Time) error {
	maxAllowed := s.StoredAt.Add(s.Schedule.PreservationMax)
	if until.After(maxAllowed) {
		return ErrPreservationExceedsMax
	}
	s.PreservationEnd = &until
	return nil
}
