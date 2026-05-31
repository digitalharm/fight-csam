//! # hashkit-match
//!
//! In-memory Hamming matcher for PDQ hashes. Given a caller-supplied set of
//! known-bad PDQ hashes and an incoming hash, returns whether the incoming hash
//! matches any reference within a configurable Hamming-distance threshold.
//!
//! **This crate ships no hash lists.** The known-bad set is supplied at
//! runtime by the caller, sourced from credentialed providers like NCMEC, IWF,
//! or Project Arachnid. The crate is a pure data structure.
//!
//! ## Status
//!
//! v0.5 (Wave A: Foundation). Matching is a **naive linear scan** over the
//! stored reference set. This is correct and is the gating baseline for v0.5
//! and v1.0: the acceptance test verifies it matches a hand-written
//! ground-truth scan on 1,000-hash sets across 100 random queries.
//!
//! Multi-index hashing (MIH) — which trades the O(N) scan for
//! O(B × 2^(t/B)) substring-banded lookups — is a v2.0 hardening item, not a
//! correctness requirement. The reference for that algorithm is:
//!
//! > Norouzi, M., Punjani, A., & Fleet, D.J. (2012). "Fast Search in Hamming
//! > Space with Multi-Index Hashing." CVPR 2012.

#![deny(unsafe_op_in_unsafe_fn)]
#![warn(missing_docs)]
#![warn(rust_2018_idioms)]

use hashkit::pdq::PdqHash;

/// The default Hamming-distance threshold used by industry CSAM matchers
/// (PhotoDNA-equivalent). Two PDQ hashes within 31 bits of one another are
/// treated as the same image.
pub const DEFAULT_HAMMING_THRESHOLD: u32 = 31;

/// A Hamming matcher over PDQ hashes.
///
/// Built once from a known-bad set, then queried repeatedly. The current
/// implementation is a naive linear scan — O(N) in the size of the reference
/// set per query. This is the correct v0.5/v1.0 baseline; multi-index hashing
/// (MIH) for sublinear lookup is deferred to v2.0 hardening.
pub struct PdqMatcher {
    threshold: u32,
    /// The reference ("known-bad") hash set, scanned linearly on each query.
    /// Insertion order is preserved and used as the deterministic tie-breaker
    /// when two references sit at the same distance from a query.
    reference: Vec<PdqHash>,
}

/// Errors returned by `hashkit-match`.
#[derive(Debug)]
pub enum MatchError {
    /// The threshold was outside the valid range (0..=256, the bit-width of a
    /// PDQ hash).
    InvalidThreshold(u32),
    /// The known-bad set was empty. A matcher over zero references can never
    /// match anything, which is almost certainly a caller error, so it is
    /// rejected at construction time.
    EmptySet,
}

/// A match result: the matching reference hash and the Hamming distance.
#[derive(Debug, Clone, Copy)]
pub struct MatchResult {
    /// The reference hash that matched.
    pub matched: PdqHash,
    /// Hamming distance between the query and the reference.
    pub distance: u32,
}

impl PdqMatcher {
    /// Build a matcher from a known-bad set with a custom threshold.
    ///
    /// # Errors
    ///
    /// * [`MatchError::InvalidThreshold`] if `threshold > 256` (a PDQ hash is
    ///   256 bits, so no larger distance is meaningful).
    /// * [`MatchError::EmptySet`] if the supplied iterator yields no hashes.
    pub fn new(
        known_bad: impl IntoIterator<Item = PdqHash>,
        threshold: u32,
    ) -> Result<Self, MatchError> {
        if threshold > 256 {
            return Err(MatchError::InvalidThreshold(threshold));
        }
        let reference: Vec<PdqHash> = known_bad.into_iter().collect();
        if reference.is_empty() {
            return Err(MatchError::EmptySet);
        }
        Ok(Self {
            threshold,
            reference,
        })
    }

