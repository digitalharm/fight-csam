//! # hashkit
//!
//! PDQ and TMK+PDQF perceptual hashing primitives, designed to compile to
//! WebAssembly so every language binding produces byte-identical hashes
//! against the NCMEC-cross-checked conformance vector suite.
//!
//! **None of this code ships a CSAM hash list. The library implements the
//! algorithm; the lists live at NCMEC, IWF, and Project Arachnid.**
//!
//! ## Status
//!
//! Planned (Wave 1: Foundation). The public API surface is sketched here as
//! function signatures with `todo!()` bodies; the actual PDQ port from
//! [facebook/ThreatExchange's BSD-3 C++ reference][upstream] is the next
//! material work.
//!
//! [upstream]: https://github.com/facebook/ThreatExchange/tree/main/pdq
//!
//! ## Porting strategy
//!
//! 1. Implement [`pdq::hash_from_luma`] against the C++ reference output,
//!    then verify byte-identical hashes on the conformance corpus.
//! 2. Add WebAssembly bindings under the `wasm` feature.
//! 3. Extend to TMK+PDQF video feature vectors.
//! 4. Cross-check a subset of the corpus against NCMEC reference outputs (the
//!    relationship work, not the code work).
//!
//! ## Threat model
//!
//! The single most serious failure mode is **silent hash drift** — a release
//! that produces a hash one bit off from the reference will cause every
//! downstream matcher to miss real material. The conformance suite at
//! `packages/hashkit/vectors/` is the gating artifact for every release. CI
//! must fail closed on any drift.

#![deny(unsafe_op_in_unsafe_fn)]
#![warn(missing_docs)]
#![warn(rust_2018_idioms)]

/// PDQ perceptual image hashing.
///
/// PDQ produces a 256-bit hash with a quality score (0–100). Two hashes whose
/// Hamming distance is below a threshold (commonly 31 in industry use) are
/// considered matches.
pub mod pdq {
    /// A 256-bit PDQ hash.
    ///
    /// Represented as 32 bytes (4 × `u64` words). Equality and ordering are
    /// byte-wise; matching uses Hamming distance via [`Self::hamming`].
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
    pub struct PdqHash(pub [u8; 32]);

    impl PdqHash {
        /// Hamming distance between two PDQ hashes, in bits (0–256).
        pub fn hamming(&self, other: &PdqHash) -> u32 {
            self.0
                .iter()
                .zip(other.0.iter())
                .map(|(a, b)| (a ^ b).count_ones())
                .sum()
        }

        /// Render as 64 hex characters, lowercase.
        pub fn to_hex(&self) -> String {
            let mut s = String::with_capacity(64);
            for b in &self.0 {
                s.push_str(&format!("{b:02x}"));
            }
            s
        }
    }

    /// PDQ quality score, 0–100. Lower scores indicate the image content was
    /// too flat or low-information for the hash to be reliable.
    #[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
    pub struct PdqQuality(pub u8);

    /// Result of a PDQ hash computation.
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct PdqResult {
        /// The 256-bit hash.
        pub hash: PdqHash,
        /// Quality score.
        pub quality: PdqQuality,
    }

    /// Errors returned by PDQ hashing.
    #[derive(Debug, thiserror::Error)]
    pub enum PdqError {
        /// The input dimensions were invalid for the configured pipeline.
        #[error("invalid input dimensions: width={width}, height={height}")]
        InvalidDimensions {
            /// Image width in pixels.
            width: u32,
            /// Image height in pixels.
            height: u32,
        },
        /// The luma buffer length did not match the declared dimensions.
        #[error("luma buffer length {got} does not match width*height = {expected}")]
        LumaBufferMismatch {
            /// Actual length of the buffer.
            got: usize,
            /// Expected length (width × height).
            expected: usize,
        },
    }

    /// Compute the PDQ hash and quality from a luma (single-channel) buffer.
    ///
    /// The caller is responsible for decoding image data and downsampling to
    /// luma. `hashkit` deliberately does not depend on image codecs — that
    /// keeps the WASM module deterministic across runtimes and small.
    ///
    /// # Arguments
    ///
    /// * `luma` — single-channel pixel data, row-major, 1 byte per pixel
    /// * `width` — image width in pixels
    /// * `height` — image height in pixels
    ///
    /// # Errors
    ///
    /// * [`PdqError::InvalidDimensions`] if `width == 0 || height == 0`
    /// * [`PdqError::LumaBufferMismatch`] if `luma.len() != width * height`
    pub fn hash_from_luma(
        _luma: &[u8],
        _width: u32,
        _height: u32,
    ) -> Result<PdqResult, PdqError> {
        // TODO(hashkit): port from facebook/ThreatExchange/pdq/cpp/.
        //   The reference implementation:
        //   - Downsamples the image to 64×64 via separable box filter
        //   - Applies a 64×64 DCT
        //   - Keeps the 16×16 low-frequency block (excluding DC)
        //   - Median-thresholds to produce the 256-bit hash
        //   - Computes quality from the variance of the kept coefficients
        //
        // Track the port against vectors/ in CI; release is gated by zero drift.
        todo!("PDQ port from facebook/ThreatExchange reference")
    }

    /// Compute the PDQ-Dihedral variant: returns 8 hashes corresponding to
    /// the 8 dihedral group transformations (4 rotations × 2 mirrors).
    /// Used when the matcher needs robustness to rotation and mirroring.
    pub fn hash_dihedral_from_luma(
        _luma: &[u8],
        _width: u32,
        _height: u32,
    ) -> Result<[PdqResult; 8], PdqError> {
        todo!("PDQ-Dihedral port")
    }
}

/// TMK+PDQF perceptual video hashing.
///
/// TMK+PDQF (Temporal Matching Kernel + PDQ Float) produces a feature vector
/// per video that can be matched against a reference set. Used by NCMEC's
/// Video Hash Initiative Project.
pub mod tmk {
    /// A TMK+PDQF feature vector for one video.
    #[derive(Debug, Clone)]
    pub struct TmkFeatures {
        // Layout TBD when the port begins. Reference:
        // https://github.com/facebook/ThreatExchange/tree/main/tmk
    }

    /// Errors returned by TMK feature extraction.
    #[derive(Debug, thiserror::Error)]
    pub enum TmkError {
        /// Placeholder; replace with concrete variants as the port progresses.
        #[error("not yet implemented")]
        NotImplemented,
    }

    /// Extract TMK+PDQF features from a video frame sequence.
    ///
    /// The caller is responsible for decoding the video and supplying per-frame
    /// luma buffers; `hashkit` does not depend on a video codec.
    pub fn features_from_frames(
        _frames: impl Iterator<Item = (Vec<u8>, u32, u32)>,
    ) -> Result<TmkFeatures, TmkError> {
        todo!("TMK+PDQF port from facebook/ThreatExchange/tmk reference")
    }
}

// Note: `thiserror` is referenced by the error types above. It is intentionally
// not yet added to Cargo.toml — the scaffold compiles only the API surface.
// Add `thiserror = "1"` to dependencies when porting begins.

#[cfg(test)]
mod tests {
    use super::pdq::*;

    #[test]
    fn pdq_hash_hex_roundtrip_shape() {
        let h = PdqHash([0u8; 32]);
        let s = h.to_hex();
        assert_eq!(s.len(), 64);
        assert!(s.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn pdq_hamming_distance_basic() {
        let a = PdqHash([0u8; 32]);
        let b = PdqHash([0xFFu8; 32]);
        assert_eq!(a.hamming(&b), 256);
        assert_eq!(a.hamming(&a), 0);
    }
}
