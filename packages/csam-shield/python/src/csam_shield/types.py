"""Public type surface for csam-shield. Mirrors packages/csam-shield/node/src/types.ts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Literal, Protocol, Union


MatchDecision = Literal["match", "nomatch", "pending", "error"]

DetectorKind = Literal[
    "photodna",
    "ncmec-hash",
    "iwf-hash",
    "arachnid-hash",
    "pdq",
    "cloudflare-csam-scanning",
    "thorn-safer",
    "hive-ai",
    "custom",
]


@dataclass(frozen=True, slots=True)
class ImageBytes:
    data: bytes
    content_type: str
    kind: Literal["image-bytes"] = "image-bytes"


@dataclass(frozen=True, slots=True)
class ImageUrl:
    url: str
    content_type: str | None = None
    kind: Literal["image-url"] = "image-url"


@dataclass(frozen=True, slots=True)
class VideoBytes:
    data: bytes
    content_type: str
    kind: Literal["video-bytes"] = "video-bytes"


@dataclass(frozen=True, slots=True)
class VideoUrl:
    url: str
    content_type: str | None = None
    kind: Literal["video-url"] = "video-url"


Scannable = Union[ImageBytes, ImageUrl, VideoBytes, VideoUrl]


@dataclass(slots=True)
class DetectorResult:
    detector: DetectorKind
    matched: bool
    duration_ms: int
    confidence: float | None = None
    reasoning: str | None = None
    error: str | None = None


@dataclass(slots=True)
class MatchResponse:
    decision: MatchDecision
    results: list[DetectorResult]
    duration_ms: int
    request_id: str
    log_summary: str


@dataclass(slots=True)
class DetectorConfig:
    detector: DetectorKind
    config: dict[str, Any] = field(default_factory=dict)
    optional: bool = True
    timeout_ms: int = 5000


@dataclass(slots=True)
class ShieldConfig:
    detectors: list[DetectorConfig]
    strategy: Literal["any-match", "majority", "consensus"] = "any-match"
    request_id: Callable[[], str] | None = None
    on_decision: Callable[[MatchResponse], Awaitable[None]] | None = None


class CustomScanner(Protocol):
    """Protocol for the 'custom' detector scan function."""

    async def __call__(self, content: Scannable, request_id: str) -> dict[str, Any]: ...
