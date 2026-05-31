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
)
from .pipeline import scan_dataset
from .readers import LaionReader, WebdatasetReader, JsonlReader

__all__ = [
    "ComplianceReport",
    "DatasetEntry",
    "HashListSource",
    "JsonlReader",
    "LaionReader",
    "ScanResult",
    "WebdatasetReader",
    "scan_dataset",
]
