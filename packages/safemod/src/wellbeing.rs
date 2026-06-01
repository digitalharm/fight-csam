//! Aggregate-only wellbeing signals — the GDPR-safe heart of SafeMod.
//!
//! A naive moderator-wellness tool stores per-person mental-health records,
//! which is GDPR Article 9 special-category data and a serious liability. This
//! module is designed so that **no individual record ever exists**:
//!
//! - Inputs are **anonymous ordinals** ([`WellbeingSignal`]) — a reviewer
//!   optionally self-reports "how are you after this shift?" on a 0–4 scale.
//!   No name, id, or timestamp is attached or accepted.
//! - The monitor keeps **only running sums and a count** — never the individual
//!   values. You cannot reconstruct who reported what because it was never
//!   stored.
//! - A report is emitted **only once a minimum cohort size is reached**
//!   (k-anonymity). Below that threshold the monitor returns
//!   [`WellbeingReport::InsufficientCohort`] so a small team's data can't single
//!   anyone out.
//!
//! The worst-case data-at-rest is therefore a handful of integers — not
//! special-category data under any reading. That is the property that makes
//! SafeMod shippable by a solo maintainer.

/// An anonymous, self-reported wellbeing ordinal collected at end-of-shift.
///
/// Deliberately coarse (5 buckets) and identity-free. The host must collect it
/// voluntarily and anonymously; SafeMod cannot and does not associate it with a
/// reviewer.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WellbeingSignal {
    /// Feeling fine / unaffected.
    Fine,
    /// Mild strain.
    Mild,
    /// Moderate strain.
    Moderate,
    /// High strain.
    High,
    /// Severe strain — wants support.
    Severe,
}

impl WellbeingSignal {
    /// The ordinal weight (0–4) used only for aggregate averaging.
    fn weight(self) -> u32 {
        match self {
            WellbeingSignal::Fine => 0,
            WellbeingSignal::Mild => 1,
            WellbeingSignal::Moderate => 2,
            WellbeingSignal::High => 3,
            WellbeingSignal::Severe => 4,
        }
    }
}

/// Collects anonymous wellbeing signals and emits aggregate reports only.
///
/// Holds only: a count, a running weight-sum, and a count of high-strain
/// reports. No individual signal is retained.
#[derive(Debug)]
pub struct WellbeingMonitor {
    min_cohort: u32,
    count: u32,
    weight_sum: u64,
    elevated_count: u32,
}

impl WellbeingMonitor {
    /// Create a monitor that will only report once `min_cohort` signals have
    /// been pooled. A `min_cohort` below 5 is clamped up to 5 — reporting on
    /// fewer than five people risks de-anonymizing them.
    pub fn new(min_cohort: u32) -> Self {
        WellbeingMonitor {
            min_cohort: min_cohort.max(5),
            count: 0,
            weight_sum: 0,
            elevated_count: 0,
        }
    }

    /// Record one anonymous signal. Stores only aggregate counters.
    pub fn record(&mut self, signal: WellbeingSignal) {
        self.count = self.count.saturating_add(1);
        self.weight_sum = self.weight_sum.saturating_add(u64::from(signal.weight()));
        if matches!(signal, WellbeingSignal::High | WellbeingSignal::Severe) {
            self.elevated_count = self.elevated_count.saturating_add(1);
        }
    }

    /// The minimum cohort size required before a report is emitted.
    pub fn min_cohort(&self) -> u32 {
        self.min_cohort
    }

    /// Produce an aggregate report, or [`WellbeingReport::InsufficientCohort`]
    /// if too few signals have been pooled to be safely anonymous.
    pub fn report(&self) -> WellbeingReport {
        if self.count < self.min_cohort {
            return WellbeingReport::InsufficientCohort {
                have: self.count,
                need: self.min_cohort,
            };
        }
        // Mean strain ×100 as an integer (avoids floats; 0..=400).
        let mean_strain_centi = (self.weight_sum * 100 / u64::from(self.count)) as u32;
        // Share of elevated reports, in basis points (0..=10000).
        let elevated_bps = (u64::from(self.elevated_count) * 10_000 / u64::from(self.count)) as u32;
        WellbeingReport::Aggregate {
            cohort_size: self.count,
            mean_strain_centi,
            elevated_share_bps: elevated_bps,
            support_recommended: elevated_bps >= 2_000 || mean_strain_centi >= 250,
        }
    }
}

/// The outcome of [`WellbeingMonitor::report`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WellbeingReport {
    /// Not enough signals pooled to report without risking de-anonymization.
    InsufficientCohort {
        /// How many signals have been collected.
        have: u32,
        /// How many are needed before a report is emitted.
        need: u32,
    },
    /// An aggregate, non-identifying snapshot of team wellbeing.
    Aggregate {
        /// Number of anonymous signals in this aggregate.
        cohort_size: u32,
        /// Mean strain ordinal ×100 (0 = all fine, 400 = all severe).
        mean_strain_centi: u32,
        /// Share of high/severe reports, in basis points (2000 = 20%).
        elevated_share_bps: u32,
        /// Whether the team should be offered additional support. A
        /// recommendation about a *team*, never a diagnosis of a person.
        support_recommended: bool,
    },
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn withholds_report_below_min_cohort() {
        let mut m = WellbeingMonitor::new(5);
        for _ in 0..4 {
            m.record(WellbeingSignal::Severe);
        }
        assert_eq!(
            m.report(),
            WellbeingReport::InsufficientCohort { have: 4, need: 5 }
        );
    }

    #[test]
    fn min_cohort_is_clamped_up_to_five() {
        let m = WellbeingMonitor::new(1);
        assert_eq!(m.min_cohort(), 5);
    }

    #[test]
    fn aggregates_once_cohort_met() {
        let mut m = WellbeingMonitor::new(5);
        for _ in 0..5 {
            m.record(WellbeingSignal::Fine);
        }
        match m.report() {
            WellbeingReport::Aggregate {
                cohort_size,
                mean_strain_centi,
                elevated_share_bps,
                support_recommended,
            } => {
                assert_eq!(cohort_size, 5);
                assert_eq!(mean_strain_centi, 0);
                assert_eq!(elevated_share_bps, 0);
                assert!(!support_recommended);
            }
            other => panic!("expected aggregate, got {other:?}"),
        }
    }

    #[test]
    fn recommends_support_when_strain_is_high() {
        let mut m = WellbeingMonitor::new(5);
        for _ in 0..5 {
            m.record(WellbeingSignal::Severe); // weight 4 each → mean 400
        }
        match m.report() {
            WellbeingReport::Aggregate {
                mean_strain_centi,
                elevated_share_bps,
                support_recommended,
                ..
            } => {
                assert_eq!(mean_strain_centi, 400);
                assert_eq!(elevated_share_bps, 10_000);
                assert!(support_recommended);
            }
            other => panic!("expected aggregate, got {other:?}"),
        }
    }

    #[test]
    fn elevated_share_threshold_triggers_support() {
        let mut m = WellbeingMonitor::new(5);
        // 5 fine, 2 high → 2/7 ≈ 2857 bps ≥ 2000 → support recommended,
        // even though mean strain is low.
        for _ in 0..5 {
            m.record(WellbeingSignal::Fine);
        }
        m.record(WellbeingSignal::High);
        m.record(WellbeingSignal::High);
        match m.report() {
            WellbeingReport::Aggregate {
                elevated_share_bps,
                support_recommended,
                ..
            } => {
                assert!(elevated_share_bps >= 2_000);
                assert!(support_recommended);
            }
            other => panic!("expected aggregate, got {other:?}"),
        }
    }
}