    /// Build a matcher with the industry-standard threshold of 31.
    ///
    /// # Errors
    ///
    /// Same as [`PdqMatcher::new`]: [`MatchError::EmptySet`] if the supplied
    /// iterator yields no hashes. (The threshold is fixed at
    /// [`DEFAULT_HAMMING_THRESHOLD`], so [`MatchError::InvalidThreshold`]
    /// cannot occur.)
    pub fn with_default_threshold(
        known_bad: impl IntoIterator<Item = PdqHash>,
    ) -> Result<Self, MatchError> {
        Self::new(known_bad, DEFAULT_HAMMING_THRESHOLD)
    }

    /// The configured Hamming-distance threshold.
    pub fn threshold(&self) -> u32 {
        self.threshold
    }

    /// The number of reference hashes in the known-bad set.
    pub fn len(&self) -> usize {
        self.reference.len()
    }

    /// Always `false`: a matcher cannot be constructed over an empty set
    /// (see [`MatchError::EmptySet`]). Provided for API completeness alongside
    /// [`PdqMatcher::len`].
    pub fn is_empty(&self) -> bool {
        self.reference.is_empty()
    }

    /// Query the matcher with an incoming hash. Returns the best (closest)
    /// match within the configured threshold, or `None` if no reference is
    /// close enough.
    ///
    /// Implemented as a naive linear scan. Ties (two references at the same
    /// distance) resolve to the one that appears earliest in the set the
    /// matcher was built from.
    pub fn query(&self, query: &PdqHash) -> Option<MatchResult> {
        let mut best: Option<MatchResult> = None;
        for candidate in &self.reference {
            let distance = query.hamming(candidate);
            if distance > self.threshold {
                continue;
            }
            // Strict `<` keeps the earliest-inserted reference on a tie, which
            // makes results deterministic and matches the ground-truth scan.
            // (Written without `Option::is_none_or` to honour the crate's
            // declared MSRV of 1.75; that helper stabilised in 1.82.)
            let improves = match best {
                None => true,
                Some(b) => distance < b.distance,
            };
            if improves {
                best = Some(MatchResult {
                    matched: *candidate,
                    distance,
                });
            }
        }
        best
    }

