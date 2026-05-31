"""Scan pipeline.

The orchestrator that runs a DatasetReader against one or more
HashListProviders and produces a ComplianceReport. Pure function —
the report is determined entirely by inputs (dataset, providers,
timestamp) so audits are reproducible.
"""

from __future__ import annotations

import logging
import uuid
from typing import Iterable, Optional

from .readers import parse_hash_lines
from .types import (
    ComplianceReport,
    DatasetEntry,
    HashListProvider,
    HashListSource,
    ScanResult,
)

logger = logging.getLogger(__name__)


def signing_payload(report: ComplianceReport) -> bytes:
    """Canonical byte payload signed for a report's chain of custody.

    Binds the report identity, the dataset screened, the hash-list versions
    consulted, the match count, and the scan timestamp:

        report_id || dataset_id || hash_list_versions || matches_total || scanned_at

    where ``hash_list_versions`` is each consulted source paired with the
    snapshot id used (``source@snapshot``), sorted for determinism so the
    payload does not depend on provider ordering. Fields are NUL-separated so
    no field boundary is ambiguous. This is the chain-of-custody assertion an
    auditor verifies: *these* lists, at *this* snapshot, screened *this*
    dataset at *this* time with *this* outcome.
    """
    versions = sorted(
        f"{src}@{report.snapshot_ids.get(src, '')}" for src in report.sources_consulted
    )
    parts = [
        report.report_id,
        report.dataset_id,
        ",".join(versions),
        str(report.matches_total),
        report.scanned_at_iso,
    ]
    return "\x00".join(parts).encode("utf-8")


def _sign(payload: bytes, signing_key: Optional[bytes]) -> Optional[bytes]:
    """Return an Ed25519 signature over ``payload``, or ``None`` if unsigned.

    ``signing_key`` is 32 raw Ed25519 private-key bytes (operator-supplied).
    When ``None``, no signature is produced and a warning is logged: an
    unsigned compliance report is not tamper-evident and should not be relied
    on as evidence.
    """
    if signing_key is None:
        logger.warning(
            "trainguard: no signing_key supplied; ComplianceReport will be "
            "UNSIGNED and is not tamper-evident."
        )
        return None
    # Imported lazily so the unsigned path (and `import trainguard`) does not
    # hard-require the cryptography wheel at module-import time.
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

    key = Ed25519PrivateKey.from_private_bytes(signing_key)
    return key.sign(payload)


def scan_dataset(
    *,
    dataset_id: str,
    entries: Iterable[DatasetEntry],
    providers: list[HashListProvider],
    scanned_at_iso: str,
    operator: str,
    threshold: int = 31,
    signing_key: Optional[bytes] = None,
) -> tuple[ComplianceReport, list[ScanResult]]:
    """Scan a dataset stream against the configured hash-list providers.

    Returns a (report, matches) pair. The report is the chain-of-custody
    artifact for audit; the matches list is the actionable output — the
    caller's loader should exclude these entries from the dataset
    before training.

    The function never logs match content, prints, or persists media. The
    caller owns the sink: write the report to your evidence vault, log
    redacted summaries to metrics, etc. (The only log line it may emit is a
    warning when asked to produce an unsigned report.)

    Args:
        dataset_id: stable identifier for the dataset being scanned
            (e.g. "laion-5b-2025-06"). Also bound into the report signature.
        entries: iterable of DatasetEntry rows. Streaming-safe; the
            pipeline does not materialize the whole dataset in memory.
        providers: hash-list providers to check against. Order matters
            only for audit-log ordering; matches against any provider
            mark the entry as a match.
        scanned_at_iso: ISO 8601 timestamp the caller supplies. Pass
            this from your runtime, not from the trainguard library,
            so the report stays reproducible.
        operator: name or agent ID of the entity running this scan.
            Appended to the chain-of-custody.
        threshold: Hamming-distance threshold for PDQ matches. Defaults
            to 31 (PhotoDNA-equivalent).
        signing_key: optional 32-byte raw Ed25519 private key. When given,
            the report is signed over :func:`signing_payload`; when ``None``,
            the report is left unsigned and a warning is logged.
    """
    if not providers:
        raise ValueError(
            "trainguard: scan_dataset requires at least one HashListProvider. "
            "Running with zero providers silently approves the entire dataset."
        )

    matches: list[ScanResult] = []
    total = 0

    for entry in entries:
        total += 1
        if entry.pdq_hash is None:
            # Without a hash we cannot match. The caller's loader is
            # responsible for either precomputing or skipping these
            # entries; trainguard does not fetch images itself.
            continue
        for provider in providers:
            if provider.contains(entry.pdq_hash, threshold=threshold):
                matches.append(
                    ScanResult(
                        entry_id=entry.id,
                        matched=True,
                        matched_against=provider.source,
                        threshold_distance=threshold,
                    )
                )
                break  # first match wins; no need to check other providers

    report = ComplianceReport(
        report_id=str(uuid.uuid4()),
        dataset_id=dataset_id,
        dataset_size=total,
        matches_total=len(matches),
        sources_consulted=[p.source for p in providers],
        snapshot_ids={p.source: p.snapshot_id for p in providers},
        scanned_at_iso=scanned_at_iso,
        chain_of_custody=[operator],
    )
    # Sign over the assembled report so the signature covers the final
    # chain-of-custody payload (report_id, counts, timestamp, list versions).
    signature = _sign(signing_payload(report), signing_key)
    if signature is not None:
        # ComplianceReport is frozen; rebuild with the signature attached.
        report = ComplianceReport(
            report_id=report.report_id,
            dataset_id=report.dataset_id,
            dataset_size=report.dataset_size,
            matches_total=report.matches_total,
            sources_consulted=report.sources_consulted,
            snapshot_ids=report.snapshot_ids,
            scanned_at_iso=report.scanned_at_iso,
            chain_of_custody=report.chain_of_custody,
            signature=signature,
        )
    return report, matches


