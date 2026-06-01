//! Blur-by-default media presentation.
//!
//! Every item a moderator sees starts fully protected — blurred, grayscale, and
//! muted. Revealing is a deliberate, time-boxed act, and the *defaults* are the
//! safe ones. This module owns only the presentation *policy and decision*; the
//! host application applies the resulting [`RevealGrant`] to its actual media
//! element (CSS filter, `<video muted>`, etc.).

/// The kind of media being reviewed. Affects which protections are defaulted on.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MediaKind {
    /// A still image.
    Image,
    /// A video (audio is muted by default in addition to the visual blur).
    Video,
    /// An audio-only clip (the visual blur is moot; muting is the protection).
    Audio,
    /// Text (no blur needed, but reveal is still gated and counted for exposure).
    Text,
}

impl MediaKind {
    /// Whether this kind carries audio that should be muted on reveal by default.
    fn has_audio(self) -> bool {
        matches!(self, MediaKind::Video | MediaKind::Audio)
    }

    /// Whether this kind carries imagery that should be blurred/grayscaled.
    fn has_visual(self) -> bool {
        matches!(self, MediaKind::Image | MediaKind::Video)
    }
}

/// A request to reveal one item.
#[derive(Debug, Clone, Copy)]
pub struct RevealRequest {
    /// The kind of media being revealed.
    pub kind: MediaKind,
}

/// The reveal policy: how revealed media is presented and for how long.
///
/// The [`Default`] is intentionally the most protective configuration that is
/// still usable: grayscale on, audio muted, and a short 5-second reveal window
/// after which the host should re-protect the item unless the reviewer renews.
#[derive(Debug, Clone, Copy)]
pub struct RevealPolicy {
    /// Reveal imagery in grayscale (reduces traumatic impact; AAAI-validated).
    pub grayscale: bool,
    /// Mute audio on reveal.
    pub mute_audio: bool,
    /// How long a single reveal stays un-protected before the host should
    /// re-blur it, in milliseconds. The reviewer can renew, but the *default*
    /// is that exposure auto-ends.
    pub reveal_window_ms: u64,
}

impl Default for RevealPolicy {
    fn default() -> Self {
        RevealPolicy {
            grayscale: true,
            mute_audio: true,
            reveal_window_ms: 5_000,
        }
    }
}

impl RevealPolicy {
    /// A stricter policy: imagery is never revealed in full color and the
    /// reveal window is halved. Useful for the most graphic queues.
    pub fn strict() -> Self {
        RevealPolicy {
            grayscale: true,
            mute_audio: true,
            reveal_window_ms: 2_500,
        }
    }

    /// Compute the presentation grant for a reveal request at `now_ms`.
    pub fn grant(&self, req: RevealRequest, now_ms: u64) -> RevealGrant {
        RevealGrant {
            grayscale: self.grayscale && req.kind.has_visual(),
            muted: self.mute_audio && req.kind.has_audio(),
            expires_at_ms: now_ms.saturating_add(self.reveal_window_ms),
        }
    }
}

/// The presentation constraints the host must apply when showing a revealed item.
///
/// This is what SafeMod *grants*; the host is responsible for honoring it
/// (apply the grayscale filter, mute the element, and re-protect the item at
/// `expires_at_ms`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RevealGrant {
    /// Render imagery in grayscale.
    pub grayscale: bool,
    /// Keep audio muted.
    pub muted: bool,
    /// Caller-clock timestamp (ms) at which the host should re-protect the item.
    pub expires_at_ms: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_is_protective() {
        let p = RevealPolicy::default();
        assert!(p.grayscale && p.mute_audio);
        assert!(p.reveal_window_ms > 0);
    }

    #[test]
    fn image_grant_blurs_but_does_not_mute() {
        let g = RevealPolicy::default().grant(
            RevealRequest {
                kind: MediaKind::Image,
            },
            1_000,
        );
        assert!(g.grayscale);
        assert!(!g.muted, "an image has no audio to mute");
        assert_eq!(g.expires_at_ms, 6_000);
    }

    #[test]
    fn video_grant_blurs_and_mutes() {
        let g = RevealPolicy::default().grant(
            RevealRequest {
                kind: MediaKind::Video,
            },
            0,
        );
        assert!(g.grayscale && g.muted);
    }

    #[test]
    fn audio_grant_mutes_without_grayscale() {
        let g = RevealPolicy::default().grant(
            RevealRequest {
                kind: MediaKind::Audio,
            },
            0,
        );
        assert!(!g.grayscale, "audio has no imagery to grayscale");
        assert!(g.muted);
    }

    #[test]
    fn strict_window_is_shorter() {
        assert!(RevealPolicy::strict().reveal_window_ms < RevealPolicy::default().reveal_window_ms);
    }
}
