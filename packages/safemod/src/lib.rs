//! # safemod
//!
//! A moderator-wellness layer that wraps any content-review queue. It provides
//! the three protections that published research (Facebook/AAAI) and industry
//! settlements (Meta $52M; ongoing TikTok litigation) have made a de-facto
//! compliance floor — but which today exist only inside the closed internal
//! tools of the largest platforms:
//!
//! 1. **Blur-by-default media** ([`render`]) — every item is presented blurred,
//!    grayscale, and muted by default; the reviewer makes a deliberate choice to
//!    reveal, and revelations are time-boxed.
//! 2. **Hard exposure caps** ([`limits`]) — enforce per-shift item caps,
//!    continuous-exposure caps, and mandatory breaks, so no reviewer can be
//!    over-exposed even if they (or a queue) push too hard.
//! 3. **Aggregate-only wellbeing signals** ([`wellbeing`]) — surface that a
//!    team needs support **without ever recording an individual's
//!    special-category (mental-health) data**.
//!
//! ## Privacy by construction — why this is safe for a solo maintainer
//!
//! SafeMod was previously deferred because a naive moderator-wellness tool
//! handles GDPR Article 9 special-category (mental-health) data, which is a
//! liability mismatch for a small maintainer. **This crate is designed so that
//! liability never arises:**
//!
//! - It is `#![forbid(unsafe_code)]` and has **zero dependencies** — no
//!   database, no network, no filesystem, no clock. It cannot persist or
//!   transmit anything.
//! - It stores **no identifiers**: no reviewer name, ID, IP, or session token
//!   ever enters its types. The host application owns identity; SafeMod owns
//!   only counters and caps.
//! - Wellbeing reporting is **aggregate-only with a minimum cohort size**
//!   ([`wellbeing::WellbeingMonitor`]): a signal is emitted only when enough
//!   reviewers are pooled that no individual is identifiable, and the inputs are
//!   anonymous self-reported ordinals, not records.
//!
//! The result is a tool whose *worst-case data-at-rest is an integer count*,
//! which is not special-category data under any reading. That is what makes it
//! shippable here rather than only inside a health-tech org.
//!
//! ## Status
//!
//! v1.0. The protective state machine is complete and deterministic. Time is
//! injected by the caller (monotonic milliseconds) so the crate stays
//! clock-free and fully testable; wiring SafeMod into a concrete review queue
//! (e.g. Bluesky Ozone) is an integration example, not a library concern.

#![forbid(unsafe_code)]
#![warn(missing_docs)]
#![warn(rust_2018_idioms)]

pub mod limits;
pub mod render;
pub mod wellbeing;

pub use limits::{ExposureLimits, LimitDecision, ShiftTracker};
pub use render::{MediaKind, RevealGrant, RevealPolicy, RevealRequest};
pub use wellbeing::{WellbeingMonitor, WellbeingReport, WellbeingSignal};

/// A reviewer's protected session: the blur/reveal policy plus the per-shift
/// exposure tracker, bound together. One `Session` wraps one reviewer's shift.
///
/// `Session` deliberately holds **no identity** — the host application maps its
/// own reviewer identity to a `Session`; SafeMod never sees who the reviewer is.
#[derive(Debug)]
pub struct Session {
    policy: RevealPolicy,
    shift: ShiftTracker,
}

impl Session {
    /// Start a protected session with the given reveal policy and exposure
    /// limits. `now_ms` is a caller-supplied monotonic timestamp in
    /// milliseconds (SafeMod never reads a clock itself).
    pub fn new(policy: RevealPolicy, limits: ExposureLimits, now_ms: u64) -> Self {
        Session {
            policy,
            shift: ShiftTracker::new(limits, now_ms),
        }
    }

