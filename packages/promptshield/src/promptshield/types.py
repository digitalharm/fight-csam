"""Public types for promptshield."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


Verdict = Literal["allow", "block", "review"]
"""Three-tier verdict from the classifier.

- `allow` — no signals or only low-confidence signals; let generation proceed
- `block` — high-confidence positive; refuse to generate
- `review` — borderline; route to human moderation
"""

ClassificationSource = Literal["pattern", "neural", "ensemble"]
"""Which engine produced the classification."""


@dataclass(frozen=True, slots=True)
class MatchedSignal:
    """A single detected signal that contributed to the classification.

    Surfaced for transparency and debugging. The signal type names are
    deliberately abstract — they describe the category of pattern, not
    the literal matched text, so audit logs don't accumulate harmful
    prompt content.
    """

    kind: str
    """Category of the signal (e.g. 'minor-indicator', 'sexual-context',
    'conjunction'). Never the literal matched string."""

    weight: float
    """Contribution to the overall score, 0.0–1.0."""

    rule_id: str
    """Stable identifier of the rule that matched, for debugging."""


@dataclass(frozen=True, slots=True)
class ClassificationResult:
    """The classification of a single prompt."""

    verdict: Verdict
    score: float
    """Calibrated CSAM-intent score, 0.0 (clean) to 1.0 (certain)."""

    source: ClassificationSource
    """Which engine produced this result."""

    signals: list[MatchedSignal] = field(default_factory=list)
    """Signals that contributed to the score. Empty if no signals matched."""

    policy_version: str = "v0.0.0"
    """Lexicon + model version used for this classification."""

    @property
    def blocked(self) -> bool:
        """Convenience accessor for the common case."""
        return self.verdict == "block"
