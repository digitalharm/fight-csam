"""Core shield implementation. Mirrors packages/csam-shield/node/src/index.ts."""

from __future__ import annotations

import asyncio
import time
import uuid
from typing import Any

from .types import (
    DetectorConfig,
    DetectorResult,
    MatchDecision,
    MatchResponse,
    Scannable,
    ShieldConfig,
)


def create_shield(config: ShieldConfig) -> Shield:
    """Build a Shield from a config.

    Raises ValueError if no detectors are configured — a shield with zero
    detectors silently returns 'nomatch' on everything and is therefore
    worse than no shield at all.

    Example:
        shield = create_shield(ShieldConfig(
            detectors=[
                DetectorConfig(detector="cloudflare-csam-scanning",
                               config={"token": os.environ["CF_TOKEN"]}),
                DetectorConfig(detector="photodna",
                               config={"api_key": os.environ["PHOTODNA_KEY"]}),
            ],
        ))
        result = await shield.scan(ImageBytes(data=..., content_type="image/jpeg"))
        if result.decision == "match":
            # block + escalate to CyberTipline
            ...
    """
    if not config.detectors:
        raise ValueError(
            "csam-shield: refusing to create a shield with zero detectors. "
            "A shield with no detectors silently returns 'nomatch' on everything "
            "and is therefore worse than no shield at all."
        )
    return Shield(config)


class Shield:
    def __init__(self, config: ShieldConfig) -> None:
        self._config = config

    @property
    def detectors(self) -> list[DetectorConfig]:
        return list(self._config.detectors)

    async def scan(self, content: Scannable) -> MatchResponse:
        started_at = time.perf_counter()
        request_id = (
            self._config.request_id() if self._config.request_id else str(uuid.uuid4())
        )

        results = await asyncio.gather(
            *(_run_detector(d, content, request_id) for d in self._config.detectors)
        )

        decision = _decide(results, self._config.strategy)
        duration_ms = int((time.perf_counter() - started_at) * 1000)

        response = MatchResponse(
            decision=decision,
            results=list(results),
            duration_ms=duration_ms,
            request_id=request_id,
            log_summary=_summarize(decision, results, duration_ms, request_id),
        )

        if self._config.on_decision is not None:
            try:
                await self._config.on_decision(response)
            except Exception:
                # Audit-log failures must not break the request path.
                pass

        return response


async def _run_detector(
    config: DetectorConfig, content: Scannable, request_id: str
) -> DetectorResult:
    started_at = time.perf_counter()
    try:
        partial = await asyncio.wait_for(
            _dispatch(config, content, request_id),
            timeout=config.timeout_ms / 1000.0,
        )
        return DetectorResult(
            detector=config.detector,
            matched=partial.get("matched", False),
            confidence=partial.get("confidence"),
            reasoning=partial.get("reasoning"),
            duration_ms=int((time.perf_counter() - started_at) * 1000),
        )
    except asyncio.TimeoutError:
        return DetectorResult(
            detector=config.detector,
            matched=False,
            duration_ms=int((time.perf_counter() - started_at) * 1000),
            error=f"{config.detector} timed out after {config.timeout_ms}ms",
        )
    except Exception as exc:
        return DetectorResult(
            detector=config.detector,
            matched=False,
            duration_ms=int((time.perf_counter() - started_at) * 1000),
            error=str(exc),
        )


async def _dispatch(
    config: DetectorConfig, content: Scannable, request_id: str
) -> dict[str, Any]:
    from . import detectors

    if config.detector == "photodna":
        return await detectors.run_photodna(config.config, content, request_id)
    if config.detector == "cloudflare-csam-scanning":
        return await detectors.run_cloudflare(config.config, content, request_id)
    if config.detector == "ncmec-hash":
        return await detectors.run_ncmec_hash(config.config, content, request_id)
    if config.detector == "pdq":
        return await detectors.run_pdq(config.config, content, request_id)
    if config.detector == "custom":
        return await detectors.run_custom(config.config, content, request_id)
    raise NotImplementedError(
        f"csam-shield: detector {config.detector!r} not implemented in this scaffold. "
        "See https://github.com/digitalharm/digitalharm-oss/blob/main/docs/roadmap.md."
    )


def _decide(results: list[DetectorResult], strategy: str) -> MatchDecision:
    errored = [r for r in results if r.error is not None]
    matched = [r for r in results if r.matched]
    clean_ran = [r for r in results if r.error is None]

    if not clean_ran:
        return "error"

    if strategy == "any-match":
        if matched:
            return "match"
        if errored:
            return "error"
        return "nomatch"
    if strategy == "majority":
        if len(matched) * 2 > len(clean_ran):
            return "match"
        if errored:
            return "error"
        return "nomatch"
    if strategy == "consensus":
        if len(matched) == len(clean_ran) == len(results):
            return "match"
        if errored:
            return "error"
        return "nomatch"
    raise ValueError(f"unknown strategy: {strategy!r}")


def _summarize(
    decision: MatchDecision,
    results: list[DetectorResult],
    duration_ms: int,
    request_id: str,
) -> str:
    detector_summary = ",".join(
        f"{r.detector}=err" if r.error else f"{r.detector}={'match' if r.matched else 'clean'}"
        for r in results
    )
    return f"req={request_id} decision={decision} ms={duration_ms} {detector_summary}"
