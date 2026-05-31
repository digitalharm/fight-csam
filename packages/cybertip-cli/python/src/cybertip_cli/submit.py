"""Dry-run wire-payload generator."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from .model import CyberTipReport, redact_for_log, validate_report


@dataclass(slots=True)
class DryRunResult:
    ok: bool
    errors: list[str]
    redacted_summary: dict[str, Any]
    wire_payload: dict[str, Any]


def submit_dry_run(report: CyberTipReport) -> DryRunResult:
    """Validate a report and produce the wire payload that WOULD be
    submitted. Does not perform any network I/O."""
    errors = validate_report(report)
    return DryRunResult(
        ok=not errors,
        errors=errors,
        redacted_summary=redact_for_log(report),
        wire_payload=_to_wire_payload(report),
    )


def _to_wire_payload(report: CyberTipReport) -> dict[str, Any]:
    rp = report.reporting_person
    inc = report.incident
    payload: dict[str, Any] = {
        "CLIENT_REFERENCE": report.client_reference,
        "REPORTING_PERSON": {
            "ORG_NAME": rp.org_name,
            "ESP_ID": rp.esp_id,
            "CONTACT_EMAIL": rp.contact_email,
            **({"CONTACT_NAME": rp.contact_name} if rp.contact_name else {}),
        },
        "INCIDENT": {
            "TYPE": inc.incident_type,
            "DATETIME": inc.incident_datetime_iso,
            "DESCRIPTION": inc.description,
            "SEVERITY": inc.severity,
            "EVIDENCE_REFS": inc.evidence_refs,
        },
    }
    if report.suspect:
        payload["SUSPECT"] = {k.upper(): v for k, v in asdict(report.suspect).items() if v}
    if report.victim:
        payload["VICTIM"] = {k.upper(): v for k, v in asdict(report.victim).items() if v is not None}
    return payload
