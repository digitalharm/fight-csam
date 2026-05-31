"""Submission paths: dry-run, sandbox simulation, and a blocked production gate.

There is intentionally NO real network path. dry-run and sandbox both perform
zero network I/O; production is absent (not merely disabled) and raises. The
project holds no ESP credentials and ships no default endpoint.
"""

from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field
from enum import Enum
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
    submitted. Does not perform any network I/O.

    Retained for backward compatibility; ``submit(report, SubmitMode.DRY_RUN)``
    is the mode-aware equivalent.
    """
    errors = validate_report(report)
    return DryRunResult(
        ok=not errors,
        errors=errors,
        redacted_summary=redact_for_log(report),
        wire_payload=_to_wire_payload(report),
    )


COUNSEL_REQUIRED_MESSAGE = (
    "counsel sign-off required: production CyberTipline submission is blocked "
    "until outside counsel signs off on packages/cybertip-cli/docs/counsel-scope-brief.md"
)


class ProductionSubmitBlocked(RuntimeError):
    """Raised when production submission is attempted.

    The production POST path is absent by design — not merely disabled —
    pending outside-counsel sign-off and a real ESP credential.
    """

    def __init__(self, message: str = COUNSEL_REQUIRED_MESSAGE) -> None:
        super().__init__(message)


class SubmitMode(str, Enum):
    DRY_RUN = "dry-run"
    SANDBOX = "sandbox"
    PRODUCTION = "production"


@dataclass(slots=True)
class SubmitResult:
    ok: bool
    mode: SubmitMode
    errors: list[str]
    redacted_summary: dict[str, Any]
    wire_payload: dict[str, Any]
    curl_preview: str = ""
    log_lines: list[str] = field(default_factory=list)


def submit(
    report: CyberTipReport,
    mode: SubmitMode = SubmitMode.DRY_RUN,
    sandbox_url: str | None = None,
) -> SubmitResult:
    """Mode-aware submission.

    - ``DRY_RUN`` (default): validate + build the wire payload. No network, no curl.
    - ``SANDBOX``: additionally emit the curl-equivalent for an operator-supplied
      sandbox URL (``sandbox_url`` arg or ``NCMEC_SANDBOX_URL`` env var). Performs
      NO network I/O; the operator runs the emitted request themselves. The
      Authorization header is always the ``<ESP_CREDENTIAL>`` placeholder.
    - ``PRODUCTION``: raises :class:`ProductionSubmitBlocked`. The real POST path
      is absent by design.
    """
    if mode is SubmitMode.PRODUCTION:
        raise ProductionSubmitBlocked()

    errors = validate_report(report)
    redacted = redact_for_log(report)
    wire = _to_wire_payload(report)
    log_lines: list[str] = []
    curl_preview = ""

    if mode is SubmitMode.SANDBOX:
        url = sandbox_url or os.environ.get("NCMEC_SANDBOX_URL", "")
        if not url:
            errors.append(
                "sandbox mode needs a target URL: pass --sandbox-url or set "
                "NCMEC_SANDBOX_URL (operator-supplied; there is no default — the "
                "project holds no ESP credentials)."
            )
        elif not errors:
            curl_preview = _build_curl_preview(url, wire)
            log_lines.append(
                f"SIMULATED sandbox submission to {url} — NO network I/O was "
                "performed. Run the emitted curl yourself with a real ESP credential."
            )
            log_lines.append(f"redacted summary: {json.dumps(redacted)}")

    return SubmitResult(
        ok=not errors,
        mode=mode,
        errors=errors,
        redacted_summary=redacted,
        wire_payload=wire,
        curl_preview=curl_preview,
        log_lines=log_lines,
    )


def _build_curl_preview(url: str, wire_payload: dict[str, Any]) -> str:
    """Build the curl-equivalent for the operator to run. Never emits a real credential."""
    body = json.dumps(wire_payload).replace("'", "'\\''")
    return (
        f"curl -X POST '{url}' \\\n"
        "  -H 'Content-Type: application/json' \\\n"
        "  -H 'Authorization: Bearer <ESP_CREDENTIAL>' \\\n"
        f"  -d '{body}'"
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
