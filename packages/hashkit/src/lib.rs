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
//! v0.5 (Wave 1: Foundation). [`pdq::hash_from_luma`] and
//! [`pdq::hash_dihedral_from_luma`] are implemented by delegating to the
//! maintained [`pdqhash`](https://crates.io/crates/pdqhash) crate (Apache-2.0),
//! itself a port of [facebook/ThreatExchange's BSD-3 C++ reference][upstream].
//! Keeping the algorithm in a shared upstream crate puts hashkit's value where
//! it belongs — the cross-language conformance layer — rather than in a
//! re-port of PDQ that would drift from the reference.
//!
//! [upstream]: https://github.com/facebook/ThreatExchange/tree/main/pdq
//!
//! ## Remaining work toward v1.0
//!
//! 1. Stand up the conformance corpus at `packages/hashkit/vectors/` and gate
//!    CI on zero drift against the C++ reference outputs.
//! 2. Add WebAssembly bindings under the `wasm` feature and prove
//!    native↔WASM byte-identical hashes.
//! 3. Extend to TMK+PDQF video feature vectors (the `tmk` module).
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
        /// The underlying PDQ implementation could not produce a hash (e.g. the
        /// image was too small after the internal downsample). Carries the
        /// dimensions that were attempted.
        #[error("PDQ hash computation failed for {width}x{height} image")]
        HashComputationFailed {
            /// Image width in pixels.
            width: u32,
            /// Image height in pixels.
            height: u32,
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
    pub fn hash_from_luma(luma: &[u8], width: u32, height: u32) -> Result<PdqResult, PdqError> {
        let gray = luma_to_gray(luma, width, height)?;
        pdq_of_gray(&gray, width, height)
    }

    /// Compute the PDQ-Dihedral variant: returns 8 hashes corresponding to
    /// the 8 dihedral group transformations (4 rotations × 2 mirrors).
    /// Used when the matcher needs robustness to rotation and mirroring.
    ///
    /// Results are returned in a stable order:
    /// `[identity, rot90, rot180, rot270, flip, flip+rot90, flip+rot180,
    /// flip+rot270]`.
    pub fn hash_dihedral_from_luma(
        luma: &[u8],
        width: u32,
        height: u32,
    ) -> Result<[PdqResult; 8], PdqError> {
        use pdqhash::image::imageops;

        let base = luma_to_gray(luma, width, height)?;
        let flip = imageops::flip_horizontal(&base);

        // rotate90/270 swap the dimensions; pass each variant's own size so the
        // (unused-on-success) error path still reports accurate dimensions.
        Ok([
            pdq_of_gray(&base, width, height)?,
            pdq_of_gray(&imageops::rotate90(&base), height, width)?,
            pdq_of_gray(&imageops::rotate180(&base), width, height)?,
            pdq_of_gray(&imageops::rotate270(&base), height, width)?,
            pdq_of_gray(&flip, width, height)?,
            pdq_of_gray(&imageops::rotate90(&flip), height, width)?,
            pdq_of_gray(&imageops::rotate180(&flip), width, height)?,
            pdq_of_gray(&imageops::rotate270(&flip), height, width)?,
        ])
    }

    /// Validate dimensions and wrap raw 8-bit luma into a `GrayImage` from
    /// pdqhash's re-exported `image` crate (so the type matches what
    /// `generate_pdq` expects).
    fn luma_to_gray(
        luma: &[u8],
        width: u32,
        height: u32,
    ) -> Result<pdqhash::image::GrayImage, PdqError> {
        if width == 0 || height == 0 {
            return Err(PdqError::InvalidDimensions { width, height });
        }
        let expected = (width as usize)
            .checked_mul(height as usize)
            .ok_or(PdqError::InvalidDimensions { width, height })?;
        if luma.len() != expected {
            return Err(PdqError::LumaBufferMismatch {
                got: luma.len(),
                expected,
            });
        }
        pdqhash::image::GrayImage::from_raw(width, height, luma.to_vec()).ok_or(
            PdqError::LumaBufferMismatch {
                got: luma.len(),
                expected,
            },
        )
    }

    /// Run PDQ over a grayscale image and map the result into [`PdqResult`].
    fn pdq_of_gray(
        gray: &pdqhash::image::GrayImage,
        width: u32,
        height: u32,
    ) -> Result<PdqResult, PdqError> {
        use pdqhash::image::DynamicImage;

        let dynamic = DynamicImage::ImageLuma8(gray.clone());
        let (bytes, quality) = pdqhash::generate_pdq(&dynamic)
            .ok_or(PdqError::HashComputationFailed { width, height })?;

        // pdqhash reports quality on a 0.0–1.0 scale; hashkit's API is 0–100.
        // Guard against either convention so a future crate change can't
        // silently zero the quality field.
        let scaled = if quality <= 1.0 {
            quality * 100.0
        } else {
            quality
        };
        let quality_u8 = scaled.round().clamp(0.0, 100.0) as u8;

        Ok(PdqResult {
            hash: PdqHash(bytes),
            quality: PdqQuality(quality_u8),
        })
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

// `thiserror` powers the typed error variants above.

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

    // Deterministic synthetic luma: a horizontal gradient plus a coarse checker
    // so PDQ has real signal (a flat image yields a degenerate, low-quality
    // hash). Non-symmetric so dihedral orientations differ.
    fn synthetic_luma(width: u32, height: u32) -> Vec<u8> {
        let mut buf = Vec::with_capacity((width * height) as usize);
        for y in 0..height {
            for x in 0..width {
                let g = ((x * 255) / width.max(1)) as u8;
                let checker = if ((x / 16) + (y / 16)) % 2 == 0 {
                    0
                } else {
                    40
                };
                buf.push(g.saturating_add(checker));
            }
        }
        buf
    }

    #[test]
    fn hash_from_luma_produces_256_bit_hash() {
        let luma = synthetic_luma(256, 256);
        let result = hash_from_luma(&luma, 256, 256).expect("hash");
        assert_eq!(result.hash.0.len(), 32);
        assert_eq!(result.hash.to_hex().len(), 64);
        assert!(result.quality.0 <= 100);
    }

    #[test]
    fn hash_from_luma_is_deterministic() {
        let luma = synthetic_luma(128, 128);
        let a = hash_from_luma(&luma, 128, 128).expect("a");
        let b = hash_from_luma(&luma, 128, 128).expect("b");
        assert_eq!(a, b);
    }

    #[test]
    fn hash_from_luma_rejects_zero_dimensions() {
        let err = hash_from_luma(&[], 0, 0).unwrap_err();
        assert!(matches!(err, PdqError::InvalidDimensions { .. }));
    }

    #[test]
    fn hash_from_luma_rejects_buffer_mismatch() {
        let luma = synthetic_luma(64, 64);
        let err = hash_from_luma(&luma, 64, 65).unwrap_err();
        assert!(matches!(err, PdqError::LumaBufferMismatch { .. }));
    }

    #[test]
    fn dihedral_returns_eight_hashes_with_identity_first() {
        let luma = synthetic_luma(128, 128);
        let results = hash_dihedral_from_luma(&luma, 128, 128).expect("dihedral");
        assert_eq!(results.len(), 8);
        let plain = hash_from_luma(&luma, 128, 128).expect("plain");
        assert_eq!(
            results[0], plain,
            "identity orientation must match plain hash"
        );
    }

    #[test]
    fn dihedral_orientations_differ() {
        let luma = synthetic_luma(128, 128);
        let results = hash_dihedral_from_luma(&luma, 128, 128).expect("dihedral");
        assert_ne!(
            results[0], results[2],
            "identity vs rot180 should differ for a non-symmetric image"
        );
    }
}