class InMemoryHashListProvider:
    """Reference HashListProvider for tests and small deployments.

    Production deployments use the hashstream-backed provider, which
    fetches from the HashStream service and never holds the entire
    hash list in process memory.
    """

    def __init__(
        self,
        source: HashListSource,
        snapshot_id: str,
        hashes: set[bytes],
    ) -> None:
        self._source = source
        self._snapshot_id = snapshot_id
        self._hashes = hashes

    @property
    def source(self) -> HashListSource:
        return self._source

    @property
    def snapshot_id(self) -> str:
        return self._snapshot_id

    def contains(self, pdq_hash: bytes, *, threshold: int = 31) -> bool:
        # Naive: O(N) Hamming over the set. Production uses hashkit-match
        # with MIH for sublinear lookups.
        if not isinstance(pdq_hash, (bytes, bytearray)) or len(pdq_hash) != 32:
            raise ValueError("pdq_hash must be 32 bytes")
        for ref in self._hashes:
            if _hamming(ref, pdq_hash) <= threshold:
                return True
        return False


class HashListFileProvider:
    """HashListProvider backed by a newline-delimited hex hash file.

    Loads the same on-disk format hashstream's ingestion accepts: one hex
    hash per line, blank lines and ``#`` comments ignored, each hash decoded
    to its raw bytes. The PDQ hashes screened here are 32 bytes (64 hex
    chars); a line of any other length is rejected at load time so a
    malformed list fails loudly rather than silently screening nothing.

    ``source`` and ``snapshot_id`` are operator-supplied provenance that flow
    verbatim into the ComplianceReport (``sources_consulted`` /
    ``snapshot_ids``) and into each match's ``matched_against``, so the report
    records exactly which list version screened the dataset.
    """

    #: PDQ hashes are 256-bit (32 bytes). The file format is hex, so each
    #: valid line is exactly 64 hex characters.
    _EXPECTED_LEN = 32

    def __init__(
        self,
        path: str,
        *,
        source: HashListSource = "local",
        snapshot_id: str,
    ) -> None:
        self._source = source
        self._snapshot_id = snapshot_id
        self._hashes: set[bytes] = set()
        with open(path, "r", encoding="utf-8") as fh:
            for hex_hash in parse_hash_lines(fh):
                raw = bytes.fromhex(hex_hash)
                if len(raw) != self._EXPECTED_LEN:
                    raise ValueError(
                        f"{path}: hash {hex_hash!r} is {len(raw)} bytes, "
                        f"expected {self._EXPECTED_LEN} (PDQ is 32 bytes)"
                    )
                self._hashes.add(raw)

    @property
    def source(self) -> HashListSource:
        return self._source

    @property
    def snapshot_id(self) -> str:
        return self._snapshot_id

    def __len__(self) -> int:
        return len(self._hashes)

    def contains(self, pdq_hash: bytes, *, threshold: int = 31) -> bool:
        if not isinstance(pdq_hash, (bytes, bytearray)) or len(pdq_hash) != self._EXPECTED_LEN:
            raise ValueError("pdq_hash must be 32 bytes")
        for ref in self._hashes:
            if _hamming(ref, pdq_hash) <= threshold:
                return True
        return False


class HashstreamProvider:
    """HashListProvider backed by a live hashstream service (STUB).

    Cross-track dependency: hashstream's snapshot-serving HTTP API lands in a
    sibling Wave C track. This provider is intentionally a stub so the wiring
    and interface exist now; for end-to-end file-backed screening today use
    :class:`HashListFileProvider`. See the trainguard handoff for the
    cross-track dependency note.
    """

    def __init__(
        self,
        base_url: str,
        *,
        source: HashListSource,
        snapshot_id: str,
    ) -> None:
        self._base_url = base_url
        self._source = source
        self._snapshot_id = snapshot_id

    @property
    def source(self) -> HashListSource:
        return self._source

    @property
    def snapshot_id(self) -> str:
        return self._snapshot_id

    def contains(self, pdq_hash: bytes, *, threshold: int = 31) -> bool:
        raise NotImplementedError(
            "trainguard: HashstreamProvider is a stub pending hashstream's "
            "snapshot-serving API (cross-track dependency). Use "
            "HashListFileProvider for file-backed screening."
        )


def _hamming(a: bytes, b: bytes) -> int:
    if len(a) != len(b):
        raise ValueError("hash length mismatch")
    return sum(bin(ax ^ bx).count("1") for ax, bx in zip(a, b))
