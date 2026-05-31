"""trainguard: pre-flight CSAM screening for AI training datasets.

Runs before model fitting starts. Screens dataset entries against
caller-supplied hash lists (sourced from NCMEC, IWF, Project Arachnid
via hashstream) and produces a ComplianceReport with chain-of-custody
metadata that audit can verify.

Motivated by the Stanford Internet Observatory's 2023 finding of CSAM
in LAION-5B. The pre-flight pattern means the contaminated material is
identified and excluded before training compute is spent.

Status: see https://github.com/digitalharm/digitalharm-oss/blob/main/docs/roadmap.md
Safety: https://github.com/digitalharm/digitalharm-oss/blob/main/docs/safety-policy.md
"""

from __future__ import annotations

__version__ = "0.0.1"

from .types import (
    ComplianceReport,
    DatasetEntry,
    HashListSource,
    ScanResult,
    hamming_distance,
)
from .pipeline import (
    HashListFileProvider,
    HashstreamProvider,
    InMemoryHashListProvider,
    scan_dataset,
    signing_payload,
)
from .readers import (
    JsonlReader,
    LaionJsonReader,
    LaionReader,
    WebdatasetReader,
    parse_hash_lines,
)

__all__ = [
    "ComplianceReport",
    "DatasetEntry",
    "HashListFileProvider",
    "HashListSource",
    "HashstreamProvider",
    "InMemoryHashListProvider",
    "JsonlReader",
    "LaionJsonReader",
    "LaionReader",
    "ScanResult",
    "WebdatasetReader",
    "hamming_distance",
    "parse_hash_lines",
    "scan_dataset",
    "signing_payload",
]
