"""Stage 2: neural classifier loader + honest heuristic baseline.

The trained-model path is intentionally still a stub: shipping a fake
"neural" model would give false confidence, and a real one is gated on a
curated evaluation set (see docs/roadmap.md). What v0.5 adds is
``HeuristicBaseline`` — a transparent, deterministic feature scorer that
implements the exact ``classify(normalized) -> (score, signals)`` protocol
a trained model will, so a real checkpoint is a drop-in replacement later.

The baseline can only ever raise suspicion above the Stage 1 conjunction
score, never lower it, so wiring it in cannot reduce recall.
"""

from __future__ import annotations

import re
from typing import Tuple

from .rules import conjunction_score, match_rules
from .types import MatchedSignal


class NeuralClassifier:
    """Stage 2 classifier protocol.

    Subclass and override `classify` to plug in your own model. The
    default Hugging Face loader is a stub that raises NotImplementedError
    until the official model artifact is published.
    """

    @classmethod
    def from_huggingface(cls, model_id: str) -> "NeuralClassifier":
        """Load a classifier from a Hugging Face model artifact.

        Scaffold stage: returns a stub that raises on classify(). The
        loader will dispatch to ONNX runtime or transformers depending
        on the artifact format.
        """
        return _StubClassifier(model_id)

    def classify(self, normalized_prompt: str) -> Tuple[float, list[MatchedSignal]]:
        """Return (score, signals) for the given normalized prompt.

        Score is a calibrated 0.0–1.0 probability. Signals describe
        what the model latched onto, for transparency. Implementations
        should NEVER include raw prompt content in the signal rule_id —
        category names only.
        """
        raise NotImplementedError("subclass NeuralClassifier and override classify")


class _StubClassifier(NeuralClassifier):
    def __init__(self, model_id: str) -> None:
        self._model_id = model_id

    def classify(self, _normalized_prompt: str) -> Tuple[float, list[MatchedSignal]]:
        raise NotImplementedError(
            f"promptshield: neural classifier for {self._model_id!r} is a "
            f"scaffold stub. A trained model artifact will be published once "
            f"a defensible eval set exists. See "
            f"https://github.com/digitalharm/fight-csam/blob/main/docs/roadmap.md."
        )


class HeuristicBaseline(NeuralClassifier):
    """An honest, transparent Stage 2 baseline — NOT a trained model.

    Scores a small set of obfuscation/evasion features that Stage 1 only
    uses as a tie-breaker, so the ambiguous middle band gets a more
    informed score. Starts from the deterministic Stage 1 conjunction
    score and can only add to it, so it never lowers recall. Use via
    ``PromptClassifier.from_baseline()``; the default classifier stays
    Stage-1-only so there is never a surprise model dependency.
    """

    # Phrasing that, in a generation prompt, signals an attempt to evade
    # moderation. Documented, not learned.
    _OBFUSCATION = re.compile(
        r"(?:\buncensored\b|\bno[ -]?filter\b|\bjailbreak\b|\bbypass\b|"
        r"\bignore (?:the )?(?:rules|policy|guidelines|filter)\b)",
        re.IGNORECASE,
    )

    def classify(self, normalized_prompt: str) -> Tuple[float, list[MatchedSignal]]:
        signals = match_rules(normalized_prompt)
        score = conjunction_score(signals)

        extra: list[MatchedSignal] = []
        if self._OBFUSCATION.search(normalized_prompt):
            extra.append(
                MatchedSignal(
                    kind="conjunction-bypass",
                    weight=0.15,
                    rule_id="neural-obfuscation",
                )
            )
            score = min(1.0, score + 0.15)

        return score, [*signals, *extra]
