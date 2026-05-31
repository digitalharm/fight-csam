"""Dataset readers.

Scaffold implementations of common training-dataset formats. Each
yields DatasetEntry rows; none fetches imagery — that's the loader's
job. Readers exist so trainguard understands the metadata shape.
"""

from __future__ import annotations

import json
from typing import Iterable, Iterator

from .types import DatasetEntry


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


class LaionReader:
    """LAION-format reader (parquet metadata).

    Scaffold stage. LAION metadata is parquet with columns including
    url, sample_id, and (in some variants) precomputed hashes. The
    real implementation lands when pyarrow is in dev deps.
    """

    def __init__(self, parquet_path: str) -> None:
        self._path = parquet_path

    def __iter__(self) -> Iterable[DatasetEntry]:
        raise NotImplementedError(
            "trainguard: LaionReader is a scaffold stub. "
            "Install with `pip install trainguard[laion]` and the reader "
            "lands once we have a defensible parquet schema spec."
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
