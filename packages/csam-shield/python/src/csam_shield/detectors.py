"""Detector dispatch table. Mirrors packages/csam-shield/node/src/detectors/.

Each function returns a dict with keys {matched, confidence, reasoning}
that the Shield wraps into a DetectorResult. Scaffold stubs throw
NotImplementedError documenting what the wire protocol requires.
"""

from __future__ import annotations

from typing import Any

from .types import ImageBytes, Scannable, VideoBytes


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


def hamming_distance(a: bytes, b: bytes) -> float:
    """Bitwise Hamming distance between two equal-length byte strings.

    Returns ``math.inf`` for mismatched lengths so callers treat
    incomparable hashes as "never a match" rather than raising.
    """
    if len(a) != len(b):
        return float("inf")
    distance = 0
    for x, y in zip(a, b):
        distance += bin(x ^ y).count("1")
    return distance


def _derive_synthetic_hash(data: bytes, width: int = 32) -> bytes:
    """Deterministic fixed-width synthetic hash. Mirrors deriveSyntheticHash
    in node/src/detectors/pdq.ts.

    This is NOT real PDQ; it is a stand-in so the detector path is testable
    before hashkit's perceptual port lands. For real matching, pass a
    pre-computed hash via ``config['hash']``.
    """
    out = bytearray((i * 31 + 7) & 0xFF for i in range(width))
    for i, byte in enumerate(data):
        lane = i % width
        out[lane] = (out[lane] + byte * 131 + i) & 0xFF
    carry = 0
    for i in range(width):
        mixed = (out[i] ^ (((carry << 3) | (carry >> 5)) & 0xFF)) & 0xFF
        out[i] = mixed
        carry = mixed
    return bytes(out)


def _resolve_query_hash(config: dict[str, Any], content: Scannable) -> bytes | None:
    precomputed = config.get("hash")
    if isinstance(precomputed, (bytes, bytearray)):
        return bytes(precomputed)
    if isinstance(content, (ImageBytes, VideoBytes)):
        return _derive_synthetic_hash(content.data)
    return None


async def run_pdq(
    config: dict[str, Any], content: Scannable, _request_id: str
) -> dict[str, Any]:
    """Local PDQ-list matching against an operator-supplied hash list.

    Matches a content hash against ``config['known_bad']`` (the operator's
    list of known-bad PDQ hashes) using bitwise Hamming distance. No
    credentials, no network. Returns matched=True if any list entry is
    within ``config['threshold']`` (default 31) Hamming distance.

    ``known_bad`` may be a list of byte strings or an awaitable callable
    returning one. ``hash`` may be supplied to use a pre-computed query
    hash (the dependency-free path); otherwise a deterministic synthetic
    hash is derived from the content bytes.
    """
    known_bad = config.get("known_bad")
    if known_bad is None:
        raise ValueError(
            "pdq config: known_bad required (list[bytes] or async () -> list[bytes])"
        )

    threshold = config.get("threshold", 31)
    if not isinstance(threshold, int) or threshold < 0 or threshold > 256:
        raise ValueError("pdq config: threshold must be an int between 0 and 256")

    precomputed = config.get("hash")
    if precomputed is not None and not isinstance(precomputed, (bytes, bytearray)):
        raise ValueError("pdq config: hash must be bytes if provided")

    query_hash = _resolve_query_hash(config, content)
    if query_hash is None:
        return {
            "matched": False,
            "reasoning": (
                "pdq: cannot match URL-only content locally; pass a "
                "pre-computed hash via config['hash']."
            ),
        }

    if callable(known_bad):
        hash_list = await known_bad()
    else:
        hash_list = known_bad

    best = float("inf")
    for entry in hash_list:
        entry_bytes = bytes(entry)
        distance = hamming_distance(query_hash, entry_bytes)
        if distance < best:
            best = distance
        if best <= threshold:
            break

    matched = best <= threshold
    bits = len(query_hash) * 8
    result: dict[str, Any] = {
        "matched": matched,
        "reasoning": (
            f"pdq: matched operator list (minHamming={best} <= threshold={threshold})"
            if matched
            else (
                f"pdq: no match (minHamming="
                f"{'n/a' if best == float('inf') else best} > "
                f"threshold={threshold}, list={len(hash_list)})"
            )
        ),
    }
    if matched and best != float("inf"):
        result["confidence"] = max(0.0, min(1.0, 1 - best / max(1, bits)))
    return result


def create_pdq_list_detector(
    hash_list: Any,
    threshold: int | None = None,
    hash: bytes | None = None,
    timeout_ms: int = 5000,
):
    """Convenience builder for a PDQ-list ``DetectorConfig``.

    Wires an operator-supplied hash list into a ready-to-use detector you
    can drop straight into ``ShieldConfig(detectors=[...])``.
    """
    from .types import DetectorConfig

    cfg: dict[str, Any] = {"known_bad": hash_list}
    if threshold is not None:
        cfg["threshold"] = threshold
    if hash is not None:
        cfg["hash"] = hash
    return DetectorConfig(detector="pdq", config=cfg, timeout_ms=timeout_ms)


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