    /// Query and return all references within the threshold, sorted ascending
    /// by Hamming distance (for analytical use rather than the standard
    /// match/nomatch path).
    ///
    /// Implemented as a naive linear scan. The sort is stable, so references at
    /// equal distance retain their original insertion order.
    pub fn query_all(&self, query: &PdqHash) -> Vec<MatchResult> {
        let mut matches: Vec<MatchResult> = self
            .reference
            .iter()
            .filter_map(|candidate| {
                let distance = query.hamming(candidate);
                (distance <= self.threshold).then_some(MatchResult {
                    matched: *candidate,
                    distance,
                })
            })
            .collect();
        matches.sort_by_key(|m| m.distance);
        matches
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A small, fast, dependency-free PRNG (SplitMix64). The conformance suite
    /// will eventually pull in `proptest`; for these deterministic baseline
    /// tests a fixed-seed generator keeps the crate dependency-light and the
    /// failures reproducible.
    struct SplitMix64(u64);

    impl SplitMix64 {
        fn new(seed: u64) -> Self {
            Self(seed)
        }

        fn next_u64(&mut self) -> u64 {
            self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
            let mut z = self.0;
            z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
            z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
            z ^ (z >> 31)
        }

        /// A random 32-byte PDQ hash.
        fn next_hash(&mut self) -> PdqHash {
            let mut bytes = [0u8; 32];
            for chunk in bytes.chunks_mut(8) {
                let word = self.next_u64().to_le_bytes();
                chunk.copy_from_slice(&word[..chunk.len()]);
            }
            PdqHash(bytes)
        }

        /// A uniform integer in `0..n` (n > 0). Modulo bias is negligible for
        /// the small `n` used here and irrelevant to correctness.
        fn below(&mut self, n: usize) -> usize {
            (self.next_u64() % n as u64) as usize
        }
    }

    /// Flip exactly `k` distinct bits of `hash`, returning the perturbed hash.
    /// Used to synthesise a query a known Hamming distance from a reference.
    fn flip_bits(hash: &PdqHash, k: usize, rng: &mut SplitMix64) -> PdqHash {
        assert!(k <= 256);
        let mut bytes = hash.0;
        let mut flipped = 0usize;
        let mut seen = [false; 256];
        while flipped < k {
            let bit = rng.below(256);
            if seen[bit] {
                continue;
            }
            seen[bit] = true;
            bytes[bit / 8] ^= 1 << (bit % 8);
            flipped += 1;
        }
        PdqHash(bytes)
    }

    /// Hand-written ground-truth linear scan, intentionally independent of the
    /// production `query` so the two can be cross-checked. Returns the closest
    /// reference within `threshold` (earliest on a tie) or `None`.
    fn ground_truth_query(
        reference: &[PdqHash],
        query: &PdqHash,
        threshold: u32,
    ) -> Option<MatchResult> {
        let mut best: Option<MatchResult> = None;
        for candidate in reference {
            let distance = query.hamming(candidate);
            if distance <= threshold {
                let take = match best {
                    None => true,
                    Some(b) => distance < b.distance,
                };
                if take {
                    best = Some(MatchResult {
                        matched: *candidate,
                        distance,
                    });
                }
            }
        }
        best
    }

    #[test]
    fn matcher_rejects_invalid_threshold() {
        // A non-empty set so the InvalidThreshold check is what fires, not EmptySet.
        let one = [PdqHash([0u8; 32])];
        let r = PdqMatcher::new(one, 257);
        assert!(matches!(r, Err(MatchError::InvalidThreshold(257))));
    }

    #[test]
    fn matcher_accepts_threshold_256() {
        // 256 is the boundary (a PDQ hash is 256 bits) and must be accepted.
        let one = [PdqHash([0u8; 32])];
        assert!(PdqMatcher::new(one, 256).is_ok());
    }

    #[test]
    fn matcher_rejects_empty_set() {
        let r = PdqMatcher::new(std::iter::empty(), DEFAULT_HAMMING_THRESHOLD);
        assert!(matches!(r, Err(MatchError::EmptySet)));
    }

    #[test]
    fn matcher_rejects_empty_set_via_default() {
        let r = PdqMatcher::with_default_threshold(std::iter::empty());
        assert!(matches!(r, Err(MatchError::EmptySet)));
    }

    #[test]
    fn matcher_accepts_default_threshold_on_nonempty_set() {
        let one = [PdqHash([0u8; 32])];
        let m = PdqMatcher::with_default_threshold(one).expect("non-empty set is valid");
        assert_eq!(m.threshold(), DEFAULT_HAMMING_THRESHOLD);
        assert_eq!(m.len(), 1);
        assert!(!m.is_empty());
    }

    #[test]
    fn query_finds_known_near_hash() {
        let mut rng = SplitMix64::new(0xDEAD_BEEF);
        let threshold = DEFAULT_HAMMING_THRESHOLD;

        // 100 random reference hashes.
        let reference: Vec<PdqHash> = (0..100).map(|_| rng.next_hash()).collect();
        let matcher = PdqMatcher::new(reference.clone(), threshold).unwrap();

        // Pick a target from the set and perturb it by <= threshold bits.
        let target_idx = 42;
        let target = reference[target_idx];
        let perturb = (threshold as usize) - 5; // comfortably within threshold
        let query = flip_bits(&target, perturb, &mut rng);

        let result = matcher.query(&query).expect("a near hash must match");
        // The perturbed query is `perturb` bits from its origin; with 100 random
        // 256-bit hashes the origin is overwhelmingly the closest, so we expect
        // it back. Guard the distance too.
        assert_eq!(result.matched, target);
        assert!(result.distance <= threshold);
        assert_eq!(result.distance, perturb as u32);
    }

    #[test]
    fn query_returns_none_when_nothing_close() {
        // All references are the all-zero hash; query the all-ones hash, which is
        // 256 bits away — far outside the default threshold.
        let reference = vec![PdqHash([0u8; 32]); 10];
        let matcher = PdqMatcher::new(reference, DEFAULT_HAMMING_THRESHOLD).unwrap();
        let query = PdqHash([0xFFu8; 32]);
        assert!(matcher.query(&query).is_none());
    }

    #[test]
    fn query_all_returns_all_within_threshold_sorted() {
        let mut rng = SplitMix64::new(0x1234_5678);
        let threshold = DEFAULT_HAMMING_THRESHOLD;

        // Build a base query, then craft 3 references at distinct, known
        // distances within the threshold.
        let query = rng.next_hash();
        let near_a = flip_bits(&query, 5, &mut rng); // distance 5
        let near_b = flip_bits(&query, 12, &mut rng); // distance 12
        let near_c = flip_bits(&query, 20, &mut rng); // distance 20

        // Fill the rest of the 50-element set with hashes far from the query.
        // The all-ones hash is the farthest possible point from most random
        // hashes; flipping the query's complement a little keeps them all well
        // outside the threshold while still being distinct.
        let mut reference: Vec<PdqHash> = Vec::with_capacity(50);
        reference.push(near_c); // insert out of order to exercise the sort
        reference.push(near_a);
        reference.push(near_b);
        let complement = {
            let mut c = query.0;
            for b in c.iter_mut() {
                *b = !*b;
            }
            PdqHash(c)
        };
        while reference.len() < 50 {
            // Perturb the complement slightly; it stays ~256-threshold bits away.
            let far = flip_bits(&complement, rng.below(10), &mut rng);
            // Defensive: ensure it is genuinely outside the threshold.
            if query.hamming(&far) > threshold {
                reference.push(far);
            }
        }
        assert_eq!(reference.len(), 50);

        let matcher = PdqMatcher::new(reference, threshold).unwrap();
        let results = matcher.query_all(&query);

        assert_eq!(results.len(), 3, "exactly the 3 near hashes should match");
        // Sorted ascending by distance.
        assert_eq!(results[0].distance, 5);
        assert_eq!(results[1].distance, 12);
        assert_eq!(results[2].distance, 20);
        assert_eq!(results[0].matched, near_a);
        assert_eq!(results[1].matched, near_b);
        assert_eq!(results[2].matched, near_c);
        // Distances are non-decreasing.
        assert!(results.windows(2).all(|w| w[0].distance <= w[1].distance));
    }

    #[test]
    fn query_matches_ground_truth_linear_scan() {
        // v1.0 acceptance: over a 1,000-hash reference set, query() must agree
        // with an independent linear scan on 100 random queries.
        let mut rng = SplitMix64::new(0xACE1_2025);
        let threshold = DEFAULT_HAMMING_THRESHOLD;

        let reference: Vec<PdqHash> = (0..1_000).map(|_| rng.next_hash()).collect();
        let matcher = PdqMatcher::new(reference.clone(), threshold).unwrap();

        for _ in 0..100 {
            // Mix the query population: ~half are perturbations of a real
            // reference (so they should match), half are fully random (mostly
            // misses). This exercises both the hit and miss paths against the
            // ground truth.
            let query = if rng.next_u64() & 1 == 0 {
                let idx = rng.below(reference.len());
                let bits = rng.below((threshold as usize) + 1); // 0..=threshold
                flip_bits(&reference[idx], bits, &mut rng)
            } else {
                rng.next_hash()
            };

            let got = matcher.query(&query);
            let want = ground_truth_query(&reference, &query, threshold);

            match (got, want) {
                (None, None) => {}
                (Some(g), Some(w)) => {
                    assert_eq!(g.distance, w.distance, "distance disagreement");
                    assert_eq!(g.matched, w.matched, "matched-hash disagreement");
                }
                (g, w) => panic!("query/ground-truth disagree: got {g:?}, want {w:?}"),
            }
        }
    }
}
