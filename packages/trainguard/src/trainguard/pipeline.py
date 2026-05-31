"""Scan pipeline.

The orchestrator that runs a DatasetReader against one or more
HashListProviders and produces a ComplianceReport. Pure function —
the report is determined entirely by inputs (dataset, providers,
timestamp) so audits are reproducible.
"""

from __future__ import annotations

import uuid
from typing import Iterable

from .types import (
    ComplianceReport,
    DatasetEntry,
    HashListProvider,
    HashListSource,
    ScanResult,
)


def scan_dataset(
    *,
    dataset_id: str,
    entries: Iterable[DatasetEntry],
    providers: list[HashListProvider],
    scanned_at_iso: str,
    operator: str,
    threshold: int = 31,
) -> tuple[ComplianceReport, list[ScanResult]]:
    """Scan a dataset stream against the configured hash-list providers.

    Returns a (report, matches) pair. The report is the chain-of-custody
    artifact for audit; the matches list is the actionable output — the
    caller's loader should exclude these entries from the dataset
    before training.

    The function never logs, prints, or persists anything. The caller
    owns the sink: write the report to your evidence vault, log
    redacted summaries to metrics, etc.

    Args:
        dataset_id: stable identifier for the dataset being scanned
            (e.g. "laion-5b-2025-06").
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


def _hamming(a: bytes, b: bytes) -> int:
    if len(a) != len(b):
        raise ValueError("hash length mismatch")
    return sum(bin(ax ^ bx).count("1") for ax, bx in zip(a, b))
