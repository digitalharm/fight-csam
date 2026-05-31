"""Tests for the trainguard pipeline.

Uses synthetic 32-byte hashes that have no relationship to any real
CSAM. The point of the tests is to exercise the matching logic, the
report shape, and the audit-trail discipline.
"""

from __future__ import annotations

import json

import pytest

from trainguard import (
    DatasetEntry,
    HashListFileProvider,
    LaionJsonReader,
    hamming_distance,
    scan_dataset,
    signing_payload,
)
from trainguard.pipeline import HashstreamProvider, InMemoryHashListProvider, _hamming


def _hash_bytes(seed: int) -> bytes:
    return bytes([(seed + i) & 0xFF for i in range(32)])


def _hash_hex(seed: int) -> str:
    return _hash_bytes(seed).hex()


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


# --------------------------------------------------------------------------- #
# v0.5: hex hamming helper, LAION JSON reader, file-backed provider, signing
# --------------------------------------------------------------------------- #


def test_hamming_distance_hex() -> None:
    assert hamming_distance("00", "00") == 0
    assert hamming_distance("00", "ff") == 8
    assert hamming_distance("0f", "00") == 4
    with pytest.raises(ValueError):
        hamming_distance("00", "0000")


def _write_laion_fixture(path, hashes: list[str]) -> None:
    """Write a synthetic LAION-format JSON manifest. SYNTHETIC ONLY.

    No real LAION data is committed: the manifest is built from caller-given
    synthetic hex hashes and written to a tmp_path at test time, so nothing
    lands in the repo. URLs use the reserved .invalid TLD.
    """
    items = [
        {"id": f"img{i}", "url": f"https://example.invalid/{i}.jpg", "hash": h}
        for i, h in enumerate(hashes)
    ]
    path.write_text(json.dumps({"items": items}), encoding="utf-8")


def test_laion_json_reader_yields_entries(tmp_path) -> None:
    manifest = tmp_path / "manifest.json"
    _write_laion_fixture(manifest, [_hash_hex(0), _hash_hex(1), _hash_hex(2)])
    entries = list(LaionJsonReader(str(manifest)))
    assert len(entries) == 3
    assert entries[1].id == "img1"
    assert entries[1].url == "https://example.invalid/1.jpg"
    assert entries[1].pdq_hash == _hash_bytes(1)


def test_laion_json_reader_rejects_bad_shape(tmp_path) -> None:
    bad = tmp_path / "bad.json"
    bad.write_text(json.dumps({"rows": []}), encoding="utf-8")
    with pytest.raises(ValueError, match="items"):
        LaionJsonReader(str(bad))


def test_laion_json_reader_rejects_missing_field(tmp_path) -> None:
    bad = tmp_path / "bad.json"
    bad.write_text(
        json.dumps({"items": [{"id": "x", "url": "https://example.invalid/x"}, {"id": "y"}]}),
        encoding="utf-8",
    )
    reader = LaionJsonReader(str(bad))
    with pytest.raises(ValueError, match="missing required field"):
        list(reader)


def test_hash_list_file_provider_parses(tmp_path) -> None:
    hl = tmp_path / "hashes.txt"
    # Upper-case + comment + blank line; should normalise + skip.
    hl.write_text(
        f"# operator list\n{_hash_hex(0).upper()}\n\n{_hash_hex(1)}\n",
        encoding="utf-8",
    )
    provider = HashListFileProvider(str(hl), source="ncmec", snapshot_id="ncmec-2026-05")
    assert len(provider) == 2
    assert provider.source == "ncmec"
    assert provider.snapshot_id == "ncmec-2026-05"
    # Exact match against a loaded hash (threshold 0).
    assert provider.contains(_hash_bytes(0), threshold=0)
    assert not provider.contains(_hash_bytes(99), threshold=0)


def test_hash_list_file_provider_rejects_wrong_width(tmp_path) -> None:
    hl = tmp_path / "hashes.txt"
    hl.write_text("dead\nbeef\n", encoding="utf-8")  # 2 bytes, not 32
    with pytest.raises(ValueError, match="expected 32"):
        HashListFileProvider(str(hl), snapshot_id="x")


def test_hashstream_provider_is_stub() -> None:
    provider = HashstreamProvider("http://localhost", source="ncmec", snapshot_id="s")
    with pytest.raises(NotImplementedError, match="cross-track"):
        provider.contains(_hash_bytes(0))


def test_unsigned_report_logs_warning(caplog) -> None:
    provider = InMemoryHashListProvider("local", "snap-x", set())
    with caplog.at_level("WARNING"):
        report, _ = scan_dataset(
            dataset_id="d",
            entries=[],
            providers=[provider],
            scanned_at_iso="2026-05-30T00:00:00Z",
            operator="test",
        )
    assert report.signature is None
    assert report.is_signed is False
    assert any("UNSIGNED" in r.message for r in caplog.records)


