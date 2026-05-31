"""Tests for the PDQ-list detector and the retry/timeout/on_error policy."""

from __future__ import annotations

import asyncio

import pytest

from csam_shield import (
    DetectorConfig,
    ImageBytes,
    ImageUrl,
    RetryPolicy,
    ShieldConfig,
    create_pdq_list_detector,
    create_shield,
    hamming_distance,
)
from csam_shield.detectors import _derive_synthetic_hash, run_pdq

HASH_LEN = 32


def make_hash(seed: int) -> bytes:
    return bytes((seed + i * 7) & 0xFF for i in range(HASH_LEN))


def flip_bits(h: bytes, n: int) -> bytes:
    out = bytearray(h)
    for i in range(n):
        byte = i >> 3
        bit = i & 7
        out[byte] ^= 1 << bit
    return bytes(out)


def _img(data: bytes = b"\x00") -> ImageBytes:
    return ImageBytes(data=data, content_type="image/jpeg")


# ---------------- hamming_distance ----------------


def test_hamming_distance_counts_bits_and_guards_length() -> None:
    assert hamming_distance(b"\x00", b"\x00") == 0
    assert hamming_distance(bytes([0b1010]), bytes([0b0101])) == 4
    assert hamming_distance(b"\xff", b"\x00") == 8
    assert hamming_distance(b"\x01\x02", b"\x01") == float("inf")


# ---------------- run_pdq matching ----------------


def test_run_pdq_matches_in_list_exact() -> None:
    known = make_hash(10)
    result = asyncio.run(
        run_pdq(
            {"known_bad": [make_hash(200), known], "threshold": 0, "hash": known},
            _img(),
            "req-1",
        )
    )
    assert result["matched"] is True
    assert result["confidence"] == 1


def test_run_pdq_matches_near_within_threshold() -> None:
    known = make_hash(10)
    near = flip_bits(known, 5)
    result = asyncio.run(
        run_pdq({"known_bad": [known], "threshold": 10, "hash": near}, _img(), "req-2")
    )
    assert result["matched"] is True
    assert "minHamming=5" in result["reasoning"]


def test_run_pdq_no_match_outside_threshold() -> None:
    known = make_hash(10)
    far = flip_bits(known, 40)
    result = asyncio.run(
        run_pdq({"known_bad": [known], "threshold": 10, "hash": far}, _img(), "req-3")
    )
    assert result["matched"] is False
    assert "confidence" not in result


def test_run_pdq_threshold_boundary_inclusive() -> None:
    known = make_hash(10)
    edge = flip_bits(known, 10)
    at = asyncio.run(
        run_pdq({"known_bad": [known], "threshold": 10, "hash": edge}, _img(), "req-4a")
    )
    assert at["matched"] is True
    over = asyncio.run(
        run_pdq({"known_bad": [known], "threshold": 9, "hash": edge}, _img(), "req-4b")
    )
    assert over["matched"] is False


def test_run_pdq_async_list_loader() -> None:
    known = make_hash(42)

    async def loader() -> list[bytes]:
        return [known]

    result = asyncio.run(
        run_pdq({"known_bad": loader, "threshold": 0, "hash": known}, _img(), "req-5")
    )
    assert result["matched"] is True


def test_run_pdq_derives_deterministic_hash_from_bytes() -> None:
    data_a = b"\x05\x06\x07\x08\x09\x0a"
    data_b = b"\x63\x62\x61"

    empty = asyncio.run(run_pdq({"known_bad": [], "threshold": 0}, _img(data_a), "r6a"))
    assert empty["matched"] is False

    same = asyncio.run(
        run_pdq(
            {"known_bad": [_derive_synthetic_hash(data_a)], "threshold": 0},
            _img(data_a),
            "r6b",
        )
    )
    assert same["matched"] is True

    other = asyncio.run(
        run_pdq(
            {"known_bad": [_derive_synthetic_hash(data_b)], "threshold": 0},
            _img(data_a),
            "r6c",
        )
    )
    assert other["matched"] is False


def test_run_pdq_url_only_requests_precomputed_hash() -> None:
    result = asyncio.run(
        run_pdq(
            {"known_bad": [make_hash(1)], "threshold": 31},
            ImageUrl(url="https://example.test/a.jpg"),
            "req-7",
        )
    )
    assert result["matched"] is False
    assert "pre-computed hash" in result["reasoning"]


