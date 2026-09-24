"""csam-shield: one-line CSAM detection middleware.

Python sibling to the TypeScript package at packages/csam-shield/node.
Same MatchResponse model, same detector adapter interface, native
FastAPI / Starlette / Flask middleware.

Status: see https://github.com/digitalharm/fight-csam/blob/main/docs/roadmap.md
Safety: https://github.com/digitalharm/fight-csam/blob/main/docs/safety-policy.md
"""

from __future__ import annotations

__version__ = "0.0.1"

from .detectors import create_pdq_list_detector, hamming_distance
from .shield import Shield, create_shield
from .types import (
    DetectorConfig,
    DetectorKind,
    DetectorResult,
    ImageBytes,
    ImageUrl,
    MatchDecision,
    MatchResponse,
    OnErrorPolicy,
    RetryPolicy,
    Scannable,
    ShieldConfig,
    VideoBytes,
    VideoUrl,
)

__all__ = [
    "DetectorConfig",
    "DetectorKind",
    "DetectorResult",
    "ImageBytes",
    "ImageUrl",
    "MatchDecision",
    "MatchResponse",
    "OnErrorPolicy",
    "RetryPolicy",
    "Scannable",
    "Shield",
    "ShieldConfig",
    "VideoBytes",
    "VideoUrl",
    "create_pdq_list_detector",
    "create_shield",
    "hamming_distance",
]
