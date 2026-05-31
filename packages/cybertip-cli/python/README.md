# cybertip-cli (Python)

NCMEC CyberTipline report submission CLI and library. Python sibling
of [`@digitalharm/cybertip-cli`](../node).

**Status:** see [`STATUS`](../STATUS) — canonical state at
[`docs/roadmap.md`](../../../docs/roadmap.md). **License:** Apache 2.0.

**Production submission is gated** on outside-counsel review of the
[scope brief](../docs/counsel-scope-brief.md) and an active NCMEC ESP
credential. The scaffold provides the data model, validation, redaction,
and a `dry-run` mode that produces the wire payload without network I/O.

## Install

```bash
pip install cybertip-cli
```

## Quick start

```python
from cybertip_cli import CyberTipReport, submit_dry_run

report = CyberTipReport(
    client_reference="cybertip-myorg-001",
    reporting_person={"org_name": "MyOrg", "esp_id": "ESP-001",
                       "contact_email": "trust@myorg.example"},
    incident={
        "incident_type": "csam-distribution",
        "incident_datetime_iso": "2026-05-30T12:00:00Z",
        "description": "Detected via CSAM-Shield on upload at 2026-05-30T12:00Z.",
        "severity": "A",
        "evidence_refs": ["urn:evidencevault:abc123"],
    },
)

result = submit_dry_run(report)
if not result.ok:
    for err in result.errors:
        print(f"ERROR: {err}")
```

## CLI

```bash
cybertip validate report.json
cybertip dry-run report.json
cybertip submit report.json     # BLOCKED in scaffold
```
