"""CyberTipline report data model. Mirrors the TS package."""

from __future__ import annotations

import re
import secrets
import time
from dataclasses import dataclass, field
from typing import Any, Literal


IncidentType = Literal[
    "child-pornography",
    "online-enticement",
    "child-sex-trafficking",
    "child-sex-tourism",
    "child-sexual-molestation",
    "csam-distribution",
    "ai-generated-csam",
]

SeverityTier = Literal["A", "B", "C", "unknown"]


@dataclass(slots=True)
class ReportingPerson:
    org_name: str
    esp_id: str
    contact_email: str
    contact_name: str | None = None


@dataclass(slots=True)
class IncidentDetails:
    incident_type: IncidentType
    incident_datetime_iso: str
    description: str
    severity: SeverityTier
    evidence_refs: list[str]


@dataclass(slots=True)
class SuspectInfo:
    ip_addresses: list[str] = field(default_factory=list)
    email_addresses: list[str] = field(default_factory=list)
    screen_names: list[str] = field(default_factory=list)
    known_urls: list[str] = field(default_factory=list)


@dataclass(slots=True)
class VictimInfo:
    victim_user_ref: str | None = None
    age: int | None = None


@dataclass(slots=True)
class CyberTipReport:
    client_reference: str
    reporting_person: ReportingPerson
    incident: IncidentDetails
    suspect: SuspectInfo | None = None
    victim: VictimInfo | None = None
    operator_metadata: dict[str, Any] = field(default_factory=dict)


_CLIENT_REF_RE = re.compile(r"^[A-Za-z0-9_.:-]{8,128}$")
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+$")
_ISO_RE = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$"
)


def validate_report(report: CyberTipReport) -> list[str]:
    """Validate report shape. Returns list of human-readable errors;
    empty list means valid. Does NOT validate the content — that's the
    operator's responsibility."""
    errors: list[str] = []

    if not report.client_reference:
        errors.append("client_reference is required (idempotency key)")
    elif not _CLIENT_REF_RE.match(report.client_reference):
        errors.append("client_reference must be 8-128 chars, alphanumeric + _.-:")

    rp = report.reporting_person
    if not rp.org_name:
        errors.append("reporting_person.org_name required")
    if not rp.esp_id:
        errors.append("reporting_person.esp_id required")
    if not rp.contact_email or not _EMAIL_RE.match(rp.contact_email):
        errors.append("reporting_person.contact_email invalid")

    inc = report.incident
    if not inc.description or len(inc.description) < 10:
        errors.append("incident.description must be at least 10 chars")
    if not _ISO_RE.match(inc.incident_datetime_iso or ""):
        errors.append("incident.incident_datetime_iso must be ISO 8601")
    if not inc.evidence_refs:
        errors.append("incident.evidence_refs must contain at least one pointer")

    if report.victim and report.victim.age is not None:
        age = report.victim.age
        if not isinstance(age, int) or age < 0 or age > 17:
            errors.append("victim.age must be an integer 0-17")

    return errors


def generate_client_reference(now_ms: int | None = None) -> str:
    """Generate a default client reference (idempotency key)."""
    epoch = now_ms if now_ms is not None else int(time.time() * 1000)
    rand_hex = secrets.token_hex(4)
    return f"cybertip-{epoch}-{rand_hex}"


def redact_for_log(report: CyberTipReport) -> dict[str, Any]:
    """Produce a redacted summary safe for logging.

    Strips contact details, evidence pointers (kept as count only),
    and operator metadata values (kept as key list).
    """
    return {
        "client_reference": report.client_reference,
        "incident_type": report.incident.incident_type,
        "severity": report.incident.severity,
        "evidence_count": len(report.incident.evidence_refs),
        "org_name": report.reporting_person.org_name,
        "metadata_keys": list(report.operator_metadata.keys()),
    }
