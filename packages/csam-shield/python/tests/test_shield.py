"""Smoke tests for csam-shield Python package."""

from __future__ import annotations

import asyncio
from typing import Any

import pytest

from csam_shield import (
    DetectorConfig,
    ImageBytes,
    Shield,
    ShieldConfig,
    create_shield,
)


def _custom_detector_config(scan_fn: Any, timeout_ms: int = 5000) -> DetectorConfig:
    return DetectorConfig(
        detector="custom",
        config={"scan": scan_fn},
        timeout_ms=timeout_ms,
    )


def test_rejects_empty_detector_list() -> None:
    with pytest.raises(ValueError, match="zero detectors"):
        create_shield(ShieldConfig(detectors=[]))


def test_accepts_custom_detector_and_runs_it() -> None:
    async def scan(_content, _request_id):
        return {"matched": False, "confidence": 0.01}

    shield = create_shield(
        ShieldConfig(detectors=[_custom_detector_config(scan)], strategy="any-match")
    )

    result = asyncio.run(
        shield.scan(ImageBytes(data=b"\xff\xd8\xff", content_type="image/jpeg"))
    )

    assert result.decision == "nomatch"
    assert len(result.results) == 1
    assert result.results[0].matched is False


def test_consensus_strategy_requires_all_matches() -> None:
    async def scan_match(_c, _r):
        return {"matched": True}

    async def scan_clean(_c, _r):
        return {"matched": False}

    shield = create_shield(
        ShieldConfig(
            detectors=[
                _custom_detector_config(scan_match),
                _custom_detector_config(scan_clean),
            ],
            strategy="consensus",
        )
    )

    result = asyncio.run(shield.scan(ImageBytes(data=b"\x00", content_type="image/jpeg")))
    assert result.decision == "nomatch"


def test_any_match_returns_match_on_first_positive() -> None:
    async def scan_clean(_c, _r):
        return {"matched": False}

    async def scan_match(_c, _r):
        return {"matched": True, "confidence": 0.99}

    shield = create_shield(
        ShieldConfig(
            detectors=[
                _custom_detector_config(scan_clean),
                _custom_detector_config(scan_match),
            ],
        )
    )

    result = asyncio.run(shield.scan(ImageBytes(data=b"\x00", content_type="image/jpeg")))
    assert result.decision == "match"


def test_detector_timeout_returns_error_not_raise() -> None:
    async def slow_scan(_c, _r):
        await asyncio.sleep(0.2)
        return {"matched": False}

    shield = create_shield(
        ShieldConfig(detectors=[_custom_detector_config(slow_scan, timeout_ms=50)])
    )

    result = asyncio.run(shield.scan(ImageBytes(data=b"\x00", content_type="image/jpeg")))
    assert result.decision == "error"
    assert "timed out" in (result.results[0].error or "")


def test_on_decision_audit_log_failure_does_not_break_request() -> None:
    async def scan(_c, _r):
        return {"matched": False}

    async def failing_audit(_response):
        raise RuntimeError("audit log unavailable")

    shield = create_shield(
        ShieldConfig(
            detectors=[_custom_detector_config(scan)],
            on_decision=failing_audit,
        )
    )

    result = asyncio.run(shield.scan(ImageBytes(data=b"\x00", content_type="image/jpeg")))
    assert result.decision == "nomatch"


def test_shield_exposes_detectors_for_inspection() -> None:
    async def scan(_c, _r):
        return {"matched": False}

    shield: Shield = create_shield(
        ShieldConfig(detectors=[_custom_detector_config(scan)])
    )
    assert len(shield.detectors) == 1
    assert shield.detectors[0].detector == "custom"
