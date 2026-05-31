"""Dataset readers.

Scaffold implementations of common training-dataset formats. Each
yields DatasetEntry rows; none fetches imagery — that's the loader's
job. Readers exist so trainguard understands the metadata shape.
"""

from __future__ import annotations

import json
from typing import Iterable, Iterator

from .types import DatasetEntry


def parse_hash_lines(lines: Iterable[str]) -> Iterator[str]:
    """Yield normalised lowercase hex hashes from ``lines``.

    The on-disk hash-list convention shared with hashstream (kept local here
    so trainguard has no cross-track import): blank lines and ``#`` comments
    are skipped, surrounding whitespace is stripped, and a non-hex,
    non-comment line raises ``ValueError`` so a malformed list fails loudly
    rather than silently screening against garbage. Hex length is NOT checked
    here — that is the caller's concern (e.g. HashListFileProvider enforces
    32-byte PDQ width).
    """
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        try:
            int(line, 16)
        except ValueError as exc:
            raise ValueError(f"non-hex hash line: {line!r}") from exc
        yield line.lower()


class JsonlReader:
    """JSONL reader: one entry per line, each a JSON object with at
    least `id`, optionally `url`/`local_path` and `pdq_hash` (hex)."""

    def __init__(self, path: str) -> None:
        self._path = path

    def __iter__(self) -> Iterator[DatasetEntry]:
        with open(self._path, "r", encoding="utf-8") as f:
            for line_num, line in enumerate(f, start=1):
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError as e:
                    raise ValueError(
                        f"{self._path}:{line_num}: invalid JSON ({e.msg})"
                    ) from e
                if "id" not in obj:
                    raise ValueError(
                        f"{self._path}:{line_num}: 'id' field required"
                    )
                hash_hex = obj.get("pdq_hash")
                pdq_hash = bytes.fromhex(hash_hex) if isinstance(hash_hex, str) else None
                yield DatasetEntry(
                    id=str(obj["id"]),
                    url=obj.get("url"),
                    local_path=obj.get("local_path"),
                    pdq_hash=pdq_hash,
                    extra_hashes={
                        k: bytes.fromhex(v)
                        for k, v in obj.get("extra_hashes", {}).items()
                        if isinstance(v, str)
                    },
                )


class LaionJsonReader:
    """LAION-format JSON manifest reader.

    Reads a single JSON document of the shape::

        {"items": [{"id": "...", "url": "...", "hash": "<hex>"}, ...]}

    and yields one :class:`DatasetEntry` per item. ``id`` and ``url`` are
    required on every item; ``hash`` is the item's precomputed PDQ hash as a
    hex string and is decoded into ``DatasetEntry.pdq_hash`` (an item without
    ``hash`` yields an entry with ``pdq_hash=None``, which the pipeline counts
    but cannot match — trainguard never fetches ``url`` to hash it itself).

    This is the operator-facing manifest format used by the end-to-end scan
    path. The Parquet-backed :class:`LaionReader` remains a separate scaffold
    for the columnar metadata variant.

    The document is parsed eagerly on construction so a malformed manifest
    fails fast; entries are materialised lazily on iteration. A bad top-level
    shape, or an item missing a required field, raises ``ValueError`` rather
    than silently screening a truncated dataset.
    """

    def __init__(self, path: str) -> None:
        self._path = path
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict) or "items" not in data:
            raise ValueError(
                f"{path}: expected a JSON object with an 'items' key"
            )
        items = data["items"]
        if not isinstance(items, list):
            raise ValueError(f"{path}: 'items' must be a list")
        self._items = items

    def __iter__(self) -> Iterator[DatasetEntry]:
        for i, item in enumerate(self._items):
            if not isinstance(item, dict):
                raise ValueError(f"{self._path}: item {i} is not an object")
            try:
                entry_id = str(item["id"])
                url = str(item["url"])
            except KeyError as exc:
                raise ValueError(
                    f"{self._path}: item {i} missing required field {exc}"
                ) from exc
            hash_hex = item.get("hash")
            pdq_hash = bytes.fromhex(hash_hex) if isinstance(hash_hex, str) else None
            yield DatasetEntry(
                id=entry_id,
                url=url,
                local_path=None,
                pdq_hash=pdq_hash,
            )


class LaionReader:
    """LAION-format reader (parquet metadata).

    Scaffold stage. LAION metadata is parquet with columns including
    url, sample_id, and (in some variants) precomputed hashes. The
    real implementation lands when pyarrow is in dev deps. For the
    operator-facing JSON manifest format, use :class:`LaionJsonReader`.
    """

    def __init__(self, parquet_path: str) -> None:
        self._path = parquet_path

    def __iter__(self) -> Iterable[DatasetEntry]:
        raise NotImplementedError(
            "trainguard: LaionReader (parquet) is a scaffold stub. "
            "Install with `pip install trainguard[laion]` and the reader "
            "lands once we have a defensible parquet schema spec. For the "
            "JSON manifest format use LaionJsonReader."
        )


class WebdatasetReader:
    """WebDataset (tar shards) reader.

    Scaffold stage. WebDataset is the dominant streaming format for
    large training runs; the reader lands once we have a defensible
    handling pattern for the in-tar metadata files.
    """

    def __init__(self, shard_glob: str) -> None:
        self._glob = shard_glob

    def __iter__(self) -> Iterable[DatasetEntry]:
        raise NotImplementedError(
            "trainguard: WebdatasetReader is a scaffold stub."
        )
