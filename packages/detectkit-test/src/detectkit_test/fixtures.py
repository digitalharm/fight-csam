"""Synthetic fixture generation.

Every fixture is reproducible from a documented seed and a synthesis function.
No fixture is checked in as opaque binary data — the binary is regenerated
from source on every build, and the safety guard CI rejects any binary image
file committed outside the synthetic-fixture allowlist.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterator, Literal


SyntheticPattern = Literal[
    "gradient-horizontal",
    "gradient-vertical",
    "gradient-radial",
    "checkerboard",
    "structured-noise",
    "lenna-replacement",  # licensed benign reference image
    "kodak-test-set",     # the standard image processing benchmark set
]


@dataclass(frozen=True, slots=True)
class SyntheticImage:
    """A synthetic non-CSAM image with engineered properties.

    Attributes:
        identifier: stable, kebab-case identifier matching the corpus entry.
        seed: deterministic generation seed.
        pattern: which synthesis function produced this image.
        width: width in pixels.
        height: height in pixels.
    """

    identifier: str
    seed: int
    pattern: SyntheticPattern
    width: int
    height: int


@dataclass(frozen=True, slots=True)
class SyntheticVideo:
    """A synthetic non-CSAM video sequence for TMK+PDQF testing."""

    identifier: str
    seed: int
    width: int
    height: int
    frame_count: int
    fps: int


def generate_image(
    identifier: str,
    *,
    seed: int = 0,
    pattern: SyntheticPattern = "structured-noise",
    width: int = 512,
    height: int = 512,
) -> SyntheticImage:
    """Generate a single synthetic image with engineered hash properties.

    The image bytes are not returned by this scaffold; the call writes to a
    deterministic path under `fixtures/<identifier>.png` and returns a handle.

    Args:
        identifier: stable identifier for the fixture (corpus entry name).
        seed: deterministic seed; same seed + same pattern + same size = same bytes.
        pattern: which synthesis function to use.
        width: image width in pixels.
        height: image height in pixels.

    Returns:
        SyntheticImage handle pointing to the generated fixture.

    Raises:
        NotImplementedError: scaffold stage; concrete generation lands once
            hashkit produces verified hashes against the reference.
    """
    # TODO(detectkit-test): implement deterministic image synthesis.
    #   - Use Pillow + a seeded NumPy RNG.
    #   - Write the bytes to packages/detectkit-test/fixtures/img/<identifier>.png.
    #   - Compute the expected PDQ hash via hashkit and record it in the corpus
    #     manifest. The fixture entry is (image, expected hash) — the
    #     deliverable, not the image alone.
    raise NotImplementedError("scaffold stage; awaiting hashkit verified port")


def generate_video(
    identifier: str,
    *,
    seed: int = 0,
    width: int = 320,
    height: int = 240,
    frame_count: int = 60,
    fps: int = 24,
) -> SyntheticVideo:
    """Generate a synthetic video for TMK+PDQF testing.

    Args:
        identifier: stable identifier.
        seed: deterministic seed.
        width: frame width.
        height: frame height.
        frame_count: total frames.
        fps: frames per second.

    Returns:
        SyntheticVideo handle.

    Raises:
        NotImplementedError: scaffold stage.
    """
    raise NotImplementedError("scaffold stage; awaiting hashkit TMK port")


def generate_corpus() -> Iterator[SyntheticImage | SyntheticVideo]:
    """Regenerate the entire fixture corpus.

    Used by CI to verify that the fixture set is reproducible from source.
    Returns an iterator of generated handles in stable order.
    """
    # TODO(detectkit-test): drive generation from a documented corpus manifest
    # at packages/detectkit-test/fixtures/manifest.json (kept under git, the
    # actual binary fixtures regenerated from this manifest on every build).
    raise NotImplementedError("scaffold stage")
