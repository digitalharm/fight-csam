"""detectkit-test: synthetic non-CSAM test fixtures with engineered hash properties.

Verify your CSAM-detection pipeline plumbing in CI without ever touching real
CSAM. Fixtures are reproducible from documented prompts and seeds.

**This package ships no CSAM imagery and no CSAM hashes.** Fixtures are
synthetic patterns (gradients, structured noise, geometric primitives) whose
expected PDQ hashes are computed by hashkit at generation time. The hashes
are real (computed from real algorithms); the imagery is non-harmful.

Status: Planned (Wave 1). The public API surface is sketched below; concrete
implementations follow once `hashkit` produces verified hashes against the
upstream reference.

Safety policy:
    https://github.com/digitalharm/digitalharm-oss/blob/main/docs/safety-policy.md
"""

from __future__ import annotations

__version__ = "0.0.1"

# Public API surface — function signatures only for the scaffold.

from .fixtures import (
    SyntheticImage,
    SyntheticVideo,
    generate_image,
    generate_video,
    generate_corpus,
)
from .hashing import (
    HashKind,
    ExpectedHash,
)

__all__ = [
    "SyntheticImage",
    "SyntheticVideo",
    "generate_image",
    "generate_video",
    "generate_corpus",
    "HashKind",
    "ExpectedHash",
]
