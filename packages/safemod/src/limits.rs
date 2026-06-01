//! Hard exposure caps and mandatory breaks.
//!
//! A reviewer cannot be over-exposed even if they push themselves or a queue
//! pushes them. This module enforces three limits, all caller-clock driven so
//! the crate stays clock-free and deterministic:
//!
//! 1. **Per-shift item cap** — a maximum number of items revealed per shift.
//! 2. **Continuous-exposure cap** — a maximum span of unbroken exposure, after
//!    which a mandatory break is required before the next reveal.
//! 3. **Mandatory break** — once a break is triggered, reveals are refused until
//!    the break duration has elapsed.
//!
//! It holds only integer counters and timestamps — never an identity.

/// The configurable exposure limits for one shift.
#[derive(Debug, Clone, Copy)]
pub struct ExposureLimits {
    /// Maximum items a reviewer may reveal in one shift.
    pub max_items_per_shift: u32,
    /// Maximum span of continuous exposure (ms) before a break is forced.
    pub max_continuous_ms: u64,
    /// Duration (ms) of the mandatory break once triggered.
    pub break_ms: u64,
}

impl Default for ExposureLimits {
    /// Conservative defaults grounded in moderator-wellbeing practice: 200
    /// items per shift, a 20-minute continuous-exposure ceiling, and a
    /// 10-minute mandatory break.
    fn default() -> Self {
        ExposureLimits {
            max_items_per_shift: 200,
            max_continuous_ms: 20 * 60 * 1_000,
            break_ms: 10 * 60 * 1_000,
        }
    }
}

/// The decision returned by [`ShiftTracker::check`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LimitDecision {
    /// The reviewer may reveal another item now.
    Allowed,
    /// A mandatory break is in effect; reveals resume at `resume_at_ms`.
    BreakRequired {
        /// Caller-clock timestamp (ms) at which reveals may resume.
        resume_at_ms: u64,
    },
    /// The per-shift item cap has been reached; no more reveals this shift.
    ShiftCapReached,
}

/// Tracks one reviewer's exposure across a shift. Counters only — no identity.
#[derive(Debug)]
pub struct ShiftTracker {
    limits: ExposureLimits,
    items_revealed: u32,
    /// When the current continuous-exposure window started (ms), or `None` if
    /// the reviewer is currently at rest.
    exposure_started_ms: Option<u64>,
    /// When the active mandatory break ends (ms), or `None` if not on a break.
    break_until_ms: Option<u64>,
}

impl ShiftTracker {
    /// Start a fresh shift at `now_ms`.
    pub fn new(limits: ExposureLimits, now_ms: u64) -> Self {
        let _ = now_ms; // shift start is implicit; kept for API symmetry
        ShiftTracker {
            limits,
            items_revealed: 0,
            exposure_started_ms: None,
            break_until_ms: None,
        }
    }

    /// Whether the reviewer may reveal another item at `now_ms`, without
    /// mutating state. [`record_exposure`](Self::record_exposure) commits a
    /// reveal once the host actually shows the item.
    pub fn check(&self, now_ms: u64) -> LimitDecision {
        if let Some(until) = self.break_until_ms {
            if now_ms < until {
                return LimitDecision::BreakRequired {
                    resume_at_ms: until,
                };
            }
        }
        if self.items_revealed >= self.limits.max_items_per_shift {
            return LimitDecision::ShiftCapReached;
        }
        if let Some(started) = self.exposure_started_ms {
            if now_ms.saturating_sub(started) >= self.limits.max_continuous_ms {
                return LimitDecision::BreakRequired {
                    resume_at_ms: now_ms.saturating_add(self.limits.break_ms),
                };
            }
        }
        LimitDecision::Allowed
    }