def test_run_pdq_requires_known_bad() -> None:
    with pytest.raises(ValueError, match="known_bad required"):
        asyncio.run(run_pdq({}, _img(), "req-8"))


# ---------------- end-to-end via shield ----------------


def test_shield_blocks_in_list_and_allows_out_of_list() -> None:
    bad = make_hash(123)
    good = make_hash(7)
    operator_list = [bad, make_hash(250)]

    blocking = create_shield(
        ShieldConfig(
            detectors=[create_pdq_list_detector(operator_list, threshold=10, hash=bad)]
        )
    )
    blocked = asyncio.run(blocking.scan(_img()))
    assert blocked.decision == "match"

    allowing = create_shield(
        ShieldConfig(
            detectors=[create_pdq_list_detector(operator_list, threshold=10, hash=good)]
        )
    )
    allowed = asyncio.run(allowing.scan(_img()))
    assert allowed.decision == "nomatch"


# ---------------- retry / timeout / on_error policy ----------------


def _custom(scan_fn, timeout_ms: int = 5000, retry: RetryPolicy | None = None):
    return DetectorConfig(
        detector="custom",
        config={"scan": scan_fn},
        timeout_ms=timeout_ms,
        retry_policy=retry,
    )


def test_retry_policy_retries_until_success() -> None:
    attempts = {"n": 0}

    async def flaky(_c, _r):
        attempts["n"] += 1
        if attempts["n"] < 3:
            raise RuntimeError("transient")
        return {"matched": False}

    shield = create_shield(
        ShieldConfig(
            detectors=[_custom(flaky, retry=RetryPolicy(max_retries=3, backoff_ms=1))]
        )
    )
    result = asyncio.run(shield.scan(_img()))
    assert attempts["n"] == 3
    assert result.decision == "nomatch"
    assert result.results[0].error is None


def test_retry_policy_gives_up_and_reports_attempts() -> None:
    attempts = {"n": 0}

    async def always_fail(_c, _r):
        attempts["n"] += 1
        raise RuntimeError("always fails")

    shield = create_shield(
        ShieldConfig(
            detectors=[_custom(always_fail)],
            retry_policy=RetryPolicy(max_retries=2, backoff_ms=1),
        )
    )
    result = asyncio.run(shield.scan(_img()))
    assert attempts["n"] == 3
    assert result.decision == "error"
    assert "after 3 attempts" in (result.results[0].error or "")


def test_shield_wide_timeout_applied() -> None:
    async def slow(_c, _r):
        await asyncio.sleep(0.2)
        return {"matched": False}

    shield = create_shield(
        ShieldConfig(detectors=[DetectorConfig(detector="custom", config={"scan": slow}, timeout_ms=30)])
    )
    result = asyncio.run(shield.scan(_img()))
    assert result.decision == "error"
    assert "timed out after 30ms" in (result.results[0].error or "")


def test_on_error_deny_fails_closed() -> None:
    async def boom(_c, _r):
        raise RuntimeError("provider down")

    shield = create_shield(ShieldConfig(detectors=[_custom(boom)], on_error="deny"))
    result = asyncio.run(shield.scan(_img()))
    assert result.decision == "match"


def test_on_error_allow_fails_open() -> None:
    async def boom(_c, _r):
        raise RuntimeError("provider down")

    shield = create_shield(ShieldConfig(detectors=[_custom(boom)], on_error="allow"))
    result = asyncio.run(shield.scan(_img()))
    assert result.decision == "nomatch"


def test_on_error_allow_still_matches_on_clean_match() -> None:
    async def boom(_c, _r):
        raise RuntimeError("provider down")

    async def hit(_c, _r):
        return {"matched": True}

    shield = create_shield(
        ShieldConfig(detectors=[_custom(boom), _custom(hit)], on_error="allow")
    )
    result = asyncio.run(shield.scan(_img()))
    assert result.decision == "match"


def test_default_on_error_preserves_error_reporting() -> None:
    async def boom(_c, _r):
        raise RuntimeError("provider down")

    shield = create_shield(ShieldConfig(detectors=[_custom(boom)]))
    result = asyncio.run(shield.scan(_img()))
    assert result.decision == "error"