def test_signed_report_verifies() -> None:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

    private_key = Ed25519PrivateKey.generate()
    signing_key = private_key.private_bytes_raw()

    provider = InMemoryHashListProvider("ncmec", "snap-ncmec-v17", {_hash_bytes(0)})
    report, _ = scan_dataset(
        dataset_id="d",
        entries=[],
        providers=[provider],
        scanned_at_iso="2026-05-30T00:00:00Z",
        operator="test",
        signing_key=signing_key,
    )
    assert report.is_signed
    # Verifies against the corresponding public key.
    private_key.public_key().verify(report.signature, signing_payload(report))


def test_end_to_end_laion_file_to_signed_report(tmp_path) -> None:
    """v0.5 acceptance (miniature): LAION JSON file -> match -> signed report.

    5-item synthetic LAION JSON + a 3-hash operator hash list where exactly
    two entries match. Asserts the match count, that every chain-of-custody
    field is populated, and that the report signature verifies with the
    operator's public key (plus a tamper check).
    """
    from cryptography.exceptions import InvalidSignature
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

    # 5-item manifest: seeds 0..4.
    manifest = tmp_path / "manifest.json"
    _write_laion_fixture(manifest, [_hash_hex(i) for i in range(5)])

    # Operator hash list of 3 entries: two present in the manifest (seeds 1, 3),
    # one absent (seed 99).
    hash_list = tmp_path / "known_bad.txt"
    hash_list.write_text(
        f"{_hash_hex(1)}\n{_hash_hex(3)}\n{_hash_hex(99)}\n",
        encoding="utf-8",
    )

    private_key = Ed25519PrivateKey.generate()
    signing_key = private_key.private_bytes_raw()

    reader = LaionJsonReader(str(manifest))
    provider = HashListFileProvider(
        str(hash_list), source="ncmec", snapshot_id="ncmec-2026-05"
    )
    report, matches = scan_dataset(
        dataset_id=str(manifest),
        entries=reader,
        providers=[provider],
        scanned_at_iso="2026-05-30T12:00:00Z",
        operator="trainguard-ci",
        threshold=0,  # exact match for deterministic synthetic hashes
        signing_key=signing_key,
    )

    # Exactly two matches (seeds 1 and 3).
    assert report.matches_total == 2
    assert {m.entry_id for m in matches} == {"img1", "img3"}
    assert all(m.matched_against == "ncmec" for m in matches)

    # Every chain-of-custody field populated.
    assert report.report_id
    assert report.dataset_id == str(manifest)
    assert report.dataset_size == 5
    assert report.sources_consulted == ["ncmec"]
    assert report.snapshot_ids == {"ncmec": "ncmec-2026-05"}
    assert report.scanned_at_iso == "2026-05-30T12:00:00Z"
    assert report.chain_of_custody == ["trainguard-ci"]

    # Signature present and verifies with the corresponding public key.
    assert report.is_signed
    public_key = private_key.public_key()
    public_key.verify(report.signature, signing_payload(report))

    # Tamper detection: a different key must NOT verify the signature.
    other_pub = Ed25519PrivateKey.generate().public_key()
    with pytest.raises(InvalidSignature):
        other_pub.verify(report.signature, signing_payload(report))


def test_v05_acceptance_100_image_manifest(tmp_path) -> None:
    """v0.5 acceptance at the stated scale: a 100-image LAION-format manifest
    scanned against a hash list, producing a signed report with full custody.
    """
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

    # 100 synthetic images, seeds 0..99.
    manifest = tmp_path / "laion-100.json"
    _write_laion_fixture(manifest, [_hash_hex(i) for i in range(100)])

    # Hash list flags 10 of them (every 10th, seeds 0,10,...,90).
    flagged_seeds = list(range(0, 100, 10))
    hash_list = tmp_path / "known_bad.txt"
    hash_list.write_text(
        "\n".join(_hash_hex(s) for s in flagged_seeds) + "\n",
        encoding="utf-8",
    )

    private_key = Ed25519PrivateKey.generate()
    report, matches = scan_dataset(
        dataset_id="laion-sample-2026-05",
        entries=LaionJsonReader(str(manifest)),
        providers=[
            HashListFileProvider(
                str(hash_list), source="iwf", snapshot_id="iwf-2026-05"
            )
        ],
        scanned_at_iso="2026-05-30T12:00:00Z",
        operator="trainguard-ci",
        threshold=0,
        signing_key=private_key.private_bytes_raw(),
    )

    assert report.dataset_size == 100
    assert report.matches_total == len(flagged_seeds) == 10
    assert {m.entry_id for m in matches} == {f"img{s}" for s in flagged_seeds}
    # Full custody + signed.
    assert report.is_signed
    assert report.snapshot_ids == {"iwf": "iwf-2026-05"}
    private_key.public_key().verify(report.signature, signing_payload(report))
