"""Synthetic fixture generation.

Every fixture is reproducible from a documented seed and a synthesis function.
No fixture is checked in as opaque binary data — the binary is regenerated
from source on every build, and the safety guard CI rejects any binary image
file committed outside the synthetic-fixture allowlist.

The synthetic patterns are produced with **zero external dependencies**: a
small deterministic PRNG (a 64-bit LCG) plus pure arithmetic generate 8-bit
grayscale pixels, serialized as a binary PGM (`P5`). Same seed + pattern +
size always yields identical bytes, on any platform, which is exactly the
property the conformance corpus needs.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
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

# Patterns this generator can synthesize from pure math (no external assets).
_SYNTHESIZABLE: frozenset[str] = frozenset(
    {
        "gradient-horizontal",
        "gradient-vertical",
        "gradient-radial",
        "checkerboard",
        "structured-noise",
    }
)


@dataclass(frozen=True, slots=True)
class SyntheticImage:
    """A synthetic non-CSAM image with engineered properties.

    Attributes:
        identifier: stable, kebab-case identifier matching the corpus entry.
        seed: deterministic generation seed.
        pattern: which synthesis function produced this image.
        width: width in pixels.
        height: height in pixels.
        pixels: row-major 8-bit grayscale pixel values (len == width*height).
    """

    identifier: str
    seed: int
    pattern: SyntheticPattern
    width: int
    height: int
    pixels: tuple[int, ...]

    def to_pgm_bytes(self) -> bytes:
        """Serialize to a binary PGM (`P5`) — a dependency-free image format.

        The byte stream is fully determined by (pattern, seed, width, height),
        so it is reproducible from source on every build.
        """
        header = f"P5\n{self.width} {self.height}\n255\n".encode("ascii")
        return header + bytes(self.pixels)

    def write_pgm(self, directory: str | Path) -> Path:
        """Write the fixture to `<directory>/<identifier>.pgm` and return the path."""
        out_dir = Path(directory)
        out_dir.mkdir(parents=True, exist_ok=True)
        path = out_dir / f"{self.identifier}.pgm"
        path.write_bytes(self.to_pgm_bytes())
        return path


@dataclass(frozen=True, slots=True)
class SyntheticVideo:
    """A synthetic non-CSAM video sequence for TMK+PDQF testing."""

    identifier: str
    seed: int
    width: int
    height: int
    frame_count: int
    fps: int


def _lcg(seed: int) -> Iterator[int]:
    """A deterministic 64-bit linear congruential generator.

    Constants are the well-known PCG/Knuth MMIX multiplier+increment. Yields a
    fresh 0..255 byte each call. Deterministic across platforms (pure integer
    math, masked to 64 bits) — no dependency on the stdlib `random` module so
    the output can never drift with a Python version change.
    """
    state = (seed ^ 0x9E37_79B9_7F4A_7C15) & 0xFFFF_FFFF_FFFF_FFFF
    while True:
        state = (state * 6364136223846793005 + 1442695040888963407) & 0xFFFF_FFFF_FFFF_FFFF
        # Use the top 8 bits — higher quality than the low bits of an LCG.
        yield (state >> 56) & 0xFF


def _synthesize(pattern: str, seed: int, width: int, height: int) -> tuple[int, ...]:
    """Produce row-major 8-bit grayscale pixels for a synthesizable pattern."""
    px: list[int] = []
    if pattern == "gradient-horizontal":
        denom = max(1, width - 1)
        for _y in range(height):
            for x in range(width):
                px.append((x * 255) // denom)
    elif pattern == "gradient-vertical":
        denom = max(1, height - 1)
        for y in range(height):
            row = (y * 255) // denom
            px.extend([row] * width)
    elif pattern == "gradient-radial":
        cx, cy = (width - 1) / 2.0, (height - 1) / 2.0
        max_d = max(1.0, (cx * cx + cy * cy) ** 0.5)
        for y in range(height):
            for x in range(width):
                d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                px.append(int(255 - (d / max_d) * 255))
    elif pattern == "checkerboard":
        # 8px squares alternating black/white — high-frequency structure.
        for y in range(height):
            for x in range(width):
                px.append(255 if ((x // 8) + (y // 8)) % 2 == 0 else 0)
    elif pattern == "structured-noise":
        gen = _lcg(seed)
        px = [next(gen) for _ in range(width * height)]
    else:  # pragma: no cover - guarded by caller
        raise ValueError(f"not a synthesizable pattern: {pattern}")
    return tuple(px)


def generate_image(
    identifier: str,
    *,
    seed: int = 0,
    pattern: SyntheticPattern = "structured-noise",
    width: int = 512,
    height: int = 512,
) -> SyntheticImage:
    """Generate a single synthetic image with deterministic, reproducible bytes.

    The returned [`SyntheticImage`] carries the pixel data; call
    [`SyntheticImage.to_pgm_bytes`][] or [`SyntheticImage.write_pgm`][] to
    materialize the binary. Same (pattern, seed, width, height) always yields
    identical pixels.

    Args:
        identifier: stable identifier for the fixture (corpus entry name).
        seed: deterministic seed; only affects noise-based patterns.
        pattern: which synthesis function to use.
        width: image width in pixels (must be > 0).
        height: image height in pixels (must be > 0).

    Returns:
        A populated [`SyntheticImage`].

    Raises:
        ValueError: width/height are not positive.
        NotImplementedError: the pattern requires an external licensed asset
            (`lenna-replacement`, `kodak-test-set`) that is not bundled. Use a
            synthesizable pattern, or supply the asset out-of-band.
    """
    if width <= 0 or height <= 0:
        raise ValueError("width and height must be positive")
    if pattern not in _SYNTHESIZABLE:
        raise NotImplementedError(
            f"pattern {pattern!r} needs an external licensed reference image; "
            f"bundled synthesis covers: {sorted(_SYNTHESIZABLE)}"
        )
    pixels = _synthesize(pattern, seed, width, height)
    return SyntheticImage(
        identifier=identifier,
        seed=seed,
        pattern=pattern,
        width=width,
        height=height,
        pixels=pixels,
    )


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

    Raises:
        NotImplementedError: TMK+PDQF fixture synthesis is not yet ported; the
            still-image corpus is the v0 conformance deliverable.
    """
    raise NotImplementedError(
        "video (TMK+PDQF) fixture synthesis is a later milestone; "
        "the v0 conformance corpus is still images via generate_image()"
    )


def generate_corpus(
    *,
    width: int = 64,
    height: int = 64,
) -> Iterator[SyntheticImage]:
    """Regenerate the deterministic still-image corpus.

    Yields one [`SyntheticImage`] per synthesizable pattern, in stable order, so
    CI can verify the fixture set is reproducible from source. Small default
    size keeps regeneration fast.
    """
    for pattern in sorted(_SYNTHESIZABLE):
        yield generate_image(
            identifier=pattern,
            seed=0,
            pattern=pattern,  # type: ignore[arg-type]  # iterating the known-good set
            width=width,
            height=height,
        )
