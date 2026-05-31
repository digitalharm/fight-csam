"""Smoke tests for cybertip_cli."""

from __future__ import annotations

from cybertip_cli import (
    CyberTipReport,
    IncidentDetails,
    ReportingPerson,
    VictimInfo,
    generate_client_reference,
    redact_for_log,
    submit_dry_run,
    validate_report,
)


def valid_report() -> CyberTipReport:
    return CyberTipReport(
        client_reference="cybertip-test-12345678",
        reporting_person=ReportingPerson(
            org_name="Test Org",
            esp_id="ESP-TEST-001",
            contact_email="trust@test.example",
        ),
        incident=IncidentDetails(
            incident_type="csam-distribution",
            incident_datetime_iso="2026-05-30T12:00:00Z",
            description="Detected via CSAM-Shield on file upload at 2026-05-30T12:00Z.",
            severity="A",
            evidence_refs=["urn:evidencevault:abc123"],
        ),
    )


def test_validate_valid_report() -> None:
    assert validate_report(valid_report()) == []


def test_validate_missing_client_reference() -> None:
    r = valid_report()
    r.client_reference = ""
    errors = validate_report(r)
    assert any("client_reference" in e for e in errors)


def test_validate_short_description() -> None:
    r = valid_report()
    r.incident.description = "short"
    errors = validate_report(r)
    assert any("description" in e for e in errors)


def test_validate_bad_datetime() -> None:
    r = valid_report()
    r.incident.incident_datetime_iso = "yesterday"
    errors = validate_report(r)
    assert any("ISO 8601" in e for e in errors)


def test_validate_empty_evidence_refs() -> None:
    r = valid_report()
    r.incident.evidence_refs = []
    errors = validate_report(r)
    assert any("evidence_refs" in e for e in errors)


def test_validate_age_out_of_range() -> None:
    r = valid_report()
    r.victim = VictimInfo(age=25)
    errors = validate_report(r)
    assert any("victim.age" in e for e in errors)


def test_validate_bad_email() -> None:
    r = valid_report()
    r.reporting_person.contact_email = "not-an-email"
    errors = validate_report(r)
    assert any("contact_email" in e for e in errors)


def test_generate_client_reference_shape() -> None:
    ref = generate_client_reference(now_ms=1717000000000)
    assert ref.startswith("cybertip-1717000000000-")
    suffix = ref.rsplit("-", 1)[-1]
    assert len(suffix) == 8
    assert all(c in "0123456789abcdef" for c in suffix)


def test_redact_for_log_strips_contact_details() -> None:
    summary = redact_for_log(valid_report())
    assert summary["incident_type"] == "csam-distribution"
    assert summary["evidence_count"] == 1
    # Email should not appear anywhere in the redacted summary.
    import json as _json
    serialized = _json.dumps(summary)
    assert "trust@test.example" not in serialized


def test_dry_run_produces_wire_payload() -> None:
    result = submit_dry_run(valid_report())
    assert result.ok is True
    assert result.errors == []
    assert "REPORTING_PERSON" in result.wire_payload
    assert "INCIDENT" in result.wire_payload


def test_dry_run_returns_errors_on_invalid() -> None:
    r = valid_report()
    r.client_reference = ""
    result = submit_dry_run(r)
    assert result.ok is False
    assert len(result.errors) > 0
