"""Public type surface for csam-shield. Mirrors packages/csam-shield/node/src/types.ts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Literal, Protocol, Union


MatchDecision = Literal["match", "nomatch", "pending", "error"]

# What to do when a detector ultimately fails (errors or times out, after any
# retries) and the unified decision would otherwise be unresolved:
#   - "allow" -> fail-open: a failed detector is treated as no-match; the
#                request proceeds.
#   - "deny"  -> fail-closed: a failed detector forces a blocking decision
#                (a missed scan is treated as a potential hit).
# When ``ShieldConfig.on_error`` is None, the legacy behavior applies: the
# shield reports "error" and the adapter decides.
OnErrorPolicy = Literal["allow", "deny"]

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


@dataclass(slots=True, frozen=True)
class RetryPolicy:
    """Retry policy for a detector invocation.

    Retries apply to the whole timed call: if a detector raises or times
    out, it is retried up to ``max_retries`` additional times with a fixed
    ``backoff_ms`` delay between attempts. A detector that returns cleanly
    is never retried.
    """

    max_retries: int = 0
    backoff_ms: int = 0


@dataclass(slots=True)
class DetectorConfig:
    detector: DetectorKind
    config: dict[str, Any] = field(default_factory=dict)
    optional: bool = True
    timeout_ms: int = 5000
    # Per-detector retry override. Falls back to ``ShieldConfig.retry_policy``.
    retry_policy: RetryPolicy | None = None


@dataclass(slots=True)
class ShieldConfig:
    detectors: list[DetectorConfig]
    strategy: Literal["any-match", "majority", "consensus"] = "any-match"
    request_id: Callable[[], str] | None = None
    on_decision: Callable[[MatchResponse], Awaitable[None]] | None = None
    # Shield-wide default retry policy applied to each detector. A detector's
    # own ``retry_policy`` takes precedence.
    retry_policy: RetryPolicy | None = None
    # Failure policy applied when forming the unified decision. See
    # ``OnErrorPolicy``. When None, the shield reports "error" for failed
    # scans and leaves the action to the adapter.
    on_error: OnErrorPolicy | None = None


class CustomScanner(Protocol):
    """Protocol for the 'custom' detector scan function."""

    async def __call__(self, content: Scannable, request_id: str) -> dict[str, Any]: ...
