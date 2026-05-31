//! # hashkit-match
//!
//! Multi-index Hamming (MIH) matcher for PDQ hashes. Given a caller-supplied
//! set of known-bad PDQ hashes and an incoming hash, returns whether the
//! incoming hash matches any reference within a configurable Hamming-distance
//! threshold.
//!
//! **This crate ships no hash lists.** The known-bad set is supplied at
//! runtime by the caller, sourced from credentialed providers like NCMEC, IWF,
//! or Project Arachnid. The crate is a pure data structure.
//!
//! ## Status
//!
//! Planned (Wave 1: ships alongside `hashkit`). API surface sketched as
//! function signatures with `todo!()` bodies. The MIH implementation is
//! standard but fiddly; the reference for the underlying algorithm is:
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

/// A multi-index Hamming matcher over PDQ hashes.
///
/// Built once from a known-bad set, then queried repeatedly. Matching is
/// O(B × 2^(t/B)) where B is the number of substring bands and t is the
/// threshold; the standard choice for 256-bit PDQ with t=31 uses B=4 or
/// B=8 bands.
pub struct PdqMatcher {
    threshold: u32,
    // Reserved for the MIH internal index. Empty for the scaffold.
    _placeholder: (),
}

/// Errors returned by `hashkit-match`.
#[derive(Debug)]
pub enum MatchError {
    /// The threshold was outside the valid range.
    InvalidThreshold(u32),
    /// The known-bad set was empty when one was expected.
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
    pub fn new(
        _known_bad: impl IntoIterator<Item = PdqHash>,
        threshold: u32,
    ) -> Result<Self, MatchError> {
        if threshold > 256 {
            return Err(MatchError::InvalidThreshold(threshold));
        }
        // TODO(hashkit-match): build the MIH index from the supplied set.
        Ok(Self {
            threshold,
            _placeholder: (),
        })
    }

    /// Build a matcher with the industry-standard threshold of 31.
    pub fn with_default_threshold(
        known_bad: impl IntoIterator<Item = PdqHash>,
    ) -> Result<Self, MatchError> {
        Self::new(known_bad, DEFAULT_HAMMING_THRESHOLD)
    }

    /// Query the matcher with an incoming hash. Returns the best match within
    /// the configured threshold, or `None` if no reference is close enough.
    pub fn query(&self, _query: &PdqHash) -> Option<MatchResult> {
        // TODO(hashkit-match): implement MIH lookup.
        let _ = self.threshold;
        todo!("MIH lookup")
    }

    /// Query and return all references within the threshold (for analytical use
    /// rather than the standard match/nomatch path).
    pub fn query_all(&self, _query: &PdqHash) -> Vec<MatchResult> {
        todo!("MIH all-matches lookup")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matcher_rejects_invalid_threshold() {
        let r = PdqMatcher::new(std::iter::empty(), 257);
        assert!(matches!(r, Err(MatchError::InvalidThreshold(257))));
    }

    #[test]
    fn matcher_accepts_default_threshold() {
        let r = PdqMatcher::with_default_threshold(std::iter::empty());
        assert!(r.is_ok());
    }
}
