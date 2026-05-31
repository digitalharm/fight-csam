"""cybertip-cli: NCMEC CyberTipline report submission.

Scaffold stage. Data model, validation, redaction, and dry-run wire
payload generation are implemented. Production submission gated on
counsel review and an active NCMEC ESP credential.

Status: see https://github.com/digitalharm/digitalharm-oss/blob/main/docs/roadmap.md
"""

from __future__ import annotations

__version__ = "0.0.1"

from .model import (
    CyberTipReport,
    IncidentDetails,
    IncidentType,
    ReportingPerson,
    SeverityTier,
    SuspectInfo,
    VictimInfo,
    generate_client_reference,
    redact_for_log,
    validate_report,
)
from .submit import DryRunResult, submit_dry_run

__all__ = [
    "CyberTipReport",
    "IncidentDetails",
    "IncidentType",
    "ReportingPerson",
    "SeverityTier",
    "SuspectInfo",
    "VictimInfo",
    "DryRunResult",
    "generate_client_reference",
    "redact_for_log",
    "submit_dry_run",
    "validate_report",
]
