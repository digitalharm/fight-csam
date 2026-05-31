"""Diffusers adapter — Stable Diffusion / FLUX / SDXL / etc.

Wraps a DiffusionPipeline so the gate runs on the prompt before
sampling starts. On a block verdict, raises PromptBlockedError so the
calling code never receives image bytes.
"""

from __future__ import annotations

from typing import Any, Optional

from ..classifier import PromptClassifier
from ..types import ClassificationResult


class PromptBlockedError(RuntimeError):
    """Raised when the classifier blocks generation."""

    def __init__(self, result: ClassificationResult) -> None:
        self.result = result
        super().__init__(
            f"promptshield: prompt blocked (verdict={result.verdict}, "
            f"score={result.score:.2f}, source={result.source})"
        )


def shielded_pipeline(
    pipeline: Any,
    classifier: Optional[PromptClassifier] = None,
) -> Any:
    """Wrap a diffusers DiffusionPipeline so prompts are gated.

    Returns a new object that proxies to the wrapped pipeline but runs
    the classifier on each generation call. On block, raises
    PromptBlockedError; on review, the caller's `on_review` hook (if
    set) decides whether to proceed.

    Scaffold stage: returns a thin shim that runs the classifier and
    raises on block. The full pipeline-callback integration lands
    once diffusers is in dev deps.
    """
    cls = classifier or PromptClassifier.from_default()

    class _Shielded:
        def __init__(self, inner: Any) -> None:
            self._inner = inner

        def __call__(self, prompt: str, **kwargs: Any) -> Any:
            negative = kwargs.get("negative_prompt")
            result = cls.classify(prompt, negative_prompt=negative)
            if result.verdict == "block":
                raise PromptBlockedError(result)
            return self._inner(prompt, **kwargs)

        def __getattr__(self, name: str) -> Any:
            return getattr(self._inner, name)

    return _Shielded(pipeline)
