"""Tests for the trainguard pipeline.

Uses synthetic 32-byte hashes that have no relationship to any real
CSAM. The point of the tests is to exercise the matching logic, the
report shape, and the audit-trail discipline.
"""

from __future__ import annotations

import pytest

from trainguard import DatasetEntry, scan_dataset
from trainguard.pipeline import InMemoryHashListProvider, _hamming


def _hash_bytes(seed: int) -> bytes:
    return bytes([(seed + i) & 0xFF for i in range(32)])


def test_hamming_basic() -> None:
    assert _hamming(b"\x00" * 32, b"\x00" * 32) == 0
    assert _hamming(b"\x00" * 32, b"\xff" * 32) == 256


def test_scan_empty_dataset_produces_clean_report() -> None:
    provider = InMemoryHashListProvider("local", "snap-x", {_hash_bytes(1)})
    report, matches = scan_dataset(
        dataset_id="empty",
        entries=[],
        providers=[provider],
        scanned_at_iso="2026-05-30T00:00:00Z",
        operator="test",
    )
    assert report.dataset_size == 0
    assert report.matches_total == 0
    assert matches == []
    assert report.sources_consulted == ["local"]


def test_scan_matches_exact_hash() -> None:
    bad_hash = _hash_bytes(42)
    provider = InMemoryHashListProvider("local", "snap-x", {bad_hash})

    entries = [
        DatasetEntry(id="benign-1", url="https://x/1", local_path=None, pdq_hash=_hash_bytes(1)),
        DatasetEntry(id="bad-1", url="https://x/2", local_path=None, pdq_hash=bad_hash),
        DatasetEntry(id="benign-2", url="https://x/3", local_path=None, pdq_hash=_hash_bytes(3)),
    ]
    report, matches = scan_dataset(
        dataset_id="d1",
        entries=entries,
        providers=[provider],
        scanned_at_iso="2026-05-30T00:00:00Z",
        operator="test",
    )

    assert report.dataset_size == 3
    assert report.matches_total == 1
    assert matches[0].entry_id == "bad-1"
    assert matches[0].matched_against == "local"


def test_scan_matches_within_threshold() -> None:
    # Off by 4 bits — within default threshold of 31
    bad_hash = _hash_bytes(0)
    near_hash = bytes([bad_hash[0] ^ 0x0F]) + bad_hash[1:]
    assert _hamming(bad_hash, near_hash) == 4

    provider = InMemoryHashListProvider("local", "snap-x", {bad_hash})
    entries = [DatasetEntry(id="near", url=None, local_path=None, pdq_hash=near_hash)]
    _report, matches = scan_dataset(
        dataset_id="d",
        entries=entries,
        providers=[provider],
        scanned_at_iso="2026-05-30T00:00:00Z",
        operator="test",
    )
    assert len(matches) == 1


def test_scan_does_not_match_beyond_threshold() -> None:
    bad_hash = _hash_bytes(0)
    far_hash = bytes(b ^ 0xFF for b in bad_hash)  # 256 bits different
    provider = InMemoryHashListProvider("local", "snap-x", {bad_hash})
    entries = [DatasetEntry(id="far", url=None, local_path=None, pdq_hash=far_hash)]
    _report, matches = scan_dataset(
        dataset_id="d",
        entries=entries,
        providers=[provider],
        scanned_at_iso="2026-05-30T00:00:00Z",
        operator="test",
    )
    assert matches == []


def test_zero_providers_rejected() -> None:
    with pytest.raises(ValueError, match="zero providers"):
        scan_dataset(
            dataset_id="d",
            entries=[],
            providers=[],
            scanned_at_iso="2026-05-30T00:00:00Z",
            operator="test",
        )


def test_entries_without_hash_are_skipped_not_failed() -> None:
    provider = InMemoryHashListProvider("local", "snap-x", {_hash_bytes(0)})
    entries = [
        DatasetEntry(id="no-hash", url=None, local_path=None, pdq_hash=None),
    ]
    report, matches = scan_dataset(
        dataset_id="d",
        entries=entries,
        providers=[provider],
        scanned_at_iso="2026-05-30T00:00:00Z",
        operator="test",
    )
    # Counted in dataset_size, but not matched (no hash to compare).
    assert report.dataset_size == 1
    assert matches == []


def test_report_records_snapshot_ids_for_audit() -> None:
    p1 = InMemoryHashListProvider("ncmec", "snap-ncmec-v17", {_hash_bytes(0)})
    p2 = InMemoryHashListProvider("iwf", "snap-iwf-v22", {_hash_bytes(1)})
    report, _matches = scan_dataset(
        dataset_id="d",
        entries=[],
        providers=[p1, p2],
        scanned_at_iso="2026-05-30T00:00:00Z",
        operator="test",
    )
    assert report.snapshot_ids == {"ncmec": "snap-ncmec-v17", "iwf": "snap-iwf-v22"}


def test_chain_of_custody_records_operator() -> None:
    provider = InMemoryHashListProvider("local", "snap-x", set())
    report, _matches = scan_dataset(
        dataset_id="d",
        entries=[],
        providers=[provider],
        scanned_at_iso="2026-05-30T00:00:00Z",
        operator="ci-runner-7",
    )
    assert report.chain_of_custody == ["ci-runner-7"]


def test_invalid_hash_length_rejected() -> None:
    provider = InMemoryHashListProvider("local", "snap-x", set())
    with pytest.raises(ValueError, match="32 bytes"):
        provider.contains(b"\x00" * 16)
