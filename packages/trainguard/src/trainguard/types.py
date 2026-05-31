"""Public types for trainguard."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Literal, Protocol


HashListSource = Literal["ncmec", "iwf", "project-arachnid", "local"]


@dataclass(frozen=True, slots=True)
class DatasetEntry:
    """A single row from a training dataset.

    The image bytes themselves are NOT carried in this struct — only
    the URL or local path, and any precomputed hash. trainguard
    deliberately doesn't pull images itself; the caller (the dataset
    loader) is responsible for fetching, and trainguard either receives
    a precomputed hash or computes one from an already-fetched buffer.
    This keeps trainguard out of the business of touching the imagery.
    """

    id: str
    url: str | None
    local_path: str | None
    # Precomputed PDQ hash (32 bytes). If absent, the caller may pass
    # bytes separately for trainguard to hash via hashkit (when the
    # Python bindings ship).
    pdq_hash: bytes | None = None
    # Additional precomputed hashes the dataset may carry (MD5, SHA-1,
    # PhotoDNA if the loader has the credentials).
    extra_hashes: dict[str, bytes] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class ScanResult:
    """The disposition of a single dataset entry after scanning."""

    entry_id: str
    matched: bool
    matched_against: HashListSource | None = None
    threshold_distance: int | None = None


@dataclass(frozen=True, slots=True)
class ComplianceReport:
    """A signed, chain-of-custody report from a single scan run.

    The report is the deliverable. Operators retain it as evidence
    that the dataset was screened against the named hash lists at the
    named time. The report references the hash-list versions used,
    not the hash lists themselves — auditors verify against the
    versioned snapshots in hashstream.
    """

    report_id: str
    dataset_id: str
    dataset_size: int
    matches_total: int
    sources_consulted: list[str]
    snapshot_ids: dict[str, str]
    """Mapping of source name to the hashstream snapshot ID used."""
    scanned_at_iso: str
    """ISO 8601 timestamp. The caller passes this in; trainguard never
    consults wall-clock time itself, so the report is reproducible from
    inputs."""
    chain_of_custody: list[str]
    """Sequence of operator names / agent IDs that touched the report.
    Latest writer is at the end."""

    @property
    def matched_count(self) -> int:
        return self.matches_total


class HashListProvider(Protocol):
    """Pluggable hash-list source.

    Implementations either:
      - hold an in-memory hash set (for tests and small deployments)
      - delegate to hashstream over HTTP (for production)
      - call NCMEC / IWF / Project Arachnid APIs directly (rare; usually
        hashstream is the indirection layer)
    """

    @property
    def source(self) -> HashListSource:
        ...

    @property
    def snapshot_id(self) -> str:
        """Stable identifier of the snapshot this provider is serving."""
        ...

    def contains(self, pdq_hash: bytes, *, threshold: int = 31) -> bool:
        """Return True if any hash in the provider's set is within
        Hamming distance `threshold` of `pdq_hash`."""
        ...


class DatasetReader(Protocol):
    """A streaming source of DatasetEntry rows."""

    def __iter__(self) -> Iterable[DatasetEntry]:
        ...
