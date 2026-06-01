"""Smoke + determinism tests for detectkit_test.

The deterministic still-image fixture generator is now implemented (HashKit
shipped, unblocking this work). These tests verify the public API surface keeps
its documented shape AND that synthesis is reproducible from source — the
property the conformance corpus depends on.
"""

from __future__ import annotations

import pytest


def test_package_imports() -> None:
    import detectkit_test  # noqa: F401


def test_fixtures_module_imports() -> None:
    from detectkit_test import fixtures  # noqa: F401


def test_hashing_module_imports() -> None:
    from detectkit_test import hashing  # noqa: F401


def test_generate_image_is_deterministic() -> None:
    """Same (pattern, seed, size) must yield byte-identical output."""
    from detectkit_test.fixtures import generate_image

    a = generate_image(identifier="smoke", seed=7, pattern="structured-noise", width=32, height=32)
    b = generate_image(identifier="smoke", seed=7, pattern="structured-noise", width=32, height=32)
    assert a.pixels == b.pixels
    assert a.to_pgm_bytes() == b.to_pgm_bytes()
    assert len(a.pixels) == 32 * 32


def test_seed_changes_noise_output() -> None:
    from detectkit_test.fixtures import generate_image

    a = generate_image(identifier="s", seed=1, pattern="structured-noise", width=16, height=16)
    b = generate_image(identifier="s", seed=2, pattern="structured-noise", width=16, height=16)
    assert a.pixels != b.pixels


def test_gradient_is_seed_independent() -> None:
    """Non-noise patterns are pure functions of size, not seed."""
    from detectkit_test.fixtures import generate_image

    a = generate_image(identifier="g", seed=1, pattern="gradient-horizontal", width=16, height=4)
    b = generate_image(identifier="g", seed=999, pattern="gradient-horizontal", width=16, height=4)
    assert a.pixels == b.pixels
    # Horizontal gradient: first column dark, last column bright.
    assert a.pixels[0] == 0
    assert a.pixels[15] == 255


def test_pgm_header_is_well_formed() -> None:
    from detectkit_test.fixtures import generate_image

    img = generate_image(identifier="h", seed=0, pattern="checkerboard", width=8, height=8)
    raw = img.to_pgm_bytes()
    assert raw.startswith(b"P5\n8 8\n255\n")
    assert len(raw) == len(b"P5\n8 8\n255\n") + 64


def test_licensed_patterns_raise_not_implemented() -> None:
    """Patterns needing external licensed assets are honestly unavailable."""
    from detectkit_test.fixtures import generate_image

    with pytest.raises(NotImplementedError):
        generate_image(identifier="x", pattern="lenna-replacement")


def test_invalid_size_rejected() -> None:
    from detectkit_test.fixtures import generate_image

    with pytest.raises(ValueError):
        generate_image(identifier="x", pattern="checkerboard", width=0, height=10)


def test_corpus_regenerates_all_synthesizable_patterns() -> None:
    from detectkit_test.fixtures import generate_corpus

    corpus = list(generate_corpus(width=16, height=16))
    assert len(corpus) == 5  # the five synthesizable patterns
    # Deterministic order + reproducible bytes.
    again = list(generate_corpus(width=16, height=16))
    assert [c.to_pgm_bytes() for c in corpus] == [c.to_pgm_bytes() for c in again]