    /// Ask to reveal one media item at `now_ms`.
    ///
    /// This is the single gate a host calls before showing graphic media. It
    /// returns [`ItemDecision::Reveal`] with a time-boxed [`RevealGrant`] only
    /// when BOTH the reveal policy AND the exposure limits allow it; otherwise
    /// it returns [`ItemDecision::Blocked`] with the reason, and the host must
    /// keep the item blurred (or send the reviewer on a break).
    pub fn request_reveal(&mut self, kind: MediaKind, now_ms: u64) -> ItemDecision {
        match self.shift.check(now_ms) {
            LimitDecision::Allowed => {}
            LimitDecision::BreakRequired { resume_at_ms } => {
                return ItemDecision::Blocked(BlockReason::BreakRequired { resume_at_ms });
            }
            LimitDecision::ShiftCapReached => {
                return ItemDecision::Blocked(BlockReason::ShiftCapReached);
            }
        }

        let grant = self.policy.grant(RevealRequest { kind }, now_ms);
        self.shift.record_exposure(now_ms);
        ItemDecision::Reveal(grant)
    }

    /// Record that the reviewer finished (or hid) the current item, ending the
    /// continuous-exposure window. Call this when media is re-blurred.
    pub fn record_item_closed(&mut self, now_ms: u64) {
        self.shift.record_rest(now_ms);
    }

    /// Borrow the shift tracker (for surfacing remaining budget in the host UI).
    pub fn shift(&self) -> &ShiftTracker {
        &self.shift
    }
}

/// The outcome of [`Session::request_reveal`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ItemDecision {
    /// Reveal is permitted; the grant carries the presentation constraints.
    Reveal(RevealGrant),
    /// Reveal is blocked; the item must stay protected.
    Blocked(BlockReason),
}

/// Why a reveal was blocked.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BlockReason {
    /// The reviewer has hit a mandatory break; reveals resume at `resume_at_ms`.
    BreakRequired {
        /// Caller-clock timestamp (ms) at which reveals may resume.
        resume_at_ms: u64,
    },
    /// The reviewer has reached the per-shift item cap; no more reveals today.
    ShiftCapReached,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn policy() -> RevealPolicy {
        RevealPolicy::default()
    }

    fn limits() -> ExposureLimits {
        ExposureLimits {
            max_items_per_shift: 3,
            max_continuous_ms: 60_000,
            break_ms: 10_000,
        }
    }

    #[test]
    fn reveals_until_shift_cap_then_blocks() {
        let mut s = Session::new(policy(), limits(), 0);
        // Three reveals allowed, spaced out so no continuous-exposure break trips.
        for i in 0..3 {
            let t = i * 20_000;
            assert!(
                matches!(
                    s.request_reveal(MediaKind::Image, t),
                    ItemDecision::Reveal(_)
                ),
                "reveal {i} should be allowed"
            );
            s.record_item_closed(t + 1_000);
        }
        // Fourth reveal hits the per-shift cap.
        assert_eq!(
            s.request_reveal(MediaKind::Image, 80_000),
            ItemDecision::Blocked(BlockReason::ShiftCapReached)
        );
    }

    #[test]
    fn continuous_exposure_forces_a_break() {
        let lim = ExposureLimits {
            max_items_per_shift: 100,
            max_continuous_ms: 30_000,
            break_ms: 10_000,
        };
        let mut s = Session::new(policy(), lim, 0);
        // Stay continuously exposed past the 30s window without closing items.
        assert!(matches!(
            s.request_reveal(MediaKind::Image, 0),
            ItemDecision::Reveal(_)
        ));
        assert!(matches!(
            s.request_reveal(MediaKind::Image, 20_000),
            ItemDecision::Reveal(_)
        ));
        // 35s of unbroken exposure → break required.
        match s.request_reveal(MediaKind::Image, 35_000) {
            ItemDecision::Blocked(BlockReason::BreakRequired { resume_at_ms }) => {
                assert_eq!(resume_at_ms, 45_000);
            }
            other => panic!("expected break required, got {other:?}"),
        }
    }

    #[test]
    fn grant_is_time_boxed_and_blurred_by_default() {
        let mut s = Session::new(policy(), limits(), 0);
        match s.request_reveal(MediaKind::Video, 0) {
            ItemDecision::Reveal(g) => {
                assert!(g.grayscale, "default policy reveals in grayscale");
                assert!(g.muted, "default policy reveals muted");
                assert!(g.expires_at_ms > 0, "reveal must be time-boxed");
            }
            other => panic!("expected reveal, got {other:?}"),
        }
    }
}
