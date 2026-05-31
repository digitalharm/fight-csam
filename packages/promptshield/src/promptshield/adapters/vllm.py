"""vLLM adapter.

vLLM supports a LogitsProcessor for influencing generation; for
prompt-side gating we use the simpler `pre_request` hook pattern —
the classifier runs on the incoming prompt before vLLM starts token
generation. On a block verdict, vLLM returns a refusal response
instead of running inference.

Scaffold stage: API surface only. Concrete vLLM integration lands
once vllm is in dev deps.
"""

from __future__ import annotations

from typing import Awaitable, Callable, Optional

from ..classifier import PromptClassifier
from ..types import ClassificationResult


def vllm_guard(
    classifier: Optional[PromptClassifier] = None,
    refusal_text: str = (
        "I can't help with that request. If you're a researcher or operator "
        "investigating prompt classifiers, contact the maintainers."
    ),
) -> Callable[[str], Awaitable[Optional[str]]]:
    """Return an async hook callable that vLLM's server harness can invoke
    before token generation.

    The callable returns:
      - None if generation should proceed
      - a string with a refusal message if generation should not proceed

    Integration shape (the actual wiring lives in vLLM's server config):

        from promptshield.adapters.vllm import vllm_guard
        guard = vllm_guard()

        async def on_request(prompt: str) -> str | None:
            return await guard(prompt)
    """
    cls = classifier or PromptClassifier.from_default()

    async def _guard(prompt: str) -> Optional[str]:
        result: ClassificationResult = cls.classify(prompt)
        if result.verdict == "block":
            return refusal_text
        return None

    return _guard
