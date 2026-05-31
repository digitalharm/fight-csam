"""Stage 2: neural classifier loader.

Scaffold stage. The plan is to ship a ~100M-param distilled DeBERTa
trained on a synthetic adversarial prompt corpus + platform moderation
labels. Real CSAM is never in the training data; the model learns
intent patterns, not depicted content.

Until a defensible eval set exists and a model is trained, this module
is a stub that documents the integration shape. Operators can plug in
their own neural classifier by subclassing NeuralClassifier and
overriding `classify`.
"""

from __future__ import annotations

from typing import Tuple

from .types import MatchedSignal


class NeuralClassifier:
    """Stage 2 classifier protocol.

    Subclass and override `classify` to plug in your own model. The
    default Hugging Face loader is a stub that raises
    NotImplementedError until the official model artifact is published.
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
            f"https://github.com/digitalharm/digitalharm-oss/blob/main/docs/roadmap.md."
        )