    /// Commit a reveal at `now_ms`: increments the shift count and, if a break
    /// had elapsed, clears it and begins a new continuous-exposure window.
    pub fn record_exposure(&mut self, now_ms: u64) {
        // If a break has elapsed, clear it and reset the exposure window.
        if let Some(until) = self.break_until_ms {
            if now_ms >= until {
                self.break_until_ms = None;
                self.exposure_started_ms = None;
            }
        }
        // If the continuous window was exceeded, this reveal starts a break and
        // a fresh window (defensive — the host should have honored `check`).
        if let Some(started) = self.exposure_started_ms {
            if now_ms.saturating_sub(started) >= self.limits.max_continuous_ms {
                self.break_until_ms = Some(now_ms.saturating_add(self.limits.break_ms));
                self.exposure_started_ms = None;
            }
        }
        if self.exposure_started_ms.is_none() {
            self.exposure_started_ms = Some(now_ms);
        }
        self.items_revealed = self.items_revealed.saturating_add(1);
    }

    /// Record that the reviewer closed/hid the current item at `now_ms`, ending
    /// the continuous-exposure window (a natural micro-rest).
    pub fn record_rest(&mut self, now_ms: u64) {
        let _ = now_ms;
        self.exposure_started_ms = None;
    }

    /// Items revealed so far this shift.
    pub fn items_revealed(&self) -> u32 {
        self.items_revealed
    }

    /// Items remaining before the per-shift cap.
    pub fn items_remaining(&self) -> u32 {
        self.limits
            .max_items_per_shift
            .saturating_sub(self.items_revealed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn lim() -> ExposureLimits {
        ExposureLimits {
            max_items_per_shift: 2,
            max_continuous_ms: 30_000,
            break_ms: 10_000,
        }
    }

    #[test]
    fn allows_until_cap() {
        let mut t = ShiftTracker::new(lim(), 0);
        assert_eq!(t.check(0), LimitDecision::Allowed);
        t.record_exposure(0);
        t.record_rest(1_000);
        assert_eq!(t.check(2_000), LimitDecision::Allowed);
        t.record_exposure(2_000);
        assert_eq!(t.check(3_000), LimitDecision::ShiftCapReached);
        assert_eq!(t.items_remaining(), 0);
    }

    #[test]
    fn continuous_window_triggers_break() {
        let mut t = ShiftTracker::new(lim(), 0);
        t.record_exposure(0);
        // No rest; 30s later the window is exceeded.
        assert_eq!(
            t.check(30_000),
            LimitDecision::BreakRequired {
                resume_at_ms: 40_000
            }
        );
    }

    #[test]
    fn break_clears_after_duration_and_resets_window() {
        let mut t = ShiftTracker::new(
            ExposureLimits {
                max_items_per_shift: 100,
                max_continuous_ms: 30_000,
                break_ms: 10_000,
            },
            0,
        );
        t.record_exposure(0);
        // Exceed continuous window → break required at 40_000.
        match t.check(30_000) {
            LimitDecision::BreakRequired { resume_at_ms } => assert_eq!(resume_at_ms, 40_000),
            other => panic!("expected break, got {other:?}"),
        }
        // During the break, still blocked.
        // (Simulate the host setting the break by committing the over-window reveal.)
        t.record_exposure(30_000);
        assert!(matches!(
            t.check(35_000),
            LimitDecision::BreakRequired { .. }
        ));
        // After the break elapses, allowed again.
        assert_eq!(t.check(45_000), LimitDecision::Allowed);
    }

    #[test]
    fn rest_extends_continuous_budget() {
        let mut t = ShiftTracker::new(
            ExposureLimits {
                max_items_per_shift: 100,
                max_continuous_ms: 30_000,
                break_ms: 10_000,
            },
            0,
        );
        t.record_exposure(0);
        t.record_rest(20_000); // closed the item before the window expired
        t.record_exposure(25_000); // new window starts at 25_000
                                   // 25_000 + 20_000 = 45_000 < 25_000 + 30_000, so still allowed.
        assert_eq!(t.check(45_000), LimitDecision::Allowed);
    }
}
