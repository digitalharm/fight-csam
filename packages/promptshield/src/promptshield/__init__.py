"""promptshield: CSAM-intent detection at the prompt for AI generators.

Two-tier defense:
  1. Deterministic pattern matcher (Stage 1) — Unicode/leetspeak/homoglyph
     normalization + curated lexicon. Sub-millisecond, CPU-only, transparent.
  2. Fine-tuned neural classifier (Stage 2, optional) — DeBERTa-v3-small or
     a distilled ~100M-param ONNX model. Catches paraphrases and indirect
     references the deterministic layer misses.

The two run in series so the cheap layer can short-circuit before the
expensive layer runs.

Status: see https://github.com/digitalharm/fight-csam/blob/main/docs/roadmap.md
Safety: https://github.com/digitalharm/fight-csam/blob/main/docs/safety-policy.md
"""

from __future__ import annotations

__version__ = "0.0.1"

from .types import (
    ClassificationResult,
    ClassificationSource,
    MatchedSignal,
    Verdict,
)
from .classifier import PromptClassifier, guard

__all__ = [
    "ClassificationResult",
    "ClassificationSource",
    "MatchedSignal",
    "PromptClassifier",
    "Verdict",
    "guard",
]
