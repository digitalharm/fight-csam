"""Smoke tests for detectkit_test.

The package is still at scaffold stage (every generator raises
NotImplementedError pending the deterministic fixture work). These tests
catch import-time regressions and verify the API surface keeps its
documented shape so CI fails when a scaffold change accidentally breaks
the public contract.
"""

from __future__ import annotations

import pytest


def test_package_imports() -> None:
    import detectkit_test  # noqa: F401


def test_fixtures_module_imports() -> None:
    from detectkit_test import fixtures  # noqa: F401


def test_hashing_module_imports() -> None:
    from detectkit_test import hashing  # noqa: F401


def test_generate_image_is_not_implemented_at_scaffold_stage() -> None:
    """Scaffold contract: generators raise NotImplementedError until the
    deterministic fixture generator lands. This test will need to be
    rewritten once HashKit produces working PDQ hashes and the
    detectkit-test corpus can be populated for real.
    """
    from detectkit_test.fixtures import generate_image

    with pytest.raises(NotImplementedError):
        generate_image(identifier="smoke", seed=0, pattern="gradient-horizontal")
