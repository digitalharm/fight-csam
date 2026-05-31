"""Detector dispatch table. Mirrors packages/csam-shield/node/src/detectors/.

Each function returns a dict with keys {matched, confidence, reasoning}
that the Shield wraps into a DetectorResult. Scaffold stubs throw
NotImplementedError documenting what the wire protocol requires.
"""

from __future__ import annotations

from typing import Any

from .types import Scannable


async def run_photodna(
    config: dict[str, Any], _content: Scannable, _request_id: str
) -> dict[str, Any]:
    """Microsoft PhotoDNA Cloud Service.

    Free for qualified organizations; access is application-gated.
    https://www.microsoft.com/en-us/photodna
    """
    if not isinstance(config.get("api_key"), str) or not config["api_key"]:
        raise ValueError("photodna config: api_key required (non-empty string)")
    raise NotImplementedError(
        "csam-shield: PhotoDNA adapter is a scaffold stub. Wire-protocol "
        "implementation depends on an approved PhotoDNA application. See "
        "https://github.com/digitalharm/digitalharm-oss/blob/main/docs/roadmap.md."
    )


async def run_cloudflare(
    config: dict[str, Any], _content: Scannable, _request_id: str
) -> dict[str, Any]:
    """Cloudflare CSAM Scanning Tool. Free to all Cloudflare customers.

    https://blog.cloudflare.com/the-csam-scanning-tool/
    """
    if not isinstance(config.get("token"), str) or not config["token"]:
        raise ValueError("cloudflare config: token required (non-empty string)")
    raise NotImplementedError(
        "csam-shield: Cloudflare CSAM Scanning adapter is a scaffold stub. "
        "Wire-protocol implementation pending account-token test access."
    )


async def run_ncmec_hash(
    config: dict[str, Any], _content: Scannable, _request_id: str
) -> dict[str, Any]:
    """NCMEC Hash Sharing API.

    Requires NCMEC ESP credentialing — see docs/sponsorship.md for the
    credential-brokering work this depends on.
    """
    env = config.get("environment")
    if env not in ("industry", "law-enforcement", "npo"):
        raise ValueError(
            "ncmec-hash config: environment must be 'industry', "
            "'law-enforcement', or 'npo'"
        )
    creds = config.get("credentials") or {}
    if not isinstance(creds.get("username"), str) or not isinstance(
        creds.get("password"), str
    ):
        raise ValueError("ncmec-hash config: credentials.{username,password} required")
    raise NotImplementedError(
        "csam-shield: NCMEC Hash Sharing adapter is a scaffold stub. "
        "Requires NCMEC ESP credentialing."
    )


async def run_pdq(
    config: dict[str, Any], _content: Scannable, _request_id: str
) -> dict[str, Any]:
    """Local PDQ matching via hashkit. Depends on hashkit reaching Alpha."""
    if "known_bad" not in config:
        raise ValueError(
            "pdq config: known_bad required (list[bytes] or async () -> list[bytes])"
        )
    raise NotImplementedError(
        "csam-shield: PDQ adapter is a scaffold stub. Depends on hashkit "
        "reaching Alpha."
    )


async def run_custom(
    config: dict[str, Any], content: Scannable, request_id: str
) -> dict[str, Any]:
    """Escape hatch for adopters wiring a non-built-in detector."""
    scan = config.get("scan")
    if not callable(scan):
        raise ValueError("custom config: scan must be an awaitable callable")
    result = await scan(content, request_id)
    if not isinstance(result, dict):
        raise ValueError("custom scan must return a dict")
    return {
        "matched": bool(result.get("matched", False)),
        "confidence": result.get("confidence"),
        "reasoning": result.get("reasoning"),
    }
