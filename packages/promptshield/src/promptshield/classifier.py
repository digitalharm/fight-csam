"""PromptClassifier: the two-stage cascade entry point."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from .neural import NeuralClassifier
from .rules import (
    conjunction_score,
    match_rules,
    normalize,
)
from .types import ClassificationResult, MatchedSignal, Verdict


@dataclass(frozen=True, slots=True)
class Thresholds:
    """Threshold configuration for verdict routing.

    Score >= block_at => block
    Score >= review_at and < block_at => review
    Score < review_at => allow

    Defaults are conservative-leaning-toward-precision. Tune for your
    deployment's tolerance of false positives vs false negatives.
    """

    block_at: float = 0.75
    review_at: float = 0.5


_DEFAULT_THRESHOLDS = Thresholds()


def _verdict_for_score(score: float, thresholds: Thresholds) -> Verdict:
    if score >= thresholds.block_at:
        return "block"
    if score >= thresholds.review_at:
        return "review"
    return "allow"


class PromptClassifier:
    """Two-stage cascade classifier.

    Stage 1 (always on): deterministic pattern matcher. Sub-millisecond.
    Stage 2 (optional): neural classifier loaded from a Hugging Face
        model artifact. Hundreds of milliseconds; pulls a model on first
        use.

    Cascade rules:
      - Stage 1 short-circuits to block if its score >= block_at
      - Stage 1 short-circuits to allow if its score < review_at AND
        the neural classifier is not configured
      - Otherwise Stage 2 produces the final score (with Stage 1 signals
        merged into the result for transparency)
    """

    def __init__(
        self,
        thresholds: Thresholds = _DEFAULT_THRESHOLDS,
        neural: Optional[NeuralClassifier] = None,
        policy_version: str = "v0.0.0",
    ) -> None:
        self._thresholds = thresholds
        self._neural = neural
        self._policy_version = policy_version

    @classmethod
    def from_default(cls) -> "PromptClassifier":
        """Return a classifier with the bootstrap rules and no neural stage.

        Suitable for testing, CI, and deployments that don't want a model
        dependency. Add `from_huggingface(model_id=...)` once the neural
        loader lands.
        """
        return cls()

    @classmethod
    def from_huggingface(
        cls,
        model_id: str,
        thresholds: Thresholds = _DEFAULT_THRESHOLDS,
    ) -> "PromptClassifier":
        """Return a classifier with the bootstrap rules + a neural stage
        loaded from a Hugging Face Hub model artifact.

        Scaffold stage: the neural loader is a stub until a defensible
        eval set + trained checkpoint exist.
        """
        neural = NeuralClassifier.from_huggingface(model_id)
        return cls(thresholds=thresholds, neural=neural)

    def classify(
        self,
        prompt: str,
        *,
        negative_prompt: Optional[str] = None,
    ) -> ClassificationResult:
        """Classify a single prompt.

        Negative prompt (if provided) is concatenated and considered for
        bypass detection — attackers commonly stuff 'adult', 'mature',
        '18+' into the negative prompt to game the matcher.
        """
        normalized = normalize(prompt)
        if negative_prompt:
            normalized = f"{normalized}\n[neg] {normalize(negative_prompt)}"

        stage1_signals = match_rules(normalized)
        stage1_score = conjunction_score(stage1_signals)

        # Short-circuit: high-confidence positive from Stage 1
        if stage1_score >= self._thresholds.block_at:
            return ClassificationResult(
                verdict="block",
                score=stage1_score,
                source="pattern",
                signals=stage1_signals,
                policy_version=self._policy_version,
            )

        # Short-circuit: confident negative AND no neural stage
        if stage1_score < self._thresholds.review_at and self._neural is None:
            return ClassificationResult(
                verdict="allow",
                score=stage1_score,
                source="pattern",
                signals=stage1_signals,
                policy_version=self._policy_version,
            )

        # If neural is unavailable, the pattern result is final
        if self._neural is None:
            return ClassificationResult(
                verdict=_verdict_for_score(stage1_score, self._thresholds),
                score=stage1_score,
                source="pattern",
                signals=stage1_signals,
                policy_version=self._policy_version,
            )

        # Stage 2: neural classifier
        neural_score, neural_signals = self._neural.classify(normalized)
        ensemble_score = max(stage1_score, neural_score)
        merged_signals: list[MatchedSignal] = [*stage1_signals, *neural_signals]
        return ClassificationResult(
            verdict=_verdict_for_score(ensemble_score, self._thresholds),
            score=ensemble_score,
            source="ensemble",
            signals=merged_signals,
            policy_version=self._policy_version,
        )


def guard(
    prompt: str,
    *,
    negative_prompt: Optional[str] = None,
) -> ClassificationResult:
    """Convenience one-liner using the default classifier.

    For high-throughput deployments, instantiate PromptClassifier once
    and reuse it — `guard` builds a fresh classifier on every call.
    """
    return PromptClassifier.from_default().classify(
        prompt, negative_prompt=negative_prompt
    )
